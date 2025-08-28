import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
  { params }: { params: { id: string } }
) {
  try {
    const updateData = await request.json();

    // Validate time logic if updating times
    if (updateData.start_time && updateData.end_time) {
      if (new Date(updateData.end_time) <= new Date(updateData.start_time)) {
        return NextResponse.json({ error: 'End time must be after start time' }, { status: 400 });
      }
    }

    // Update the event
    const { data: updatedEvent, error } = await supabase
      .from('events')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
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
    // Delete the event (this will cascade to RSVPs)
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting event:', error);
      return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Event deleted successfully' 
    });

  } catch (error) {
    console.error('Error in delete event API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
