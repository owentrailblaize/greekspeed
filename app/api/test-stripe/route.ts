import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { stripe } = await import('@/lib/stripe-server');
    
    // Test Stripe connection
    const account = await stripe.accounts.retrieve();
    
    return NextResponse.json({
      success: true,
      account: {
        id: account.id,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
      }
    });
  } catch (error) {
    console.error('Stripe test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

