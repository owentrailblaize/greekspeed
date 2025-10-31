import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerSupabaseClient } from '@/lib/supabase/client';
import { logger } from "@/lib/utils/logger";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    // Import Stripe only when needed (runtime)
    const { stripe } = await import('@/lib/services/stripe/stripe-server');
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    logger.error('Webhook signature verification failed:', { context: [err] });
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();

  try {
    // Webhook received
    
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      
      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;
      
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        // Check if it's a chapter subscription
        const subscription = event.data.object as Stripe.Subscription;
        if (subscription.metadata?.chapter_id) {
          await handleChapterSubscriptionUpdated(subscription);
        } else {
          await handleSubscriptionUpdated(subscription);
        }
        break;
      
      case 'charge.refunded':
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error('Webhook handler error:', { context: [error] });
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const supabase = createServerSupabaseClient();
  
  // Processing checkout session completed
  
  // Handle chapter subscription payments
  if (session.metadata?.type === 'chapter_subscription') {
    // Processing chapter subscription payment
    
    // Insert into chapter_subscriptions table
    const { error: subscriptionError } = await supabase.from('chapter_subscriptions').insert({
      chapter_id: session.metadata.chapter_id,
      stripe_subscription_id: session.subscription as string,
      status: 'active',
      current_period_start: new Date(session.created * 1000),
      current_period_end: new Date((session.created + 30 * 24 * 60 * 60) * 1000), // 30 days
    });
    
    if (subscriptionError) {
      logger.error('Error inserting chapter subscription:', { context: [subscriptionError] });
    } else {
      // Successfully created chapter subscription
    }
  }
  
  // Handle individual subscription payments (keep existing logic)
  if (session.metadata?.type === 'subscription') {
    // Processing subscription payment for user
    
    // Insert into app_subscriptions table
    const { error: subscriptionError } = await supabase.from('app_subscriptions').insert({
      user_id: session.metadata.user_id,
      stripe_subscription_id: session.subscription as string,
      status: 'active'
    });
    
    if (subscriptionError) {
      logger.error('Error inserting subscription:', { context: [subscriptionError] });
    }
    
    // Update user profile subscription_status
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ 
        subscription_status: 'active',
        billing_unlocked_until: null // Clear grace period
      })
      .eq('id', session.metadata.user_id);
    
    if (profileError) {
      logger.error('Error updating profile:', { context: [profileError] });
    } else {
      // Successfully updated user profile subscription status
    }
  }
  
  // Handle dues payments (keep existing logic)
  if (session.metadata?.type === 'dues') {
    // Processing dues payment
    
    try {
      // Insert into payments ledger
      const { error: ledgerError } = await supabase.from('payments_ledger').insert({
        chapter_id: session.metadata.chapter_id,
        user_id: session.metadata.user_id,
        dues_cycle_id: session.metadata.dues_cycle_id,
        type: 'dues',
        stripe_payment_intent_id: session.payment_intent as string,
        amount: session.amount_total! / 100, // Convert from cents
        status: 'succeeded',
        method: 'card'
      });

      if (ledgerError) {
        logger.error('Error inserting into payments ledger:', { context: [ledgerError] });
      } else {
        // Successfully inserted into payments ledger
      }

      // Update dues assignment status
      const { error: assignmentError } = await supabase
        .from('dues_assignments')
        .update({ 
          status: 'paid',
          amount_paid: session.amount_total! / 100,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.metadata.dues_assignment_id);

      if (assignmentError) {
        logger.error('Error updating dues assignment:', { context: [assignmentError] });
      } else {
        // Successfully updated dues assignment to paid
      }

      // Update user profile dues status
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          current_dues_amount: '0.00',
          dues_status: 'paid',
          last_dues_assignment_date: new Date().toISOString()
        })
        .eq('id', session.metadata.user_id);

      if (profileError) {
        logger.error('Error updating user profile:', { context: [profileError] });
      } else {
        // Successfully updated user profile dues status
      }
    } catch (error) {
      logger.error('Error in dues payment processing:', { context: [error] });
    }
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const supabase = createServerSupabaseClient();
  
  // Update dues assignment status
  if (paymentIntent.metadata?.dues_assignment_id) {
    await supabase
      .from('dues_assignments')
      .update({ 
        status: 'paid',
        amount_paid: paymentIntent.amount / 100
      })
      .eq('id', paymentIntent.metadata.dues_assignment_id);
  }
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const supabase = createServerSupabaseClient();
  
  // Processing invoice paid
  
  // Handle subscription payments for payment plans
  if (invoice.metadata?.type === 'dues_payment_plan') {
    const { error } = await supabase
      .from('dues_assignments')
      .update({ 
        amount_paid: invoice.amount_paid / 100,
        updated_at: new Date().toISOString()
      })
      .eq('id', invoice.metadata.dues_assignment_id);

    if (error) {
      logger.error('Error updating dues assignment for payment plan:', { context: [error] });
    } else {
      // Successfully updated dues assignment for payment plan
    }
  }
  
  // Handle app subscription payments
  const invoiceWithSubscription = invoice as any;
  if (invoiceWithSubscription.subscription) {
    await supabase
      .from('app_subscriptions')
      .update({
        current_period_end: new Date(invoice.period_end * 1000),
        status: 'active'
      })
      .eq('stripe_subscription_id', invoiceWithSubscription.subscription);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const supabase = createServerSupabaseClient();
  
  await supabase
    .from('app_subscriptions')
    .update({
      status: subscription.status,
      current_period_end: new Date((subscription as any).current_period_end * 1000),
      cancel_at_period_end: subscription.cancel_at_period_end
    })
    .eq('stripe_subscription_id', subscription.id);
}

// Add new handler for chapter subscription updates
async function handleChapterSubscriptionUpdated(subscription: Stripe.Subscription) {
  const supabase = createServerSupabaseClient();
  
  await supabase
    .from('chapter_subscriptions')
    .update({
      status: subscription.status,
      current_period_end: new Date((subscription as any).current_period_end * 1000),
      cancel_at_period_end: subscription.cancel_at_period_end
    })
    .eq('stripe_subscription_id', subscription.id);
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  const supabase = createServerSupabaseClient();
  
  // Processing charge refunded
  
  // Update payments ledger
  const { error } = await supabase
    .from('payments_ledger')
    .update({ 
      status: 'refunded',
      updated_at: new Date().toISOString()
    })
    .eq('stripe_charge_id', charge.id);

  if (error) {
    logger.error('Error updating payments ledger for refund:', { context: [error] });
  } else {
    // Successfully updated payments ledger for refund
  }
  
  // If this was a dues payment, update the assignment
  if (charge.metadata?.dues_assignment_id) {
    const { error: assignmentError } = await supabase
      .from('dues_assignments')
      .update({ 
        status: 'required',
        amount_paid: 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', charge.metadata.dues_assignment_id);

    if (assignmentError) {
      logger.error('Error updating dues assignment for refund:', { context: [assignmentError] });
    } else {
      // Successfully updated dues assignment for refund
    }
  }
}
