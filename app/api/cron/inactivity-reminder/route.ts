import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { canSendEmailNotification } from '@/lib/utils/checkEmailPreferences';
import { EmailService } from '@/lib/services/emailService';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const INACTIVITY_DAYS = 30;

/**
 * Cron endpoint: send inactivity reminder emails to users who have not
 * been active for INACTIVITY_DAYS days. Call via Vercel Cron or external scheduler.
 * Secure with CRON_SECRET: Authorization: Bearer <CRON_SECRET>
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - INACTIVITY_DAYS);
    const cutoffIso = cutoff.toISOString();

    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, email, first_name, chapter, chapter_id, phone, sms_consent, last_active_at, is_developer')
      .or(`last_active_at.lt.${cutoffIso},last_active_at.is.null`)
      .not('email', 'is', null)
      .neq('email', '')
      .eq('is_developer', false);

    if (error) {
      console.error('Inactivity reminder: fetch error', error);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    let sent = 0;
    let smsSent = 0;
    let skipped = 0;

    const { SMSService } = await import('@/lib/services/sms/smsServiceTelnyx');
    const { SMSNotificationService } = await import('@/lib/services/sms/smsNotificationService');

    for (const profile of profiles ?? []) {
      const allowed = await canSendEmailNotification(profile.id, 'inactivity_reminder');
      if (!allowed) {
        skipped += 1;
      } else {
        const chapterName = profile.chapter ?? 'chapter';
        const ok = await EmailService.sendInactivityReminderEmail({
          to: profile.email!,
          firstName: profile.first_name ?? 'Member',
          chapterName,
        });
        if (ok) sent += 1;
      }

      if (profile.phone && profile.sms_consent === true) {
        const formattedPhone = SMSService.formatPhoneNumber(profile.phone);
        if (SMSService.isValidPhoneNumber(profile.phone)) {
          const ok = await SMSNotificationService.sendInactivityReminderNotification(
            formattedPhone,
            profile.first_name ?? 'Member',
            profile.id,
            profile.chapter_id ?? ''
          );
          if (ok) smsSent += 1;
        }
      }
    }

    return NextResponse.json({
      success: true,
      sent,
      smsSent,
      skipped,
      total: (profiles ?? []).length,
    });
  } catch (err) {
    console.error('Inactivity reminder cron error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
