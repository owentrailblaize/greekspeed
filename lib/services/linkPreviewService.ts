import { extractUrls, normalizeUrl, isValidUrl } from '@/lib/utils/linkPreview';
import type { LinkPreview } from '@/types/posts';

export interface LinkPreviewResult {
  url: string;
  preview?: LinkPreview;
  error?: string;
}

/**
 * Fetch link previews for URLs found in text content (server-side)
 * This uses open-graph-scraper directly for server-side usage
 */
export async function fetchLinkPreviewsServer(content: string): Promise<LinkPreviewResult[]> {
  const urls = extractUrls(content);
  if (urls.length === 0) {
    return [];
  }

  // Limit to first 3 URLs to avoid performance issues
  const urlsToProcess = urls.slice(0, 3).map(normalizeUrl).filter(isValidUrl);

  // Dynamically import open-graph-scraper only on server side
  const ogs = (await import('open-graph-scraper')).default;

  // Fetch previews in parallel
  const previewPromises = urlsToProcess.map(async (url): Promise<LinkPreviewResult> => {
    try {
      const options = {
        url,
        timeout: 5000, // 5 second timeout
        headers: {
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        ogImageFallback: true,
      };

      const { result, error } = await ogs(options);

      if (error || !result) {
        return {
          url,
          error: 'Failed to fetch link preview',
        };
      }

      const preview: LinkPreview = {
        url,
        title: result.ogTitle || result.twitterTitle || result.dcTitle || result.title || '',
        description: result.ogDescription || result.twitterDescription || result.dcDescription || '',
        image: result.ogImage?.[0]?.url || result.twitterImage?.[0]?.url || '',
        siteName: result.ogSiteName || result.twitterSite || '',
        favicon: result.favicon || '',
      };

      return {
        url,
        preview,
      };
    } catch (error) {
      console.error(`Error fetching preview for ${url}:`, error);
      return {
        url,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  return Promise.all(previewPromises);
}

/**
 * Fetch link previews for URLs found in text content (client-side)
 * This calls the API endpoint
 */
export async function fetchLinkPreviews(content: string): Promise<LinkPreviewResult[]> {
  const urls = extractUrls(content);
  if (urls.length === 0) {
    return [];
  }

  // Limit to first 3 URLs to avoid performance issues
  const urlsToProcess = urls.slice(0, 3).map(normalizeUrl).filter(isValidUrl);

  // Fetch previews in parallel
  const previewPromises = urlsToProcess.map(async (url): Promise<LinkPreviewResult> => {
    try {
      const response = await fetch('/api/posts/link-preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!data.success || !data.data) {
        return {
          url,
          error: data.error || 'Failed to fetch preview',
        };
      }

      return {
        url,
        preview: data.data,
      };
    } catch (error) {
      console.error(`Error fetching preview for ${url}:`, error);
      return {
        url,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  return Promise.all(previewPromises);
}

