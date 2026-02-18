import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/client';
import { LinkedInImportService } from '@/lib/services/linkedinInImportService';
import { parseLinkedInPdf } from '@/lib/services/linkedInPdfParser';

/**
 * POST /api/profile-import/parse
 * 
 * Extracts text from uploaded PDF and parses it into structured data.
 * Updates the import record with parsed results.
 * 
 * Request body: { importId: string }
 * Response: { success: boolean, data: ParsedLinkedInData, confidence: ImportConfidence }
 */
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
    
    console.log('Parse API - importId:', importId, 'userId:', user.id);
    
    if (!importId) {
      return NextResponse.json(
        { error: 'Import ID is required' },
        { status: 400 }
      );
    }

    // 6. Verify user owns this import
    const importRecord = await importService.getImport(importId);
    
    console.log('Parse API - importRecord found:', !!importRecord);
    
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
    console.log('Parse API - extracting text from PDF...');
    const extractionResult = await importService.extractTextFromImport(importId);
    
    if (!extractionResult.success) {
      console.error('Parse API - extraction failed:', extractionResult.error);
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to extract text from PDF',
          details: extractionResult.error 
        },
        { status: 422 }
      );
    }

    console.log('Parse API - extraction successful, text length:', extractionResult.text.length);

    // 8. Validate it looks like a LinkedIn PDF
    const validation = importService.validateLinkedInPdfContent(extractionResult.text);
    
    if (!validation.valid) {
      console.log('Parse API - validation failed:', validation.reason);
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

    // 9. Parse the extracted text
    console.log('Parse API - parsing LinkedIn data...');
    const parseResult = parseLinkedInPdf(extractionResult.text);
    
    // 10. Update import record with parsed data
    await importService.updateImportStatus(importId, 'needs_review', {
      parsed_json: parseResult.data,
      confidence_json: parseResult.confidence,
    });

    console.log('Parse API - success! Parsed data:', {
      hasFullName: !!parseResult.data.fullName,
      experienceCount: parseResult.data.experiences?.length || 0,
      educationCount: parseResult.data.education?.length || 0,
      confidence: parseResult.confidence.overall,
    });

    // 11. Return parsed data and confidence scores
    return NextResponse.json({
      success: true,
      importId: importId,
      data: parseResult.data,
      confidence: parseResult.confidence,
      pageCount: extractionResult.pageCount,
    });

  } catch (error) {
    console.error('PDF parse API error:', error);
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
