import { NextRequest, NextResponse } from 'next/server';
import { usernameExists, validateUsername } from '@/lib/utils/usernameUtils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');
    const excludeUserId = searchParams.get('excludeUserId') || undefined;

    if (!username) {
      return NextResponse.json(
        { error: 'Username parameter is required' },
        { status: 400 }
      );
    }

    // First validate the username format
    const validation = validateUsername(username);
    if (!validation.valid) {
      return NextResponse.json({
        available: false,
        message: validation.error,
      });
    }

    // Check if username exists
    const exists = await usernameExists(username, excludeUserId);

    return NextResponse.json({
      available: !exists,
      message: exists 
        ? 'This username is already taken' 
        : 'Username is available',
    });
  } catch (error) {
    console.error('Error checking username availability:', error);
    return NextResponse.json(
      { error: 'Failed to check username availability' },
      { status: 500 }
    );
  }
}

