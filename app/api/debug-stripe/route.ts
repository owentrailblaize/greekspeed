import { NextResponse } from 'next/server';

export async function GET() {
  const debugInfo = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    stripe: {
      secretKey: {
        exists: !!process.env.STRIPE_SECRET_KEY,
        length: process.env.STRIPE_SECRET_KEY?.length || 0,
        startsWith: process.env.STRIPE_SECRET_KEY?.substring(0, 7) || 'N/A',
      },
      publishableKey: {
        exists: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
        length: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.length || 0,
        startsWith: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.substring(0, 7) || 'N/A',
      },
      webhookSecret: {
        exists: !!process.env.STRIPE_WEBHOOK_SECRET,
        length: process.env.STRIPE_WEBHOOK_SECRET?.length || 0,
        startsWith: process.env.STRIPE_WEBHOOK_SECRET?.substring(0, 5) || 'N/A',
      },
    },
    app: {
      url: process.env.NEXT_PUBLIC_APP_URL || 'Not set',
    },
    supabase: {
      url: {
        exists: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        value: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...' || 'Not set',
      },
      anonKey: {
        exists: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        length: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0,
      },
      serviceKey: {
        exists: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        length: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
      },
    },
  };

  try {
    // Test Stripe connection
    const { stripe } = await import('@/lib/stripe-server');
    
    try {
      const account = await stripe.accounts.retrieve();
      debugInfo.stripe.connection = {
        success: true,
        accountId: account.id,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        detailsSubmitted: account.details_submitted,
      };
    } catch (stripeError) {
      debugInfo.stripe.connection = {
        success: false,
        error: stripeError instanceof Error ? stripeError.message : 'Unknown error',
        code: (stripeError as any)?.code || 'N/A',
      };
    }

    // Test creating a test customer
    try {
      const testCustomer = await stripe.customers.create({
        email: 'test@example.com',
        metadata: { test: 'true' },
      });
      debugInfo.stripe.testCustomer = {
        success: true,
        customerId: testCustomer.id,
      };
      
      // Clean up test customer
      await stripe.customers.del(testCustomer.id);
    } catch (customerError) {
      debugInfo.stripe.testCustomer = {
        success: false,
        error: customerError instanceof Error ? customerError.message : 'Unknown error',
      };
    }

  } catch (importError) {
    debugInfo.stripe.import = {
      success: false,
      error: importError instanceof Error ? importError.message : 'Unknown error',
    };
  }

  return NextResponse.json(debugInfo);
}
