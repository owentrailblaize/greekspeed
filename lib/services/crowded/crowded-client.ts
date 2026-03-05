/**
 * Crowded API Client
 * Server-side only - handles all Crowded API interactions
 * 
 * Features:
 * - Environment-based configuration (sandbox vs production)
 * - Retry logic for transient failures
 * - Request/response logging for debugging
 * - Comprehensive error handling
 */

import type { CrowdedApiErrorResponse } from './types';

// Environment-based configuration
const getApiBaseUrl = (): string => {
  const env = process.env.NODE_ENV || 'development';
  const customUrl = process.env.CROWDED_API_BASE_URL;
  
  if (customUrl) {
    return customUrl;
  }
  
  // Default URLs based on environment
  if (env === 'production') {
    return 'https://api.crowded.me/api/v1';
  }
  
  // Development/staging
  return 'https://api.crowded.me/api/v1';
};

const CROWDED_API_BASE_URL = getApiBaseUrl();
const CROWDED_API_KEY = process.env.CROWDED_API_KEY;

// Retry configuration
const MAX_RETRIES = 3;
const BASE_RETRY_DELAY_MS = 1000; // 1 second base delay
const MAX_RETRY_DELAY_MS = 5000; // Max 5 seconds between retries
const FETCH_TIMEOUT_MS = 30000; // 30 seconds timeout

// Logging configuration
const ENABLE_LOGGING = process.env.NODE_ENV === 'development' || process.env.CROWDED_ENABLE_LOGGING === 'true';

/**
 * Custom error class for Crowded API errors
 */
export class CrowdedApiError extends Error {
  constructor(
    public statusCode: number,
    public error: string,
    message?: string,
    public details?: unknown
  ) {
    super(message || error);
    this.name = 'CrowdedApiError';
  }
}

/**
 * Check if an error is retryable (transient failure)
 */
function isRetryableError(error: unknown): boolean {
  if (error instanceof CrowdedApiError) {
    // Retry on 5xx errors and rate limiting (429)
    return error.statusCode >= 500 || error.statusCode === 429;
  }
  
  if (error instanceof Error) {
    // Retry on network errors
    return (
      error.message.includes('timeout') ||
      error.message.includes('network') ||
      error.message.includes('ECONNRESET') ||
      error.message.includes('ETIMEDOUT')
    );
  }
  
  return false;
}

/**
 * Calculate exponential backoff delay
 */
function getRetryDelay(attempt: number): number {
  const delay = Math.min(
    BASE_RETRY_DELAY_MS * Math.pow(2, attempt - 1),
    MAX_RETRY_DELAY_MS
  );
  // Add jitter to prevent thundering herd
  return delay + Math.random() * 1000;
}

/**
 * Log request/response for debugging
 */
function logRequest(
  method: string,
  endpoint: string,
  options?: RequestInit,
  attempt?: number
): void {
  if (!ENABLE_LOGGING) return;
  
  const logData: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    method,
    endpoint,
    environment: process.env.NODE_ENV || 'unknown',
  };
  
  if (attempt) {
    logData.attempt = attempt;
  }
  
  if (options?.body) {
    try {
      const body = JSON.parse(options.body as string);
      logData.requestBody = body;
    } catch {
      logData.requestBody = '[Unable to parse]';
    }
  }
  
  console.log(`[Crowded API] ${method} ${endpoint}`, logData);
}

function logResponse(
  method: string,
  endpoint: string,
  status: number,
  data?: unknown,
  duration?: number
): void {
  if (!ENABLE_LOGGING) return;
  
  console.log(`[Crowded API] ${method} ${endpoint} → ${status}`, {
    timestamp: new Date().toISOString(),
    status,
    duration: duration ? `${duration}ms` : undefined,
    response: data ? (typeof data === 'object' ? JSON.stringify(data).substring(0, 200) : data) : undefined,
  });
}

function logError(
  method: string,
  endpoint: string,
  error: unknown,
  attempt?: number
): void {
  if (!ENABLE_LOGGING) return;
  
  const errorData: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    method,
    endpoint,
    error: error instanceof Error ? error.message : String(error),
  };
  
  if (error instanceof CrowdedApiError) {
    errorData.statusCode = error.statusCode;
    errorData.errorCode = error.error;
  }
  
  if (attempt) {
    errorData.attempt = attempt;
  }
  
  console.error(`[Crowded API Error] ${method} ${endpoint}`, errorData);
}

/**
 * Base fetch function for Crowded API calls with retry logic
 */
async function crowdedFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  retryAttempt = 1
): Promise<T> {
  if (!CROWDED_API_KEY) {
    throw new Error('CROWDED_API_KEY is not configured. Please add it to your environment variables.');
  }

  const method = options.method || 'GET';
  const url = `${CROWDED_API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  const startTime = Date.now();
  
  // Log request with full URL for debugging
  if (ENABLE_LOGGING) {
    console.log(`[Crowded API] ${method} ${url}`, {
      endpoint,
      baseUrl: CROWDED_API_BASE_URL,
      hasApiKey: !!CROWDED_API_KEY,
    });
  }
  
  // Log request
  logRequest(method, endpoint, options, retryAttempt > 1 ? retryAttempt : undefined);

  try {
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'X-API-Key': CROWDED_API_KEY,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);
    const duration = Date.now() - startTime;

    // Parse response
    let data: T | CrowdedApiErrorResponse;
    let responseText: string = '';
    try {
      responseText = await response.text();
      data = responseText ? JSON.parse(responseText) : {};
    } catch (parseError) {
      // If response is not JSON, capture the actual response for debugging
      const htmlPreview = responseText.substring(0, 500); // First 500 chars
      const contentType = response.headers.get('content-type') || '';
      const isHtml = responseText.trim().startsWith('<!') || contentType.includes('text/html');
      
      data = {
        error: 'Invalid JSON response',
        message: `Failed to parse response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`,
        statusCode: response.status,
        details: {
          contentType,
          isHtml,
          responsePreview: htmlPreview,
          responseLength: responseText.length,
          url: response.url || url,
        },
      } as CrowdedApiErrorResponse;
    }

    // Handle error responses
    if (!response.ok) {
      const errorResponse = data as CrowdedApiErrorResponse;
      const error = new CrowdedApiError(
        response.status,
        errorResponse.error || 'Crowded API error',
        errorResponse.message,
        errorResponse.details
      );

      logError(method, endpoint, error, retryAttempt > 1 ? retryAttempt : undefined);

      // Retry logic for transient failures
      if (isRetryableError(error) && retryAttempt < MAX_RETRIES) {
        const delay = getRetryDelay(retryAttempt);
        logRequest(method, endpoint, options, retryAttempt + 1);
        console.log(`[Crowded API] Retrying ${method} ${endpoint} after ${delay}ms (Attempt ${retryAttempt + 1}/${MAX_RETRIES})`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return crowdedFetch<T>(endpoint, options, retryAttempt + 1);
      }

      throw error;
    }

    // Log successful response
    logResponse(method, endpoint, response.status, data, duration);

    return data as T;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    // Handle abort (timeout)
    if (error instanceof Error && error.name === 'AbortError') {
      const timeoutError = new CrowdedApiError(
        408,
        'Request timeout',
        `Request to ${endpoint} timed out after ${FETCH_TIMEOUT_MS}ms`
      );
      logError(method, endpoint, timeoutError, retryAttempt > 1 ? retryAttempt : undefined);

      // Retry timeout errors
      if (retryAttempt < MAX_RETRIES) {
        const delay = getRetryDelay(retryAttempt);
        console.log(`[Crowded API] Retrying ${method} ${endpoint} after timeout (Attempt ${retryAttempt + 1}/${MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return crowdedFetch<T>(endpoint, options, retryAttempt + 1);
      }

      throw timeoutError;
    }

    // Enhanced error logging for network errors
    const errorDetails: Record<string, unknown> = {
      url,
      method,
      endpoint,
      duration: `${duration}ms`,
      baseUrl: CROWDED_API_BASE_URL,
      retryAttempt,
    };

    // Capture more details about the fetch error
    if (error instanceof Error) {
      errorDetails.errorName = error.name;
      errorDetails.errorMessage = error.message;
      errorDetails.errorStack = error.stack?.split('\n').slice(0, 5);
      
      // Check for specific error types
      if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
        errorDetails.errorType = 'DNS resolution failed';
        errorDetails.suggestion = 'Check if the API base URL is correct';
      } else if (error.message.includes('ECONNREFUSED') || error.message.includes('connection refused')) {
        errorDetails.errorType = 'Connection refused';
        errorDetails.suggestion = 'API server may be down or URL is incorrect';
      } else if (error.message.includes('certificate') || error.message.includes('SSL') || error.message.includes('TLS')) {
        errorDetails.errorType = 'SSL/TLS error';
        errorDetails.suggestion = 'Check SSL certificate or verify the API URL';
      } else if (error.message.includes('timeout')) {
        errorDetails.errorType = 'Request timeout';
        errorDetails.suggestion = 'API server is not responding';
      } else if (error.message.includes('fetch failed')) {
        errorDetails.errorType = 'Network fetch failed';
        errorDetails.suggestion = 'Check network connectivity, DNS resolution, or API base URL';
      }
    }

    console.error('[Crowded API] Network error details:', errorDetails);

    // Handle network errors
    if (isRetryableError(error) && retryAttempt < MAX_RETRIES) {
      const delay = getRetryDelay(retryAttempt);
      logError(method, endpoint, error, retryAttempt);
      console.log(`[Crowded API] Retrying ${method} ${endpoint} after network error (Attempt ${retryAttempt + 1}/${MAX_RETRIES})`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return crowdedFetch<T>(endpoint, options, retryAttempt + 1);
    }

    // Log final error
    logError(method, endpoint, error, retryAttempt > 1 ? retryAttempt : undefined);

    // Re-throw CrowdedApiError as-is
    if (error instanceof CrowdedApiError) {
      throw error;
    }

    // Wrap other errors with enhanced details
    throw new CrowdedApiError(
      500,
      'Network error',
      error instanceof Error ? error.message : 'Unknown error occurred',
      errorDetails
    );
  }
}

/**
 * GET request helper
 */
export async function crowdedGet<T>(endpoint: string): Promise<T> {
  return crowdedFetch<T>(endpoint, { method: 'GET' });
}

/**
 * POST request helper
 */
export async function crowdedPost<T>(
  endpoint: string,
  body?: unknown
): Promise<T> {
  return crowdedFetch<T>(endpoint, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * PATCH request helper
 */
export async function crowdedPatch<T>(
  endpoint: string,
  body?: unknown
): Promise<T> {
  return crowdedFetch<T>(endpoint, {
    method: 'PATCH',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * DELETE request helper
 */
export async function crowdedDelete<T>(endpoint: string): Promise<T> {
  return crowdedFetch<T>(endpoint, { method: 'DELETE' });
}

/**
 * CrowdedClient class - Main API client interface
 * Provides a class-based API similar to Stripe SDK pattern
 */
export class CrowdedClient {
  /**
   * Get API base URL
   */
  static getBaseUrl(): string {
    return CROWDED_API_BASE_URL;
  }

  /**
   * Check if API key is configured
   */
  static isConfigured(): boolean {
    return !!CROWDED_API_KEY;
  }

  /**
   * List all chapters
   */
  async listChapters() {
    return crowdedGet('/chapters');
  }

  /**
   * Get chapter by ID
   */
  async getChapter(chapterId: string) {
    return crowdedGet(`/chapters/${chapterId}`);
  }

  /**
   * Create a new chapter
   */
  async createChapter(data: { name: string; type?: string }) {
    return crowdedPost('/chapters', data);
  }

 /**
   * Update a chapter
   */
 async updateChapter(chapterId: string, data: Record<string, unknown>) {
    return crowdedPatch(`/chapters/${chapterId}`, data);
  }

  /**
   * Get accounts for a chapter
   */
  async getChapterAccounts(chapterId: string) {
    return crowdedGet(`/chapters/${chapterId}/accounts`);
  }

  /**
   * Create collection for a chapter
   */
  async createCollection(chapterId: string, data: {
    title: string;
    requestedAmount: number;
  }) {
    return crowdedPost(`/chapters/${chapterId}/collections`, {
      data: {
        title: data.title,
        requestedAmount: data.requestedAmount,
      },
    });
  }

  /**
   * Get transactions for an account
   */
  async getAccountTransactions(accountId: string) {
    return crowdedGet(`/accounts/${accountId}/transactions`);
  }
}

// Export singleton instance
export const crowded = new CrowdedClient();

// Export base URL for reference
export { CROWDED_API_BASE_URL };
