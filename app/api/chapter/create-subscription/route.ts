import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/client';

export async function POST(req: Request) {
  try {
    const { chapterId, adminUserId, adminEmail } = await req.json();

    if (!chapterId || !adminUserId || !adminEmail) {
      console.error('Missing required fields:', { chapterId, adminUserId, adminEmail });
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    console.log('Creating chapter subscription for:', { chapterId, adminUserId, adminEmail });

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

    // Get chapter details
    const { data: chapter, error: chapterError } = await supabase
      .from('chapters')
      .select('name, national_fraternity, chapter_name')
      .eq('id', chapterId)
      .single();

    if (chapterError || !chapter) {
      console.error('Error fetching chapter:', chapterError);
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
        console.error('Error fetching profile:', profileError);
      } else {
        customerId = profile?.stripe_customer_id;
      }
    } catch (error) {
      console.error('Supabase connection error:', error);
    }

    if (!customerId) {
      console.log('Creating new Stripe customer for:', adminEmail);
      try {
        const customer = await stripe.customers.create({
          email: adminEmail,
          metadata: {
            user_id: adminUserId,
            chapter_id: chapterId,
          },
        });

        customerId = customer.id;
        console.log('Created customer:', customerId);

        // Update profile with Stripe customer ID
        try {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ stripe_customer_id: customerId })
            .eq('id', adminUserId);

          if (updateError) {
            console.error('Error updating profile with customer ID:', updateError);
          }
        } catch (updateError) {
          console.error('Supabase update error:', updateError);
        }
      } catch (stripeError) {
        console.error('Error creating Stripe customer:', stripeError);
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

    console.log('Created checkout session:', session.id);

    return NextResponse.json({
      sessionId: session.id,
      sessionUrl: session.url,
      isLiveMode: process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_'),
    });
  } catch (error) {
    console.error('Error creating chapter subscription:', error);
    return NextResponse.json(
      { error: 'Failed to create chapter subscription' },
      { status: 500 }
    );
  }
}
