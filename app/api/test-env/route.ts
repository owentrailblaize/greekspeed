import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    // Supabase Configuration
    hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    urlPreview: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
    keyPreview: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) + '...',
    anonKeyPreview: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...',
    
    // Twilio Configuration (NEW)
    hasTwilioAccountSid: !!process.env.TWILIO_ACCOUNT_SID,
    hasTwilioAuthToken: !!process.env.TWILIO_AUTH_TOKEN,
    hasTwilioPhoneNumber: !!process.env.TWILIO_PHONE_NUMBER,
    twilioAccountSidPreview: process.env.TWILIO_ACCOUNT_SID?.substring(0, 10) + '...',
    twilioPhoneNumberPreview: process.env.TWILIO_PHONE_NUMBER,
    
    // Environment
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  })
} 