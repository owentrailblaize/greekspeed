import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/client';
import { stripe } from '@/lib/stripe-server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    
    const body = await request.json();
    const { assignmentId, paymentPlan = false } = body;

    if (!assignmentId) {
      return NextResponse.json({ error: 'Assignment ID is required' }, { status: 400 });
    }

    // Get the dues assignment first
    const { data: assignment, error: assignmentError } = await supabase
      .from('dues_assignments')
      .select(`
        *,
        user:profiles!dues_assignments_user_id_fkey(
          id,
          full_name,
          email,
          stripe_customer_id,
          chapter_id
        ),
        cycle:dues_cycles!dues_assignments_dues_cycle_id_fkey(
          id,
          name,
          allow_payment_plans,
          plan_options
        )
      `)
      .eq('id', assignmentId)
      .single();

    if (assignmentError || !assignment) {
      return NextResponse.json({ error: 'Dues assignment not found' }, { status: 404 });
    }

    if (assignment.status === 'paid') {
      return NextResponse.json({ error: 'Dues already paid' }, { status: 400 });
    }

    // Get or create Stripe customer
    let customerId = assignment.user.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: assignment.user.email,
        name: assignment.user.full_name,
        metadata: {
          user_id: assignment.user.id,
          chapter_id: assignment.user.chapter_id
        }
      });
      customerId = customer.id;

      // Update profile with customer ID
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', assignment.user.id);
    }

    // Create Stripe checkout session with dynamic pricing
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${assignment.cycle.name} Dues`,
            description: `Chapter dues for ${assignment.cycle.name}`,
          },
          unit_amount: Math.round(assignment.amount_due * 100), // Convert to cents
        },
        quantity: 1,
      }],
      mode: paymentPlan ? 'subscription' : 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/dues?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/dues?canceled=true`,
      metadata: {
        type: 'dues',
        user_id: assignment.user.id,
        chapter_id: assignment.user.chapter_id,
        dues_cycle_id: assignment.dues_cycle_id,
        dues_assignment_id: assignment.id,
        payment_plan: paymentPlan.toString()
      }
    });

    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}