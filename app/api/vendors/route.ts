import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chapterId = searchParams.get('chapter_id');

    if (!chapterId) {
      return NextResponse.json({ error: 'Chapter ID is required' }, { status: 400 });
    }

    const { data: vendors, error } = await supabase
      .from('vendor_contacts')
      .select('*')
      .eq('chapter_id', chapterId)
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching vendors:', error);
      return NextResponse.json({ error: 'Failed to fetch vendors' }, { status: 500 });
    }

    return NextResponse.json(vendors || []);
  } catch (error) {
    console.error('Error in vendors API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const vendorData = await request.json();
    
    // Validate required fields
    const requiredFields = ['name', 'type', 'chapter_id'];
    for (const field of requiredFields) {
      if (!vendorData[field]) {
        return NextResponse.json({ error: `${field} is required` }, { status: 400 });
      }
    }

    // Validate rating range
    if (vendorData.rating && (vendorData.rating < 0 || vendorData.rating > 5)) {
      return NextResponse.json({ error: 'Rating must be between 0 and 5' }, { status: 400 });
    }

    // Create the vendor
    const insertData = {
      ...vendorData,
      is_active: true,
      created_by: vendorData.created_by || 'system',
      updated_by: vendorData.updated_by || 'system'
    };

    const { data: newVendor, error } = await supabase
      .from('vendor_contacts')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('Error creating vendor:', error);
      return NextResponse.json({ error: 'Failed to create vendor' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      vendor: newVendor,
      message: 'Vendor created successfully' 
    });

  } catch (error) {
    console.error('Error in create vendor API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}