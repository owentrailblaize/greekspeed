import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logger } from "@/lib/utils/logger";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    // Get query parameters for pagination
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = (page - 1) * limit;

    // Fetch chapters with pagination
    const { data: chapters, error, count } = await supabase
      .from('chapters')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      logger.error('Error fetching chapters:', { context: [error] });
      return NextResponse.json({ error: 'Failed to fetch chapters' }, { status: 500 });
    }

    return NextResponse.json({ 
      chapters: chapters || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    });
  } catch (error) {
    logger.error('Error in chapters API:', { context: [error] });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const chapterData = await request.json();

    // Validate required fields
    const requiredFields = ['name', 'university', 'national_fraternity', 'chapter_name', 'location', 'founded_year', 'member_count'];
    for (const field of requiredFields) {
      if (!chapterData[field]) {
        return NextResponse.json({ error: `${field} is required` }, { status: 400 });
      }
    }

    // Prepare the data for insertion
    const insertData = {
      ...chapterData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // Ensure these fields have default values if not provided
      events: chapterData.events || null,
      achievements: chapterData.achievements || null,
      llm_enriched: chapterData.llm_enriched || false,
      llm_data: chapterData.llm_data || null
    };

    // Insert the new chapter
    const { data: newChapter, error } = await supabase
      .from('chapters')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      logger.error('Error creating chapter:', { context: [error] });
      return NextResponse.json({ error: 'Failed to create chapter' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      chapter: newChapter,
      message: 'Chapter created successfully' 
    });

  } catch (error) {
    logger.error('Error in create chapter API:', { context: [error] });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chapterId = searchParams.get('chapterId');

    if (!chapterId) {
      return NextResponse.json({ error: 'Chapter ID is required' }, { status: 400 });
    }

    // Delete the chapter from the chapters table
    const { error: deleteError } = await supabase
      .from('chapters')
      .delete()
      .eq('id', chapterId);

    if (deleteError) {
      logger.error('Error deleting chapter:', { context: [deleteError] });
      return NextResponse.json({ error: 'Failed to delete chapter' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Chapter deleted successfully' 
    });

  } catch (error) {
    logger.error('Error in delete chapter API:', { context: [error] });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
