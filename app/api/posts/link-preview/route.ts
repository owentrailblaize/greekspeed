import { NextRequest, NextResponse } from 'next/server';
import ogs from 'open-graph-scraper';

interface LinkPreviewResponse {
  success: boolean;
  data?: {
    url: string;
    title?: string;
    description?: string;
    image?: string;
    siteName?: string;
    favicon?: string;
  };
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { success: false, error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Fetch Open Graph data with timeout
    const options = {
      url,
      timeout: 5000, // 5 second timeout
      headers: {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      // Only fetch what we need for performance
      ogImageFallback: true,
    };

    const { result, error } = await ogs(options);

    if (error || !result) {
      console.error('Link preview fetch error:', error);
      return NextResponse.json<LinkPreviewResponse>({
        success: false,
        error: 'Failed to fetch link preview',
      }, { status: 500 });
    }

    // Extract and format the preview data
    const preview: LinkPreviewResponse['data'] = {
      url,
      title: result.ogTitle || result.twitterTitle || result.dcTitle || result.title || '',
      description: result.ogDescription || result.twitterDescription || result.dcDescription || '',
      image: result.ogImage?.[0]?.url || result.twitterImage?.[0]?.url || '',
      siteName: result.ogSiteName || result.twitterSite || '',
      favicon: result.favicon || '',
    };

    return NextResponse.json<LinkPreviewResponse>({
      success: true,
      data: preview,
    });

  } catch (error) {
    console.error('Link preview API error:', error);
    return NextResponse.json<LinkPreviewResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

