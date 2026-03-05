import { NextRequest, NextResponse } from 'next/server';
import { crowded, CrowdedClient, CrowdedApiError, crowdedGet, crowdedPost, crowdedPatch, crowdedDelete } from '@/lib/services/crowded/crowded-client';

/**
 * Test endpoint to verify Crowded API connection
 * GET /api/crowded/test - Test connection and list accounts
 */
export async function GET(request: NextRequest) {
  try {
    // Check if API key is configured
    if (!CrowdedClient.isConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Crowded API not configured',
          details: {
            message: 'CROWDED_API_KEY environment variable is not set',
            baseUrl: CrowdedClient.getBaseUrl(),
          },
        },
        { status: 500 }
      );
    }

    // Test connection - try different endpoint variations based on Postman docs
    // The API returned "Cannot GET /api/v1/chapters" which means that endpoint doesn't exist
    // We need to find the correct endpoint structure from the Postman docs
    const attemptedEndpoints: string[] = [];
    const results: Array<{ endpoint: string; status: number; error?: string; success?: boolean }> = [];
    
    // Try various endpoint patterns based on common REST API structures
    const endpointsToTry = [
      '/organizations',
      '/chapters',
      '/contacts',
      '/applications',
      '/accounts',
    ];
    
    for (const endpoint of endpointsToTry) {
      attemptedEndpoints.push(endpoint);
      try {
        const result = await crowdedGet(endpoint);
        results.push({
          endpoint,
          status: 200,
          success: true,
        });
        
        // If we got a successful response, return it
        return NextResponse.json({
          success: true,
          message: 'Crowded API connection successful',
          data: {
            baseUrl: CrowdedClient.getBaseUrl(),
            workingEndpoint: endpoint,
            result: result,
            timestamp: new Date().toISOString(),
          },
        });
      } catch (e) {
        if (e instanceof CrowdedApiError) {
          results.push({
            endpoint,
            status: e.statusCode,
            error: e.message,
            success: false,
          });
        } else {
          results.push({
            endpoint,
            status: 500,
            error: e instanceof Error ? e.message : 'Unknown error',
            success: false,
          });
        }
      }
    }
    
    // If all attempts failed, return comprehensive error with all results
    const lastError = results[results.length - 1];
    return NextResponse.json({
      success: false,
      error: 'Crowded API endpoint test failed',
      details: {
        message: 'None of the tested endpoints exist. Please check Postman docs for correct endpoint structure.',
        baseUrl: CrowdedClient.getBaseUrl(),
        attemptedEndpoints: results,
        nextSteps: [
          '1. Open the Postman collection: https://documenter.getpostman.com/view/20019814/2sB3HrmxPJ',
          '2. Look for "Chapters" section in the sidebar',
          '3. Find the "Get and get all Chapters" endpoint',
          '4. Check the exact endpoint path (may require organization ID or different structure)',
          '5. Update the test endpoint with the correct path',
        ],
        commonPatterns: [
          'Endpoints may require organization ID: /organizations/:orgId/chapters',
          'Endpoints may use different base path',
          'Endpoints may require query parameters',
          'Check if authentication method is correct (X-API-Key header)',
        ],
      },
    }, { status: 404 });
  } catch (error) {
    console.error('Crowded API test error:', error);

    if (error instanceof CrowdedApiError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Crowded API error',
          details: {
            statusCode: error.statusCode,
            error: error.error,
            message: error.message,
            baseUrl: CrowdedClient.getBaseUrl(),
            errorDetails: error.details, // Include full error details
            environment: process.env.NODE_ENV,
            hasApiKey: !!process.env.CROWDED_API_KEY,
            apiKeyLength: process.env.CROWDED_API_KEY?.length || 0,
            hasBaseUrl: !!process.env.CROWDED_API_BASE_URL,
          },
        },
        { status: error.statusCode || 500 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to connect to Crowded API',
        details: {
          message: error instanceof Error ? error.message : 'Unknown error',
          baseUrl: CrowdedClient.getBaseUrl(),
          configured: CrowdedClient.isConfigured(),
          environment: process.env.NODE_ENV,
          hasApiKey: !!process.env.CROWDED_API_KEY,
          apiKeyLength: process.env.CROWDED_API_KEY?.length || 0,
          hasBaseUrl: !!process.env.CROWDED_API_BASE_URL,
          errorType: error instanceof Error ? error.constructor.name : typeof error,
          errorStack: error instanceof Error ? error.stack?.split('\n').slice(0, 10) : undefined,
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/crowded/test - Test specific endpoint from Postman docs
 * Body: { endpoint: string, method?: 'GET' | 'POST' | 'PATCH' | 'DELETE', body?: unknown }
 * 
 * Use this to test any endpoint from the Postman docs.
 * Example: { "endpoint": "/organizations", "method": "GET" }
 */
export async function POST(request: NextRequest) {
  let endpoint: string | undefined;
  let normalizedEndpoint: string | undefined;
  
  try {
    const body = await request.json();
    endpoint = body.endpoint;
    const { method = 'GET', body: requestBody } = body;

    if (!endpoint) {
      return NextResponse.json(
        { error: 'endpoint is required in request body' },
        { status: 400 }
      );
    }

    if (!CrowdedClient.isConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Crowded API not configured',
        },
        { status: 500 }
      );
    }

    // Ensure endpoint starts with /
    normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const fullUrl = `${CrowdedClient.getBaseUrl()}${normalizedEndpoint}`;

    let result;
    switch (method.toUpperCase()) {
      case 'GET':
        result = await crowdedGet(normalizedEndpoint);
        break;
      case 'POST':
        result = await crowdedPost(normalizedEndpoint, requestBody);
        break;
      case 'PATCH':
        result = await crowdedPatch(normalizedEndpoint, requestBody);
        break;
      case 'DELETE':
        result = await crowdedDelete(normalizedEndpoint);
        break;
      default:
        return NextResponse.json(
          { error: `Unsupported method: ${method}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: `Crowded API ${method} request successful`,
      data: {
        endpoint: normalizedEndpoint,
        fullUrl,
        result,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Crowded API test error:', error);

    if (error instanceof CrowdedApiError) {
      const fullUrl = normalizedEndpoint 
        ? `${CrowdedClient.getBaseUrl()}${normalizedEndpoint}`
        : endpoint 
          ? `${CrowdedClient.getBaseUrl()}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`
          : undefined;
          
      return NextResponse.json(
        {
          success: false,
          error: 'Crowded API error',
          details: {
            statusCode: error.statusCode,
            error: error.error,
            message: error.message,
            errorDetails: error.details,
            endpoint: normalizedEndpoint || endpoint,
            fullUrl,
          },
        },
        { status: error.statusCode || 500 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to execute Crowded API request',
        details: {
          message: error instanceof Error ? error.message : 'Unknown error',
          endpoint: normalizedEndpoint || endpoint,
        },
      },
      { status: 500 }
    );
  }
}
