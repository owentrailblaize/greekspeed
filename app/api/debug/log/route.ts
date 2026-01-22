import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { level, message, data } = await request.json();
    
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message}`;
    
    // Log to terminal (server console)
    if (level === 'error') {
      console.error(logMessage, data ? JSON.stringify(data, null, 2) : '');
    } else if (level === 'warn') {
      console.warn(logMessage, data ? JSON.stringify(data, null, 2) : '');
    } else {
      console.log(logMessage, data ? JSON.stringify(data, null, 2) : '');
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Debug log API error:', error);
    return NextResponse.json({ success: false, error: 'Failed to log' }, { status: 500 });
  }
}

