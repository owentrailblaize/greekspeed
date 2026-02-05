import { NextRequest, NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Send confirmation email using SendGrid template
    const msg = {
      to: email,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL!,
        name: process.env.SENDGRID_FROM_NAME!,
      },
      templateId: process.env.SENDGRID_CONTACT_SUPPORT_TEMPLATE_ID!,
      dynamicTemplateData: {
        user_email: email,
        company_name: 'Trailblaize, Inc.',
        support_email: 'support@trailblaize.net',
        current_year: new Date().getFullYear(),
      },
    };

    await sgMail.send(msg);

    return NextResponse.json(
      { message: 'Contact request submitted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { error: 'Failed to submit contact request' },
      { status: 500 }
    );
  }
}
