import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { EmailService } from '@/lib/services/emailService';

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Missing environment variables' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Get all connections for the user with profile information
    const { data: connections, error } = await supabase
      .from('connections')
      .select(`
        *,
        requester:profiles!requester_id(
          id,
          full_name,
          first_name,
          last_name,
          chapter,
          avatar_url,
          email
        ),
        recipient:profiles!recipient_id(
          id,
          full_name,
          first_name,
          last_name,
          chapter,
          avatar_url,
          email
        )
      `)
      .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`);

    if (error) {
      console.error('Connection fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch connections' }, { status: 500 });
    }

    return NextResponse.json({ connections: connections || [] });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Missing environment variables' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await request.json();
    const { requesterId, recipientId, message } = body;

    if (!requesterId || !recipientId) {
      return NextResponse.json({ error: 'Requester and recipient IDs required' }, { status: 400 });
    }

    // Check if connection already exists
    const { data: existingConnection } = await supabase
      .from('connections')
      .select('*')
      .or(`and(requester_id.eq.${requesterId},recipient_id.eq.${recipientId}),and(requester_id.eq.${recipientId},recipient_id.eq.${requesterId})`)
      .single();

    if (existingConnection) {
      return NextResponse.json({ 
        error: 'Connection already exists',
        connection: existingConnection 
      }, { status: 409 });
    }

    // Get recipient profile information for email notification
    const { data: recipientProfile, error: recipientError } = await supabase
      .from('profiles')
      .select('first_name, email, chapter')
      .eq('id', recipientId)
      .single();

    if (recipientError) {
      console.error('Error fetching recipient profile:', recipientError);
    }

    // Get requester profile information for email notification
    const { data: requesterProfile, error: requesterError } = await supabase
      .from('profiles')
      .select('first_name')
      .eq('id', requesterId)
      .single();

    if (requesterError) {
      console.error('Error fetching requester profile:', requesterError);
    }

    // Create new connection request
    const { data: connection, error } = await supabase
      .from('connections')
      .insert({
        requester_id: requesterId,
        recipient_id: recipientId,
        status: 'pending',
        message: message || null
      })
      .select()
      .single();

    if (error) {
      console.error('Connection creation error:', error);
      return NextResponse.json({ error: 'Failed to create connection' }, { status: 500 });
    }

    // Send email notification if we have the required profile information
    if (recipientProfile?.email && recipientProfile?.first_name && requesterProfile?.first_name) {
      try {
        await EmailService.sendConnectionRequestNotification({
          to: recipientProfile.email,
          firstName: recipientProfile.first_name,
          chapterName: recipientProfile.chapter || 'Your Chapter',
          actorFirstName: requesterProfile.first_name,
          message: message,
          connectionId: connection.id
        });
        // Connection request email sent successfully
      } catch (emailError) {
        console.error('Failed to send connection request email:', emailError);
        // Don't fail the connection creation if email fails
      }
    } else {
      console.warn('Missing profile information for email notification:', {
        recipientEmail: !!recipientProfile?.email,
        recipientFirstName: !!recipientProfile?.first_name,
        requesterFirstName: !!requesterProfile?.first_name
      });
    }

    return NextResponse.json({ connection });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 