import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/client';
import { logger } from "@/lib/utils/logger";

export async function POST(req: Request) {
  try {
    const { chapterId, adminUserId, adminEmail } = await req.json();

    if (!chapterId || !adminUserId || !adminEmail) {
      logger.error('Missing required fields:', { chapterId, adminUserId, adminEmail });
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Creating chapter subscription

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

    // Get chapter details
    const { data: chapter, error: chapterError } = await supabase
      .from('chapters')
      .select('name, national_fraternity, chapter_name')
      .eq('id', chapterId)
      .single();

    if (chapterError || !chapter) {
      logger.error('Error fetching chapter:', { context: [chapterError] });
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
    }

    // Get or create Stripe customer
    let customerId: string | null = null;
    
    try {
      let { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', adminUserId)
        .single();

      if (profileError) {
        logger.error('Error fetching profile:', { context: [profileError] });
      } else {
        customerId = profile?.stripe_customer_id;
      }
    } catch (error) {
      logger.error('Supabase connection error:', { context: [error] });
    }

    if (!customerId) {
      // Creating new Stripe customer
      try {
        const customer = await stripe.customers.create({
          email: adminEmail,
          metadata: {
            user_id: adminUserId,
            chapter_id: chapterId,
          },
        });

        customerId = customer.id;
        // Created customer

        // Update profile with Stripe customer ID
        try {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ stripe_customer_id: customerId })
            .eq('id', adminUserId);

          if (updateError) {
            logger.error('Error updating profile with customer ID:', { context: [updateError] });
          }
        } catch (updateError) {
          logger.error('Supabase update error:', { context: [updateError] });
        }
      } catch (stripeError) {
        logger.error('Error creating Stripe customer:', { context: [stripeError] });
        return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
      }
    }

    // Create Stripe checkout session for chapter subscription
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: process.env.STRIPE_CHAPTER_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?canceled=true`,
      allow_promotion_codes: true, // This enables coupon code input on checkout
      metadata: {
        type: 'chapter_subscription',
        chapter_id: chapterId,
        admin_user_id: adminUserId,
        chapter_name: chapter.name,
      },
      subscription_data: {
        metadata: {
          chapter_id: chapterId,
          admin_user_id: adminUserId,
          chapter_name: chapter.name,
        },
      },
    });

    // Created checkout session

    return NextResponse.json({
      sessionId: session.id,
      sessionUrl: session.url,
      isLiveMode: process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_'),
    });
  } catch (error) {
    logger.error('Error creating chapter subscription:', { context: [error] });
    return NextResponse.json(
      { error: 'Failed to create chapter subscription' },
      { status: 500 }
    );
  }
}
