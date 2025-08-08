import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    urlPreview: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
    keyPreview: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) + '...',
    timestamp: new Date().toISOString()
  })
} 