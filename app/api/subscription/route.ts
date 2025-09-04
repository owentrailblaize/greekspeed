import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/client';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    // Get user's profile and subscription info
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id, subscription_status')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!profile?.stripe_customer_id) {
      return NextResponse.json({ 
        subscription: null,
        message: 'No subscription found'
      });
    }

    // Test Stripe import
    let stripe;
    try {
      const stripeModule = await import('@/lib/stripe-server');
      stripe = stripeModule.stripe;
    } catch (stripeError) {
      console.error('Error importing Stripe:', stripeError);
      return NextResponse.json({ 
        error: 'Stripe configuration error',
        details: stripeError instanceof Error ? stripeError.message : 'Unknown error'
      }, { status: 500 });
    }

    // Fetch subscription data from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: profile.stripe_customer_id,
      status: 'all',
      expand: ['data.default_payment_method', 'data.latest_invoice']
    });

    const activeSubscription = subscriptions.data.find(sub => 
      sub.status === 'active' || sub.status === 'trialing'
    );

    if (!activeSubscription) {
      return NextResponse.json({ 
        subscription: null,
        message: 'No active subscription found'
      });
    }

    // Get customer data
    const customer = await stripe.customers.retrieve(profile.stripe_customer_id);

    // Simple upcoming invoice calculation with validation
    const currentPeriodEnd = (activeSubscription as any).current_period_end;
    const nextPaymentDate = currentPeriodEnd && !isNaN(currentPeriodEnd) 
      ? new Date(currentPeriodEnd * 1000).toISOString()
      : new Date().toISOString(); // fallback to current date

    const upcomingInvoice = {
      amount: activeSubscription.items.data[0].price.unit_amount! / 100,
      currency: activeSubscription.items.data[0].price.currency,
      nextPaymentDate: nextPaymentDate,
      invoiceDate: nextPaymentDate
    };

    return NextResponse.json({
      subscription: {
        id: activeSubscription.id,
        status: activeSubscription.status,
        cancelAtPeriodEnd: activeSubscription.cancel_at_period_end,
        price: {
          id: activeSubscription.items.data[0].price.id,
          amount: activeSubscription.items.data[0].price.unit_amount! / 100,
          currency: activeSubscription.items.data[0].price.currency,
          interval: activeSubscription.items.data[0].price.recurring?.interval
        },
        paymentMethod: activeSubscription.default_payment_method,
        customer: {
          id: customer.id,
          email: (customer as any).email,
          name: (customer as any).name
        },
        upcomingInvoice: upcomingInvoice
      }
    });

  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch subscription data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { action, subscriptionId } = await req.json();

    if (!action || !subscriptionId) {
      return NextResponse.json({ error: 'Action and subscription ID required' }, { status: 400 });
    }

    const { stripe } = await import('@/lib/stripe-server');

    let updatedSubscription;

    switch (action) {
      case 'cancel':
        updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true
        });
        break;
      
      case 'reactivate':
        updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: false
        });
        break;
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      subscription: updatedSubscription 
    });

  } catch (error) {
    console.error('Error updating subscription:', error);
    return NextResponse.json({ 
      error: 'Failed to update subscription',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
