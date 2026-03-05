# Staging & Testing Expectations - Trailblaize

## Overview
This document outlines the staging environments, test accounts, verification checklists, and testing procedures for OpenClaw and the development team.

## Environments

### Development/Staging Environment
- **URL:** `https://greekspeed.vercel.app`
- **Purpose:** Development deployment (auto-deploys from `develop` branch)
- **Database:** Development Supabase instance
- **Stripe:** Test mode keys
- **SMS/Email:** Sandbox/test mode

### Production Environment
- **URL:** `https://trailblaize.net` (or `https://www.trailblaize.net`)
- **Purpose:** Production deployment (deploys from `main` branch)
- **Database:** Production Supabase instance
- **Stripe:** Live keys
- **SMS/Email:** Production mode

### Local Development
- **URL:** `http://localhost:3000`
- **Purpose:** Local development server
- **Database:** Local Supabase or development cloud instance
- **Stripe:** Test mode keys
- **SMS/Email:** Sandbox/test mode

### Vercel Preview Deployments
- **URL Pattern:** `https://[project-name]-[hash].vercel.app` (auto-generated per PR)
- **Purpose:** Preview deployments for each Pull Request
- **Database:** Development Supabase instance (shared)
- **Stripe:** Test mode keys
- **SMS/Email:** Sandbox/test mode
- **Note:** Automatically created when PR is opened, destroyed when PR is closed

## Test Accounts & Credentials

### Required Test Accounts

You need at least one test account for each role type to verify permission-dependent flows:

#### 1. Standard Active Member
- **System Role:** `active_member`
- **Chapter Role:** `member` (or no chapter role)
- **Member Status:** `active`
- **Permissions:** Can view chapter posts, create posts, comment, view events
- **Cannot:** Manage chapter settings, create announcements, access financial tools

**Test Account Setup:**
- Email: `test.member@trailblaize.test` (or similar)
- Password: [Store securely, provide to OpenClaw]
- Chapter: [Test chapter name]

#### 2. Chapter President/Executive
- **System Role:** `active_member`
- **Chapter Role:** `president` (or `vice_president`, `treasurer`)
- **Member Status:** `active`
- **Permissions:** All standard member permissions + chapter management, announcements, financial tools access

**Test Account Setup:**
- Email: `test.president@trailblaize.test` (or similar)
- Password: [Store securely, provide to OpenClaw]
- Chapter: [Same test chapter as standard member]
- Chapter Role: `president`

#### 3. Alumni Member
- **System Role:** `alumni`
- **Chapter Role:** `null` or `alumni_relations_chair`
- **Member Status:** `graduated` or `active` (alumni can be active)
- **Permissions:** View alumni directory, network, view events, limited chapter access

**Test Account Setup:**
- Email: `test.alumni@trailblaize.test` (or similar)
- Password: [Store securely, provide to OpenClaw]
- Chapter: [Same test chapter]
- System Role: `alumni`
- Member Status: `graduated`

#### 4. System Admin
- **System Role:** `admin`
- **Chapter Role:** `null` or any
- **Member Status:** `active`
- **Permissions:** Full system access, can manage all chapters, users, system settings

**Test Account Setup:**
- Email: `test.admin@trailblaize.test` (or similar)
- Password: [Store securely, provide to OpenClaw]
- System Role: `admin`

#### 5. Developer Account (Optional)
- **System Role:** `developer` or `active_member` with `is_developer: true`
- **Access Level:** `standard`, `elevated`, or `admin`
- **Permissions:** Developer tools access, feature flag management, user creation

**Test Account Setup:**
- Email: `test.developer@trailblaize.test` (or similar)
- Password: [Store securely, provide to OpenClaw]
- Is Developer: `true`
- Access Level: `elevated` (for testing developer features)

### Creating Test Accounts

Test accounts can be created via:

1. **Developer API Endpoint** (if available):
   - `POST /api/developer/create-user`
   - Requires developer authentication
   - See: `app/api/developer/create-user/route.ts`

2. **Supabase Dashboard:**
   - Create user in Supabase Auth
   - Create profile record in `profiles` table
   - Set appropriate roles and chapter associations

3. **Manual Sign-up:**
   - Use sign-up flow on staging environment
   - Update profile via Supabase dashboard or API

### Test Chapter Setup

Create a test chapter for testing:
- **Name:** "Test Chapter" or "QA Chapter"
- **Type:** "fraternity" or "sorority"
- **Feature Flags:** All enabled by default
- **Members:** Add test accounts to this chapter

## Verification Checklist

### Pre-PR Testing Requirements

Before opening or merging a PR, verify the following:

#### 1. Type Checking
- [ ] Run `npm run typecheck` (or `tsc --noEmit`)
- [ ] No TypeScript errors
- [ ] All types properly defined

#### 2. Linting
- [ ] Run `npm run lint`
- [ ] No linting errors
- [ ] Code follows project conventions

#### 3. Build Verification
- [ ] Run `npm run build`
- [ ] Build completes without errors
- [ ] No build warnings (unless acceptable)

#### 4. Manual Testing (Based on PR Changes)

**For UI/Component Changes:**
- [ ] Test on desktop viewport (1920x1080 or similar)
- [ ] Test on mobile viewport (375x667 or similar)
- [ ] Test with different user roles (standard member, president, alumni, admin)
- [ ] Verify responsive design works
- [ ] Check for console errors in browser DevTools
- [ ] Verify accessibility (keyboard navigation, screen reader if applicable)

**For API Route Changes:**
- [ ] Test with authenticated user
- [ ] Test with unauthenticated user (should return 401)
- [ ] Test with insufficient permissions (should return 403)
- [ ] Test with valid input data
- [ ] Test with invalid input data (should return 400)
- [ ] Test with missing required fields
- [ ] Verify error responses are user-friendly
- [ ] Check API response format matches expected structure

**For Database Changes:**
- [ ] Test migration in development database first
- [ ] Verify no data loss
- [ ] Check query performance (add indexes if needed)
- [ ] Test RLS policies still work correctly
- [ ] Verify foreign key constraints

**For Feature Flag Changes:**
- [ ] Test with feature flag enabled
- [ ] Test with feature flag disabled
- [ ] Verify feature is hidden when disabled
- [ ] Test feature flag toggle via API

**For Payment/Stripe Changes:**
- [ ] Use Stripe test mode keys
- [ ] Test with Stripe test card: `4242 4242 4242 4242`
- [ ] Test payment success flow
- [ ] Test payment failure flow
- [ ] Verify webhook handling (use Stripe CLI for local testing)
- [ ] Check payment records in database

**For SMS/Email Changes:**
- [ ] Use sandbox/test mode
- [ ] Test SMS sending (Twilio sandbox mode)
- [ ] Test email sending (SendGrid test mode)
- [ ] Verify messages are not sent to real users in staging
- [ ] Check message delivery status

**For Authentication Changes:**
- [ ] Test sign-up flow
- [ ] Test sign-in flow
- [ ] Test sign-out flow
- [ ] Test password reset
- [ ] Test protected routes (redirect to sign-in)
- [ ] Test session persistence
- [ ] Test OAuth flows (if applicable)

**For Permission/Role Changes:**
- [ ] Test with standard member (should have limited access)
- [ ] Test with chapter president (should have elevated access)
- [ ] Test with alumni (should have alumni-specific access)
- [ ] Test with admin (should have full access)
- [ ] Verify RLS policies enforce permissions

#### 5. Integration Testing

**Key Flows to Test:**
- [ ] User onboarding flow (new user sign-up → profile setup → dashboard)
- [ ] Post creation and display (social feed)
- [ ] Comment creation and replies
- [ ] Event creation and RSVP
- [ ] Alumni directory browsing
- [ ] Chapter management (president/admin only)
- [ ] Payment processing (Stripe test mode)
- [ ] Announcement creation and delivery
- [ ] Profile editing
- [ ] Chapter switching (if user belongs to multiple chapters)

#### 6. Cross-Browser Testing (If Major UI Changes)
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if available)

#### 7. Performance Checks
- [ ] Page load times are acceptable
- [ ] No excessive API calls
- [ ] Images are optimized
- [ ] No memory leaks (check browser DevTools)

### Post-PR Testing (After Merge)

After PR is merged to `develop`:
- [ ] Verify deployment to `greekspeed.vercel.app` succeeds
- [ ] Smoke test key features on staging
- [ ] Check for console errors
- [ ] Verify environment variables are set correctly

## Feature Flags

### Available Feature Flags

Feature flags are stored in `chapters.feature_flags` (JSONB column) and can be toggled per chapter.

**Current Flags:**
- `financial_tools_enabled` - Enables financial/dues management features
- `recruitment_crm_enabled` - Enables recruitment CRM features
- `events_management_enabled` - Enables event management features

**Default:** All flags are **enabled by default** (if flag is missing or null, feature is enabled).

### Managing Feature Flags

#### Via API
```typescript
// GET feature flags for a chapter
GET /api/chapters/[chapterId]/features

// PATCH feature flags for a chapter
PATCH /api/chapters/[chapterId]/features
Body: {
  "feature_flags": {
    "financial_tools_enabled": false,
    "recruitment_crm_enabled": true,
    "events_management_enabled": true
  }
}
```

#### Via UI
- Navigate to `/dashboard/feature-flags` (admin/developer only)
- Toggle flags for specific chapters
- Changes take effect immediately

#### For Testing
To test a feature with flag disabled:
1. Use test chapter account
2. Navigate to feature flags page (if you have access)
3. Disable the relevant flag
4. Test that feature is hidden/disabled
5. Re-enable flag after testing

### Feature Flag Usage in Code

```typescript
// In components
import { useFeatureFlag } from '@/lib/hooks/useFeatureFlag';

function FinancialTools() {
  const { enabled, loading } = useFeatureFlag('financial_tools_enabled');
  
  if (loading) return <Spinner />;
  if (!enabled) return <FeatureDisabled />;
  
  return <FinancialToolsContent />;
}
```

## External Service Test Modes

### Stripe Test Mode

**Test Keys:**
- Use Stripe test publishable key: `pk_test_...`
- Use Stripe test secret key: `sk_test_...`
- Set in `.env.local` or Vercel environment variables

**Test Cards:**
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 0027 6000 3184`
- Expiry: Any future date (e.g., `12/25`)
- CVC: Any 3 digits (e.g., `123`)

**Testing:**
- All payments in staging should use test mode
- Verify payment intents are created
- Check webhook events (use Stripe CLI for local testing)
- Verify payment records in database

### Twilio SMS Sandbox Mode

**Sandbox Mode:**
- Set environment variable: `TWILIO_SANDBOX_MODE=true`
- In sandbox mode, SMS only sends to verified numbers
- Test mode can also be enabled per request: `testMode: true` in API body

**Testing:**
- Send test SMS via `/api/sms/send`
- Verify SMS is not sent to real users
- Check SMS delivery status
- Verify SMS records in database

### SendGrid Email Test Mode

**Test Mode:**
- Use SendGrid test API key
- Emails in test mode may be limited or go to test inbox
- Check SendGrid dashboard for delivery status

**Testing:**
- Send test email via email service
- Verify email content is correct
- Check email delivery status
- Verify email records in database

## Reporting Issues

### Staging Issues Unrelated to Your Change

If you find staging issues that are **not related to your PR changes**:

1. **Create Linear Ticket:**
   - Title: `[Staging] [Brief description]`
   - Include: Steps to reproduce, expected vs actual behavior
   - Tag with appropriate labels (bug, staging, etc.)
   - Link to staging URL if applicable

2. **Or Ping Directly:**
   - If it's a critical blocking issue
   - If it's clearly unrelated to your work
   - Use team communication channel (Slack, etc.)

### PR-Related Issues

If you find issues **related to your PR changes**:
- Fix before merging
- Update PR description with testing notes
- Document any known limitations

## Testing Notes Template for PRs

When opening a PR, include testing notes:

```markdown
## Testing Notes

### Environments Tested
- [ ] Local (localhost:3000)
- [ ] Staging (greekspeed.vercel.app)
- [ ] Vercel Preview ([preview-url])

### Test Accounts Used
- Standard Member: [email]
- Chapter President: [email]
- Alumni: [email]
- Admin: [email]

### Features Tested
- [ ] [Feature 1] - Works as expected
- [ ] [Feature 2] - Works as expected
- [ ] [Feature 3] - Known limitation: [description]

### External Services
- [ ] Stripe test payments - Working
- [ ] SMS sending (sandbox) - Working
- [ ] Email sending (test mode) - Working

### Browser Testing
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari (if applicable)

### Mobile Testing
- [ ] Mobile viewport (375x667)
- [ ] Responsive design verified

### Known Issues
- None
- OR: [List any known issues or limitations]

### Feature Flags
- [ ] Tested with relevant flags enabled
- [ ] Tested with relevant flags disabled (if applicable)
```

## Quick Reference

### Environment URLs
- **Development:** `https://greekspeed.vercel.app`
- **Production:** `https://trailblaize.net`
- **Local:** `http://localhost:3000`
- **Preview:** Auto-generated per PR

### Key Test Endpoints
- Feature Flags: `/api/chapters/[id]/features`
- Create User: `/api/developer/create-user` (developer only)
- SMS Send: `/api/sms/send`
- Posts: `/api/posts`
- Events: `/api/events`

### Test Mode Environment Variables
```env
# Stripe Test Mode
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Twilio Sandbox
TWILIO_SANDBOX_MODE=true

# SendGrid Test
SENDGRID_API_KEY=SG.test_...
```

### User Roles Reference
- **System Roles:** `admin`, `active_member`, `alumni`, `developer`
- **Chapter Roles:** `president`, `vice_president`, `treasurer`, `secretary`, `rush_chair`, `social_chair`, `philanthropy_chair`, `risk_management_chair`, `alumni_relations_chair`, `member`, `pledge`
- **Member Status:** `active`, `inactive`, `probation`, `suspended`, `graduated`

## Additional Notes

- **No Automated Tests:** Currently, there are no Cypress, Jest, or Vitest tests. All testing is manual.
- **Database:** Staging uses a shared development Supabase instance. Be careful not to delete/modify critical test data.
- **Environment Detection:** The app detects environment via `lib/env.ts` based on hostname or `NEXT_PUBLIC_ENV` variable.
- **Vercel Previews:** Each PR automatically gets a preview deployment. Use these for testing before merging.
