import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { stripe } = await import('@/lib/stripe-server');
    
    const priceId = 'price_1S3I32HgSlN6wHNZ8AW9Epgm';
    
    try {
      const price = await stripe.prices.retrieve(priceId);
      
      return NextResponse.json({
        success: true,
        price: {
          id: price.id,
          active: price.active,
          currency: price.currency,
          unit_amount: price.unit_amount,
          recurring: price.recurring,
          product: price.product,
        }
      });
    } catch (priceError) {
      return NextResponse.json({
        success: false,
        error: priceError instanceof Error ? priceError.message : 'Unknown error',
        code: (priceError as any)?.code || 'N/A',
        suggestion: 'Check if the price ID exists in your Stripe dashboard'
      });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
