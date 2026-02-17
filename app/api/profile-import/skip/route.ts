import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/client';
import { linkedInImportService } from '@/lib/services/linkedinInImportService';

/**
 * POST /api/profile-import/skip
 * 
 * Marks the import as skipped when user chooses manual entry.
 * Creates a record for tracking purposes.
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

    // 2. Verify authentication
    const supabase = createServerSupabaseClient();
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 3. Create skipped import record
    const skipRecord = await linkedInImportService.skipImport(user.id);

    return NextResponse.json({
      success: true,
      message: 'Import skipped, proceeding to manual entry',
      import: skipRecord,
    });

  } catch (error) {
    console.error('Skip API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
