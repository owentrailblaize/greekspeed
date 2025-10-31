import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logger } from "@/lib/utils/logger";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Fix the PATCH method parameter type for Next.js 15
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const updateData = await request.json();
    const { id } = await params; // Await the params

    // Update the vendor
    const { data: updatedVendor, error } = await supabase
      .from('vendor_contacts')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('Error updating vendor:', { context: [error] });
      return NextResponse.json({ error: 'Failed to update vendor' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      vendor: updatedVendor,
      message: 'Vendor updated successfully' 
    });

  } catch (error) {
    logger.error('Error in update vendor API:', { context: [error] });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Fix the DELETE method parameter type for Next.js 15
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; // Await the params
    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from('vendor_contacts')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      logger.error('Error deleting vendor:', { context: [error] });
      return NextResponse.json({ error: 'Failed to delete vendor' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Vendor deleted successfully' 
    });

  } catch (error) {
    logger.error('Error in delete vendor API:', { context: [error] });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
