import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe-server'; // Changed this line
import { createServerSupabaseClient } from '@/lib/supabase/client';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();

  try {
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
  
  // Handle dues payments
  if (session.metadata?.type === 'dues') {
    await supabase.from('payments_ledger').insert({
      chapter_id: session.metadata.chapter_id,
      user_id: session.metadata.user_id,
      dues_cycle_id: session.metadata.dues_cycle_id,
      type: 'dues',
      stripe_payment_intent_id: session.payment_intent as string,
      amount: session.amount_total! / 100, // Convert from cents
      status: 'succeeded',
      method: 'card'
    });
  }
  
  // Handle subscription payments
  if (session.metadata?.type === 'subscription') {
    await supabase.from('app_subscriptions').insert({
      user_id: session.metadata.user_id,
      stripe_subscription_id: session.subscription as string,
      status: 'active'
    });
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
  
  // Handle subscription payments - use type assertion
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
  
  // Update payment ledger
  await supabase
    .from('payments_ledger')
    .update({ status: 'refunded' })
    .eq('stripe_charge_id', charge.id);
}
