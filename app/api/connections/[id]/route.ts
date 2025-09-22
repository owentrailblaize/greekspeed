import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { EmailService } from '@/lib/services/emailService';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Missing environment variables' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await request.json();
    const { status } = body;

    if (!status || !['accepted', 'declined', 'blocked'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Get the connection with profile information before updating
    const { data: existingConnection, error: fetchError } = await supabase
      .from('connections')
      .select(`
        *,
        requester:profiles!requester_id(
          id,
          first_name,
          email,
          chapter
        ),
        recipient:profiles!recipient_id(
          id,
          first_name,
          email,
          chapter
        )
      `)
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Error fetching connection:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch connection' }, { status: 500 });
    }

    // Update the connection status
    const { data: connection, error } = await supabase
      .from('connections')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Connection update error:', error);
      return NextResponse.json({ error: 'Failed to update connection' }, { status: 500 });
    }

    // Send email notification for accepted connections
    if (status === 'accepted' && existingConnection) {
      try {
        // Send notification to the requester (the person who originally sent the request)
        const requesterProfile = existingConnection.requester;
        const recipientProfile = existingConnection.recipient;

        if (requesterProfile?.email && requesterProfile?.first_name && recipientProfile?.first_name) {
          await EmailService.sendConnectionAcceptedNotification({
            to: requesterProfile.email,
            firstName: requesterProfile.first_name,
            chapterName: requesterProfile.chapter || 'Your Chapter',
            actorFirstName: recipientProfile.first_name,
            connectionId: id
          });
          console.log(`Connection accepted email sent to ${requesterProfile.email}`);
        }
      } catch (emailError) {
        console.error('Failed to send connection accepted email:', emailError);
        // Don't fail the connection update if email fails
      }
    }

    return NextResponse.json({ connection });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Missing environment variables' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error } = await supabase
      .from('connections')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Connection deletion error:', error);
      return NextResponse.json({ error: 'Failed to delete connection' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 