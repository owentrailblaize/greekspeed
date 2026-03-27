import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { normalizeEventTimeField } from '@/lib/utils/eventScheduleDisplay';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data: event, error } = await supabase
      .from('events')
      .select(`
        *,
        event_rsvps (
          id,
          user_id,
          status,
          responded_at
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching event:', error);
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error('Error in event detail API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updateData = await request.json();

    const startPatch =
      'start_time' in updateData ? normalizeEventTimeField(updateData.start_time) : undefined;
    const endPatch =
      'end_time' in updateData ? normalizeEventTimeField(updateData.end_time) : undefined;

    if (startPatch != null && endPatch != null) {
      if (new Date(endPatch) <= new Date(startPatch)) {
        return NextResponse.json({ error: 'End time must be after start time' }, { status: 400 });
      }
    }

    // Filter out fields that shouldn't be updated directly (send_sms, send_sms_to_alumni are not DB columns)
    const { send_sms, send_sms_to_alumni, created_by, created_at, ...allowedUpdateData } = updateData;

    const merged: Record<string, unknown> = { ...allowedUpdateData };
    if ('start_time' in updateData) merged.start_time = startPatch;
    if ('end_time' in updateData) merged.end_time = endPatch;

    // Update the event
    const { data: updatedEvent, error } = await supabase
      .from('events')
      .update({
        ...merged,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating event:', error);
      return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      event: updatedEvent,
      message: 'Event updated successfully' 
    });

  } catch (error) {
    console.error('Error in update event API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Archive (soft delete) instead of hard delete - preserves budget, attendance, RSVP history
    const { error } = await supabase
      .from('events')
      .update({
        archived_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('Error archiving event:', error);
      return NextResponse.json({ error: 'Failed to archive event' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Event archived successfully' 
    });

  } catch (error) {
    console.error('Error in archive event API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
