import { NextRequest, NextResponse } from 'next/server';
import { generateBaseUsername, sanitizeUsername } from '@/lib/utils/usernameUtils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const firstName = searchParams.get('firstName') || '';
    const lastName = searchParams.get('lastName') || '';

    if (!firstName && !lastName) {
      return NextResponse.json(
        { error: 'First name or last name is required' },
        { status: 400 }
      );
    }

    // Generate base username
    const baseUsername = generateBaseUsername(firstName, lastName);

    // Generate suggestions
    const suggestions: string[] = [baseUsername];

    // Add variations if we have both names
    if (firstName && lastName) {
      const firstSanitized = sanitizeUsername(firstName);
      const lastSanitized = sanitizeUsername(lastName);
      
      // first.last (already added)
      // first_last
      suggestions.push(`${firstSanitized}_${lastSanitized}`);
      // firstlast
      if (firstSanitized.length + lastSanitized.length <= 20) {
        suggestions.push(`${firstSanitized}${lastSanitized}`);
      }
      // f.lastname
      if (firstSanitized.length > 0) {
        suggestions.push(`${firstSanitized[0]}.${lastSanitized}`);
      }
    }

    // Add numbered variations
    for (let i = 1; i <= 3; i++) {
      suggestions.push(`${baseUsername}${i}`);
    }

    // Remove duplicates and return
    return NextResponse.json({
      suggestions: [...new Set(suggestions)],
    });
  } catch (error) {
    console.error('Error generating username suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to generate username suggestions' },
      { status: 500 }
    );
  }
}

