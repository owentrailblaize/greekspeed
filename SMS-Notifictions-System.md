# SMS Notifications Implementation Plan

## Phase 1: Infrastructure Setup

### 1.1 Fix Telnyx Service Configuration

- Update `lib/services/sms/smsServiceTelnyx.ts` line 33 to read from environment variable
- Change: `private static isSandboxMode = true;` → `process.env.TELNYX_SANDBOX_MODE !== 'false'`
- **Files**: `lib/services/sms/smsServiceTelnyx.ts`

### 1.2 Create SMS Notification Service

Create a centralized service similar to EmailService for handling SMS notifications

- Create `lib/services/sms/smsNotificationService.ts`
- Implement methods for each notification type:
- `sendAnnouncementNotification()`
- `sendEventNotification()`
- `sendMessageNotification()`
- `sendConnectionRequestNotification()`
- `sendConnectionAcceptedNotification()`
- Follow same pattern as `lib/services/emailService.ts`

### 1.3 Create Database Table for SMS Logs

Add tracking table for SMS activity (similar to existing email logging)

- Create Supabase migration for `sms_logs` table
- Fields: id, user_id, chapter_id, message_type, message_content, phone_number, status, telnyx_id, error, created_at
- Add indexes for user_id, chapter_id, telnyx_id
- **Location**: Supabase migrations

## Phase 2: User Preferences & Settings

### 2.1 Enhance Profile Schema

Verify phone number and SMS consent fields exist

- Confirm `phone` field exists in `profiles` table
- Confirm `sms_consent` field exists and is boolean
- **Database**: `profiles` table in Supabase

### 2.2 Add Notification Preferences UI

Update settings page to include SMS notification toggles

- Add SMS preferences section to `app/dashboard/settings/page.tsx`
- Add toggles for:
- SMS notifications enabled/disabled (global)
- Announcement SMS notifications
- Event SMS notifications
- Message SMS notifications
- Connection request SMS notifications
- Store preferences in database (need to add `notification_settings` table if doesn't exist)
- **Files**: `app/dashboard/settings/page.tsx`

### 2.3 Create Notification Settings API

Add API route for managing user notification preferences

- Create `app/api/notifications/settings/route.ts`
- Handle GET (fetch preferences) and PATCH (update preferences)
- **Files**: `app/api/notifications/settings/route.ts`

## Phase 3: Notification Integration

### 3.1 Announcement Notifications

Integrate SMS notifications into announcement creation

- Update `app/api/announcements/route.ts` POST handler
- After email notification logic, add SMS notification
- Check user preferences and phone number before sending
- Use parallel execution with email (don't block on SMS failure)
- **Files**: `app/api/announcements/route.ts`

### 3.2 Event Notifications

Integrate SMS notifications into event creation

- Update `app/api/events/route.ts` POST handler
- Call SMS notification service after event creation
- Update `app/api/events/send-email/route.ts` to also send SMS
- **Files**: `app/api/events/route.ts`, `app/api/events/send-email/route.ts`

### 3.3 Message Notifications

Integrate SMS notifications for direct messages

- Update `app/api/messages/route.ts` POST handler
- Add SMS notification after email notification logic
- Check recipient's SMS preferences
- **Files**: `app/api/messages/route.ts`

### 3.4 Connection Request Notifications

Integrate SMS notifications for connection requests

- Update `app/api/connections/route.ts` POST handler
- Add SMS notification after connection creation
- **Files**: `app/api/connections/route.ts`

### 3.5 Connection Accepted Notifications

Integrate SMS notifications when connections are accepted

- Update `app/api/connections/[id]/route.ts` PATCH handler
- Send SMS to requester when recipient accepts
- **Files**: `app/api/connections/[id]/route.ts`

## Phase 4: Testing & Optimization

### 4.1 Create Test Suite

Add comprehensive testing for SMS integration

- Test SMS sending in sandbox mode
- Test with real Telnyx credentials
- Test user preference filtering
- Test error handling and retries

### 4.2 Add Logging & Monitoring

Enhanced logging for SMS activity

- Log all SMS send attempts (success/failure)
- Track delivery status from Telnyx webhooks
- Add error alerting for consistent failures
- **Files**: Logging throughout SMS service

### 4.3 Rate Limiting & Best Practices

Implement SMS sending best practices

- Add rate limiting to prevent spam
- Implement message queuing for bulk sends
- Add SMS templates for consistent messaging
- Follow SMS compliance guidelines (opt-out language)

## Phase 5: Webhook Integration (Future)

### 5.1 Telnyx Webhook Handler

Handle incoming SMS messages and delivery status

- Create `app/api/webhooks/telnyx/route.ts`
- Handle message received events
- Handle message status updates
- **Files**: `app/api/webhooks/telnyx/route.ts`

### 5.2 Inbound SMS Processing

Handle replies to SMS messages

- Parse incoming SMS messages
- Match to user profiles
- Route to appropriate handler (e.g., event RSVP)
- **Files**: TBD based on requirements

## Implementation Order

1. Fix sandbox mode bug (Phase 1.1)
2. Create SMS notification service (Phase 1.2)
3. Add notification preferences UI and API (Phase 2.2, 2.3)
4. Integrate one notification type (start with events)
5. Test thoroughly with sandbox mode
6. Test with real SMS
7. Expand to other notification types
8. Add logging and monitoring (Phase 4.2)
9. Implement webhooks (Phase 5)

## Dependencies

- Telnyx API key configured
- Telnyx phone number active
- User profiles have valid phone numbers
- SMS consent tracking implemented
- Notification preferences system

## Success Criteria

- SMS notifications sent successfully for all key events
- User preferences properly respected
- No SMS sent without consent
- SMS failures don't block core functionality
- Comprehensive logging and error handling
- Messages appear in Telnyx dashboard

---
#### Implementation plan: email notification preferences
Use the existing notification_settings table columns, similar to SMS.

**Phase 1: Update API to read/write email preferences**
1. 1.1 Update GET endpoint (app/api/notifications/settings/route.ts)
Return all email preference fields from notification_settings
Default to true if not set (opt-in by default)

2. 1.2 Update PATCH endpoint (app/api/notifications/settings/route.ts)

- Accept granular email preference updates
- Handle both individual toggles and the master email_enabled toggle

**Phase 2: Add email preference checks in sending logic**
Add checks before sending:
1. `Announcements (app/api/announcements/route.ts)`: Check `announcement_notifications` AND `email_enabled`
2. `Events (app/api/events/send-email/route.ts)`: Check `event_notifications` AND `email_enabled`
3. `Event Reminders (app/api/events/send-reminder/route.ts)`: Check `event_reminder_notifications` AND `email_enabled`
4. `Messages (app/api/messages/route.ts)`: Check `message_notifications` AND `email_enabled
5. `Connection Requests (app/api/connections/route.ts)`: Check `connection_notifications` AND `email_enabled`
6. `Connection Accepted (app/api/connections/[id]/route.ts)`: Check `connection_accepted_notifications` AND `email_enabled`

**Phase 3: Update UI to show email toggles**
3.1 Update Settings Page (`app/dashboard/settings/page.tsx`)

Add email preference toggles:
Master toggle: "Enable Email Notifications"
Sub-toggles (when master is enabled):
- Announcements
- Events
- Event Reminders
- Messages
- Connection Requests
- Connection Accepted
Note: Password reset/change and support emails should remain always-on for security.