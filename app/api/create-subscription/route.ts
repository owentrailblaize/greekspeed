import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/client';
import { logger } from "@/lib/utils/logger";

export async function POST(req: Request) {
  try {
    const { userId, email } = await req.json();

    if (!userId || !email) {
      logger.error('Missing required fields:', { userId, email });
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Creating subscription

    // Import Stripe only when needed (runtime)
    const { stripe } = await import('@/lib/services/stripe/stripe-server');
    const supabase = createServerSupabaseClient();

    // Validate environment variables
    if (!process.env.STRIPE_SECRET_KEY) {
      logger.error('Missing STRIPE_SECRET_KEY');
      return NextResponse.json({ error: 'Stripe configuration error' }, { status: 500 });
    }

    if (!process.env.NEXT_PUBLIC_APP_URL) {
      logger.error('Missing NEXT_PUBLIC_APP_URL');
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
        logger.error('Error fetching profile:', { context: [profileError] });
        // Continue without profile - we'll create a new customer
      } else {
        customerId = profile?.stripe_customer_id;
      }
    } catch (error) {
      logger.error('Supabase connection error:', { context: [error] });
      // Continue without profile - we'll create a new customer
    }

    if (!customerId) {
      // Creating new Stripe customer
      try {
        // Create Stripe customer
        const customer = await stripe.customers.create({
          email,
          metadata: {
            user_id: userId,
          },
        });

        customerId = customer.id;
        // Created customer

        // Update profile with Stripe customer ID
        try {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ stripe_customer_id: customerId })
            .eq('id', userId);

          if (updateError) {
            logger.error('Error updating profile with customer ID:', { context: [updateError] });
          }
        } catch (updateError) {
          logger.error('Supabase update error:', { context: [updateError] });
          // Continue anyway - the Stripe customer was created successfully
        }
      } catch (stripeError) {
        logger.error('Error creating Stripe customer:', { context: [stripeError] });
        return NextResponse.json({ error: 'Failed to create customer account' }, { status: 500 });
      }
    }

    // Creating checkout session with customer

    // Create checkout session with hosted checkout
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: 'price_1S3GQXHgSlN6wHNZ2n1RY63A', // Updated to new price ID
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

    // Created session
    
    return NextResponse.json({ 
      sessionId: session.id,
      sessionUrl: session.url, // Include the URL as backup
      customerId: customerId,
      environment: process.env.NODE_ENV,
      isLiveMode: process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_'),
    });
  } catch (error) {
    logger.error('Error creating subscription:', { context: [error] });
    return NextResponse.json({ 
      error: 'Failed to create subscription',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
