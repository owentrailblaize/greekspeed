import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerSupabaseClient } from '@/lib/supabase/client';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    // Import Stripe only when needed (runtime)
    const { stripe } = await import('@/lib/stripe-server');
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();

  try {
    console.log('Webhook received:', event.type);
    
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
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      
      case 'charge.refunded':
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const supabase = createServerSupabaseClient();
  
  console.log('🔄 Processing checkout session completed:', session.id);
  console.log('📋 Session metadata:', session.metadata);
  console.log('💰 Amount total:', session.amount_total);
  
  // Handle dues payments
  if (session.metadata?.type === 'dues') {
    console.log('💳 Processing dues payment for assignment:', session.metadata.dues_assignment_id);
    
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
        console.error('❌ Error inserting into payments ledger:', ledgerError);
      } else {
        console.log('✅ Successfully inserted into payments ledger');
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
        console.error('❌ Error updating dues assignment:', assignmentError);
      } else {
        console.log('✅ Successfully updated dues assignment to paid');
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
        console.error('❌ Error updating user profile:', profileError);
      } else {
        console.log('✅ Successfully updated user profile dues status');
      }
    } catch (error) {
      console.error('❌ Error in dues payment processing:', error);
    }
  }
  
  // Handle subscription payments
  if (session.metadata?.type === 'subscription') {
    console.log('Processing subscription payment for user:', session.metadata.user_id);
    
    // Insert into app_subscriptions table
    const { error: subscriptionError } = await supabase.from('app_subscriptions').insert({
      user_id: session.metadata.user_id,
      stripe_subscription_id: session.subscription as string,
      status: 'active'
    });
    
    if (subscriptionError) {
      console.error('Error inserting subscription:', subscriptionError);
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
      console.error('Error updating profile:', profileError);
    } else {
      console.log('Successfully updated user profile subscription status');
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
  
  console.log('Processing invoice paid:', invoice.id);
  console.log('Invoice metadata:', invoice.metadata);
  
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
      console.error('Error updating dues assignment for payment plan:', error);
    } else {
      console.log('Successfully updated dues assignment for payment plan');
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

async function handleChargeRefunded(charge: Stripe.Charge) {
  const supabase = createServerSupabaseClient();
  
  console.log('Processing charge refunded:', charge.id);
  
  // Update payments ledger
  const { error } = await supabase
    .from('payments_ledger')
    .update({ 
      status: 'refunded',
      updated_at: new Date().toISOString()
    })
    .eq('stripe_charge_id', charge.id);

  if (error) {
    console.error('Error updating payments ledger for refund:', error);
  } else {
    console.log('Successfully updated payments ledger for refund');
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
      console.error('Error updating dues assignment for refund:', assignmentError);
    } else {
      console.log('Successfully updated dues assignment for refund');
    }
  }
}
