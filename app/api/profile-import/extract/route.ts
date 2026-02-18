import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/client';
import { LinkedInImportService } from '@/lib/services/linkedinInImportService';

export async function POST(request: NextRequest) {
  try {
    // 1. Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'No authorization header' },
        { status: 401 }
      );
    }

    // 2. Create server-side Supabase client (uses service role key, bypasses RLS)
    const supabase = createServerSupabaseClient();
    
    // 3. Verify authentication
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 4. Create service instance with server client (important for RLS bypass)
    const importService = new LinkedInImportService(supabase);

    // 5. Get import ID from request
    const body = await request.json();
    const { importId } = body;
    
    if (!importId) {
      return NextResponse.json(
        { error: 'Import ID is required' },
        { status: 400 }
      );
    }

    // 6. Verify user owns this import
    const importRecord = await importService.getImport(importId);
    
    if (!importRecord) {
      return NextResponse.json(
        { error: 'Import not found' },
        { status: 404 }
      );
    }
    
    if (importRecord.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to access this import' },
        { status: 403 }
      );
    }

    // 7. Extract text from PDF
    const extractionResult = await importService.extractTextFromImport(importId);
    
    if (!extractionResult.success) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to extract text from PDF',
          details: extractionResult.error 
        },
        { status: 422 }
      );
    }

    // 8. Validate it looks like a LinkedIn PDF
    const validation = importService.validateLinkedInPdfContent(extractionResult.text);
    
    if (!validation.valid) {
      await importService.updateImportStatus(importId, 'failed', {
        error_message: validation.reason,
      });
      
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid PDF content',
          details: validation.reason 
        },
        { status: 422 }
      );
    }

    // 9. Return extracted text for parsing
    return NextResponse.json({
      success: true,
      text: extractionResult.text,
      pageCount: extractionResult.pageCount,
      importId: importId,
    });

  } catch (error) {
    console.error('PDF extraction API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
