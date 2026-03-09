/**
 * CLI to test notification emails and SMS locally.
 * Loads .env.local, then sends or dry-runs each notification type to a test email/phone.
 *
 * Usage:
 *   npx tsx scripts/test-notifications.ts --type=all
 *   npx tsx scripts/test-notifications.ts --type=connection_request --dry-run
 *   npx tsx scripts/test-notifications.ts --type=new_event --email=you@example.com --phone=+15551234567
 *
 * Options:
 *   --type=<name>     Notification type or "all" (default: all)
 *   --email=<addr>    Override test email (default: TEST_NOTIFICATION_EMAIL from env)
 *   --phone=<number>  Override test phone (default: TEST_NOTIFICATION_PHONE from env)
 *   --dry-run         Build and print payloads only; do not send
 *   --no-email        Skip email for this run
 *   --no-sms          Skip SMS for this run
 */

import path from 'path';
import dotenv from 'dotenv';

// Load .env.local before importing the runner (so SendGrid/Telnyx env is set)
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

function parseArgv(): {
  type: string;
  email: string;
  phone: string;
  dryRun: boolean;
  sendEmail: boolean;
  sendSms: boolean;
} {
  const args = process.argv.slice(2);
  let type = 'all';
  let email = process.env.TEST_NOTIFICATION_EMAIL ?? '';
  let phone = process.env.TEST_NOTIFICATION_PHONE ?? '';
  let dryRun = false;
  let sendEmail = true;
  let sendSms = true;

  for (const arg of args) {
    if (arg === '--dry-run') dryRun = true;
    else if (arg === '--no-email') sendEmail = false;
    else if (arg === '--no-sms') sendSms = false;
    else if (arg.startsWith('--type=')) type = arg.slice(7).trim();
    else if (arg.startsWith('--email=')) email = arg.slice(8).trim();
    else if (arg.startsWith('--phone=')) phone = arg.slice(8).trim();
  }

  return { type, email, phone, dryRun, sendEmail, sendSms };
}

type DryRunResult = { type: string; email?: { subject: string; templateData?: Record<string, unknown>; bodyDescription?: string }; sms?: { body: string } };
type SendResult = { type: string; emailSent?: boolean; smsSent?: boolean; emailError?: string; smsError?: string };

function isDryRunResult(r: DryRunResult | SendResult): r is DryRunResult {
  return !('emailSent' in r) && !('smsSent' in r);
}

async function main() {
  const opts = parseArgv();
  const { type, dryRun, sendEmail, sendSms } = opts;
  let email = opts.email;
  let phone = opts.phone;

  const runner = await import('../lib/services/notificationTestRunner');
  const validTypes = runner.NOTIFICATION_TYPES as readonly string[];

  const typesToRun: string[] =
    type === 'all' ? [...runner.NOTIFICATION_TYPES] : [type];
  for (const t of typesToRun) {
    if (!validTypes.includes(t)) {
      console.error('Unknown type: %s. Valid types: %s', t, validTypes.join(', '));
      process.exit(1);
    }
  }

  if (!dryRun) {
    if (sendEmail && !email) {
      console.error('Missing test email. Set TEST_NOTIFICATION_EMAIL in .env.local or pass --email=...');
      process.exit(1);
    }
    if (sendSms && !phone) {
      console.error('Missing test phone. Set TEST_NOTIFICATION_PHONE in .env.local or pass --phone=...');
      process.exit(1);
    }
  } else {
    if (!email) email = 'test@example.com';
    if (!phone) phone = '+15550000000';
  }

  console.log('Notification test run');
  console.log('  Types: %s', typesToRun.join(', '));
  console.log('  Dry run: %s', dryRun);
  console.log('  Email: %s', sendEmail ? email : '(skipped)');
  console.log('  SMS: %s', sendSms ? phone : '(skipped)');
  console.log('');

  for (const t of typesToRun) {
    const result = await runner.runNotificationTest({
      type: t as (typeof runner.NOTIFICATION_TYPES)[number],
      toEmail: email,
      toPhone: phone,
      sendEmail,
      sendSms,
      dryRun,
    });

    if (isDryRunResult(result)) {
      console.log('--- %s ---', t);
      if (result.email) {
        console.log('Email subject: %s', result.email.subject);
        if (result.email.templateData) {
          console.log('Template data: %s', JSON.stringify(result.email.templateData, null, 2));
        }
        if (result.email.bodyDescription) {
          console.log('Body: %s', result.email.bodyDescription);
        }
      }
      if (result.sms) {
        console.log('SMS body:\n%s', result.sms.body);
      }
      if (!result.email && !result.sms) {
        console.log('(no email or SMS for this type)');
      }
      console.log('');
    } else {
      const parts: string[] = [];
      if (result.emailSent !== undefined) parts.push(`email=${result.emailSent ? 'ok' : 'fail'}`);
      if (result.smsSent !== undefined) parts.push(`sms=${result.smsSent ? 'ok' : 'fail'}`);
      if (result.emailError) parts.push(`emailError=${result.emailError}`);
      if (result.smsError) parts.push(`smsError=${result.smsError}`);
      console.log('%s: %s', t, parts.join(' '));
    }
  }

  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
