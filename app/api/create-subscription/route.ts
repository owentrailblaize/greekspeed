import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/client';

export async function POST(req: Request) {
  try {
    const { userId, email } = await req.json();

    if (!userId || !email) {
      console.error('Missing required fields:', { userId, email });
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    console.log('Creating subscription for:', { userId, email });
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Using live keys in:', process.env.NODE_ENV === 'development' ? 'DEVELOPMENT' : 'PRODUCTION');

    // Import Stripe only when needed (runtime)
    const { stripe } = await import('@/lib/stripe-server');
    const supabase = createServerSupabaseClient();

    // Validate environment variables
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('Missing STRIPE_SECRET_KEY');
      return NextResponse.json({ error: 'Stripe configuration error' }, { status: 500 });
    }

    if (!process.env.NEXT_PUBLIC_APP_URL) {
      console.error('Missing NEXT_PUBLIC_APP_URL');
      return NextResponse.json({ error: 'App URL configuration error' }, { status: 500 });
    }

    // Get or create Stripe customer
    let customerId: string | null = null;
    
    try {
      let { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        // Continue without profile - we'll create a new customer
      } else {
        customerId = profile?.stripe_customer_id;
      }
    } catch (error) {
      console.error('Supabase connection error:', error);
      // Continue without profile - we'll create a new customer
    }

    if (!customerId) {
      console.log('Creating new Stripe customer for:', email);
      try {
        // Create Stripe customer
        const customer = await stripe.customers.create({
          email,
          metadata: {
            user_id: userId,
          },
        });

        customerId = customer.id;
        console.log('Created customer:', customerId);

        // Update profile with Stripe customer ID
        try {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ stripe_customer_id: customerId })
            .eq('id', userId);

          if (updateError) {
            console.error('Error updating profile with customer ID:', updateError);
          }
        } catch (updateError) {
          console.error('Supabase update error:', updateError);
          // Continue anyway - the Stripe customer was created successfully
        }
      } catch (stripeError) {
        console.error('Error creating Stripe customer:', stripeError);
        return NextResponse.json({ error: 'Failed to create customer account' }, { status: 500 });
      }
    }

    console.log('Creating checkout session with customer:', customerId);

    // Create checkout session with hosted checkout
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: 'price_1S3I32HgSlN6wHNZ8AW9Epgm', // Your price ID
          quantity: 1,
        },
      ],
      mode: 'subscription',
      payment_method_collection: 'always',
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?canceled=true`,
      metadata: {
        type: 'subscription',
        user_id: userId,
        environment: process.env.NODE_ENV,
      },
      // Add these options to help with development issues
      locale: 'en',
      submit_type: 'auto',
    });

    console.log('Created session:', session.id);
    console.log('Session URL:', session.url);
    
    return NextResponse.json({ 
      sessionId: session.id,
      sessionUrl: session.url, // Include the URL as backup
      customerId: customerId,
      environment: process.env.NODE_ENV,
      isLiveMode: process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_'),
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json({ 
      error: 'Failed to create subscription',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
