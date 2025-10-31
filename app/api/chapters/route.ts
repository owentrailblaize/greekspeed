import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logger } from "@/lib/utils/logger";

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Missing environment variables' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Fetch all active chapters - only the three you specified
    const { data: chapters, error } = await supabase
      .from('chapters')
      .select('id, name, chapter_name, school, location, university')
      .eq('chapter_status', 'active')
      .order('name', { ascending: true });

    if (error) {
      logger.error('Chapters API error:', { context: [error] });
      return NextResponse.json({ error: 'Failed to fetch chapters' }, { status: 500 });
    }

    return NextResponse.json(chapters || []);
  } catch (error) {
    logger.error('Chapters API error:', { context: [error] });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
