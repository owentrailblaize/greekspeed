import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test if we can import the client-side Stripe
    const { getStripe } = await import('@/lib/stripe');
    
    // This will only work in a browser environment, but we can test the import
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    
    return NextResponse.json({
      success: true,
      publishableKey: {
        exists: !!publishableKey,
        length: publishableKey?.length || 0,
        startsWith: publishableKey?.substring(0, 7) || 'N/A',
      },
      getStripeFunction: {
        exists: !!getStripe,
        type: typeof getStripe,
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
