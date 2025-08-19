import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Missing environment variables' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Try to get by UUID first, then by name
    let { data: industry, error } = await supabase
      .from('industries')
      .select('*')
      .eq('id', id)
      .single();

    if (!industry && !error) {
      const { data: industries, error: nameError } = await supabase
        .from('industries')
        .select('*')
        .eq('name', id)
        .single();
      
      if (industries) {
        industry = industries;
        error = null;
      } else {
        error = nameError;
      }
    }

    if (error || !industry) {
      return await createIndustryWithLLM(id, supabase);
    }

    if (!industry.llm_enriched) {
      await enrichIndustryWithLLM(industry, supabase);
      const { data: updatedIndustry } = await supabase
        .from('industries')
        .select('*')
        .eq('id', industry.id)
        .single();
      industry = updatedIndustry;
    }

    return NextResponse.json(industry);
  } catch (error) {
    console.error('Industry API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function createIndustryWithLLM(name: string, supabase: any) {
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
          content: `Provide information about the "${name}" industry. Return a JSON object with: description, market_size, growth_rate, key_trends (array of 3-4 trends), related_industries (array of 3-4 related industries). Keep descriptions concise (2-3 sentences max).`
        }],
        temperature: 0.3,
      }),
    });

    const openaiData = await openaiResponse.json();
    const industryInfo = JSON.parse(openaiData.choices[0].message.content);

    const { data: newIndustry, error } = await supabase
      .from('industries')
      .insert({
        name,
        description: industryInfo.description,
        market_size: industryInfo.market_size,
        growth_rate: industryInfo.growth_rate,
        key_trends: industryInfo.key_trends,
        related_industries: industryInfo.related_industries,
        llm_enriched: true,
        llm_data: industryInfo,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(newIndustry);
  } catch (error) {
    console.error('LLM enrichment failed:', error);
    return NextResponse.json({
      name,
      description: 'Industry information not available',
      llm_enriched: false,
    });
  }
}

async function enrichIndustryWithLLM(industry: any, supabase: any) {
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
          content: `Provide updated information about the "${industry.name}" industry. Return a JSON object with: description, market_size, growth_rate, key_trends (array of 3-4 trends), related_industries (array of 3-4 related industries). Keep descriptions concise (2-3 sentences max).`
        }],
        temperature: 0.3,
      }),
    });

    const openaiData = await openaiResponse.json();
    const industryInfo = JSON.parse(openaiData.choices[0].message.content);

    await supabase
      .from('industries')
      .update({
        description: industryInfo.description,
        market_size: industryInfo.market_size,
        growth_rate: industryInfo.growth_rate,
        key_trends: industryInfo.key_trends,
        related_industries: industryInfo.related_industries,
        llm_enriched: true,
        llm_data: industryInfo,
        updated_at: new Date().toISOString(),
      })
      .eq('id', industry.id);
  } catch (error) {
    console.error('Industry enrichment failed:', error);
  }
}