import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Missing environment variables' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Try to get by UUID first, then by name
    let { data: chapter, error } = await supabase
      .from('chapters')
      .select('*')
      .eq('id', params.id)
      .single();

    if (!chapter && !error) {
      const { data: chapters, error: nameError } = await supabase
        .from('chapters')
        .select('*')
        .eq('name', params.id)
        .single();
      
      if (chapters) {
        chapter = chapters;
        error = null;
      } else {
        error = nameError;
      }
    }

    if (error || !chapter) {
      return await createChapterWithLLM(params.id, supabase);
    }

    if (!chapter.llm_enriched) {
      await enrichChapterWithLLM(chapter, supabase);
      const { data: updatedChapter } = await supabase
        .from('chapters')
        .select('*')
        .eq('id', chapter.id)
        .single();
      chapter = updatedChapter;
    }

    return NextResponse.json(chapter);
  } catch (error) {
    console.error('Chapter API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function createChapterWithLLM(name: string, supabase: any) {
  try {
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [{
          role: 'user',
          content: `Provide information about the "${name}" fraternity/sorority chapter. Return a JSON object with: description, location, founded_year (number), member_count (number), events (array of 3-4 events), achievements (array of 2-3 achievements). Keep descriptions concise (2-3 sentences max).`
        }],
        temperature: 0.3,
      }),
    });

    const openaiData = await openaiResponse.json();
    const chapterInfo = JSON.parse(openaiData.choices[0].message.content);

    const { data: newChapter, error } = await supabase
      .from('chapters')
      .insert({
        name,
        description: chapterInfo.description,
        location: chapterInfo.location,
        founded_year: chapterInfo.founded_year,
        member_count: chapterInfo.member_count,
        events: chapterInfo.events,
        achievements: chapterInfo.achievements,
        llm_enriched: true,
        llm_data: chapterInfo,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(newChapter);
  } catch (error) {
    console.error('LLM enrichment failed:', error);
    return NextResponse.json({
      name,
      description: 'Chapter information not available',
      llm_enriched: false,
    });
  }
}

async function enrichChapterWithLLM(chapter: any, supabase: any) {
  try {
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [{
          role: 'user',
          content: `Provide updated information about the "${chapter.name}" fraternity/sorority chapter. Return a JSON object with: description, location, founded_year (number), member_count (number), events (array of 3-4 events), achievements (array of 2-3 achievements). Keep descriptions concise (2-3 sentences max).`
        }],
        temperature: 0.3,
      }),
    });

    const openaiData = await openaiResponse.json();
    const chapterInfo = JSON.parse(openaiData.choices[0].message.content);

    await supabase
      .from('chapters')
      .update({
        description: chapterInfo.description,
        location: chapterInfo.location,
        founded_year: chapterInfo.founded_year,
        member_count: chapterInfo.member_count,
        events: chapterInfo.events,
        achievements: chapterInfo.achievements,
        llm_enriched: true,
        llm_data: chapterInfo,
        updated_at: new Date().toISOString(),
      })
      .eq('id', chapter.id);
  } catch (error) {
    console.error('Chapter enrichment failed:', error);
  }
}