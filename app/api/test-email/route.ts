import { NextRequest, NextResponse } from 'next/server';
import { EmailService } from '@/lib/services/emailService';

export async function POST(request: NextRequest) {
  try {
    const { testEmail } = await request.json();
    
    if (!testEmail) {
      return NextResponse.json({ error: 'Test email required' }, { status: 400 });
    }

    // Test with minimal data
    const result = await EmailService.sendChapterAnnouncement({
      to: testEmail,
      firstName: 'Test User',
      chapterName: 'Test Chapter',
      title: 'Test Announcement',
      summary: 'This is a test',
      content: 'Test content',
      announcementId: 'test-123',
      announcementType: 'general'
    });

    return NextResponse.json({
      success: result,
      message: result ? 'Test email sent successfully' : 'Failed to send test email'
    });

  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json({ error: 'Test failed' }, { status: 500 });
  }
}
