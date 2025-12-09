# Financial Tools Feature Flag - Testing Guide

## Overview
This guide will help you test the Financial Tools feature flag implementation. The feature flag controls visibility and access to all financial/dues-related functionality for chapters.

## Prerequisites
1. Access to Supabase dashboard
2. A test chapter with at least one admin user and one active member user
3. The chapter's `feature_flags` JSONB column should exist in the `chapters` table

## Testing Steps

### Step 1: Verify Database Setup

1. **Check Chapter Table Structure**
   - Navigate to Supabase → Table Editor → `chapters`
   - Verify that the `feature_flags` column exists (type: `jsonb`)
   - Check that it has a default value or is nullable

2. **View Current Feature Flags**
   - Find your test chapter in the `chapters` table
   - Check the `feature_flags` column value
   - Default should be: `{"financial_tools_enabled": false, "recruitment_crm_enabled": false}`

### Step 2: Test with Feature Flag DISABLED (Default)

#### 2.1 Test Exec Dashboard
1. **Login as Admin/Exec User** (treasurer or admin role)
2. **Navigate to Exec Dashboard** (`/dashboard/admin`)
3. **Expected Results:**
   - ❌ "Dues" menu item should NOT appear in sidebar
   - ❌ "Financial" group should NOT appear in sidebar
   - ❌ "Budget" menu item should NOT appear
   - ✅ Other menu items (Events, Tasks, Members, Invitations) should still be visible

#### 2.2 Test Active Member Portal
1. **Login as Active Member**
2. **Navigate to Dashboard** (`/dashboard`)
3. **Expected Results:**
   - ❌ "Dues" tab should NOT appear in header navigation
   - ❌ "DuesStatusCard" component should NOT be visible
   - ❌ "Dues" option should NOT appear in mobile tools menu
   - ✅ Other features (Tasks, Calendar, Announcements) should work normally

#### 2.3 Test Direct URL Access
1. **As Active Member**, try to navigate directly to `/dashboard/dues`
2. **Expected Result:**
   - ✅ Should automatically redirect to `/dashboard`
   - ✅ Should NOT show dues page

#### 2.4 Test API Routes (With Feature Disabled)
1. **Open Browser DevTools** → Network tab
2. **As Admin**, try to access dues endpoints:
   - GET `/api/dues/assignments`
   - GET `/api/dues/cycles`
3. **Expected Results:**
   - ✅ Should return `403 Forbidden`
   - ✅ Error message: "This feature is not available for your chapter"

### Step 3: Enable Feature Flag

1. **Navigate to Supabase** → Table Editor → `chapters`
2. **Find your test chapter**
3. **Update `feature_flags` column:**
   ```json
   {
     "financial_tools_enabled": true,
     "recruitment_crm_enabled": false
   }
   ```
4. **Save the changes**
5. **Refresh your browser** (or wait a few seconds for cache to clear)

### Step 4: Test with Feature Flag ENABLED

#### 4.1 Test Exec Dashboard
1. **Login as Admin/Exec User**
2. **Navigate to Exec Dashboard** (`/dashboard/admin`)
3. **Expected Results:**
   - ✅ "Dues" menu item SHOULD appear in "Manage" group
   - ✅ "Financial" group SHOULD appear with "Budget" and "Vendors"
   - ✅ Clicking "Dues" should show the TreasurerDashboard component
   - ✅ Clicking "Budget" should show the BudgetView component

#### 4.2 Test Active Member Portal
1. **Login as Active Member**
2. **Navigate to Dashboard** (`/dashboard`)
3. **Expected Results:**
   - ✅ "Dues" tab SHOULD appear in header navigation
   - ✅ "DuesStatusCard" component SHOULD be visible in desktop sidebar
   - ✅ "Dues" option SHOULD appear in mobile tools menu (FAB)
   - ✅ Clicking "Dues" tab should navigate to `/dashboard/dues`

#### 4.3 Test Dues Page Access
1. **As Active Member**, navigate to `/dashboard/dues`
2. **Expected Result:**
   - ✅ Should show the DuesClient component
   - ✅ Should display dues assignments and payment options
   - ✅ No redirect should occur

#### 4.4 Test API Routes (With Feature Enabled)
1. **Open Browser DevTools** → Network tab
2. **As Admin**, access dues endpoints:
   - GET `/api/dues/assignments` → Should return assignments array
   - GET `/api/dues/cycles` → Should return cycles array
3. **Expected Results:**
   - ✅ Should return `200 OK` with data
   - ✅ Should NOT return 403 error

#### 4.5 Test Dues Payment Flow
1. **As Active Member**, navigate to `/dashboard/dues`
2. **Expected Results:**
   - ✅ Should see any existing dues assignments
   - ✅ "Pay Now" button should be functional
   - ✅ Clicking payment should initiate Stripe checkout (if configured)

### Step 5: Toggle Back to Disabled

1. **Update `feature_flags` in Supabase:**
   ```json
   {
     "financial_tools_enabled": false,
     "recruitment_crm_enabled": false
   }
   ```
2. **Refresh browser**
3. **Verify all features are hidden again** (repeat Step 2 tests)

## Troubleshooting

### Issue: Feature flag changes not reflecting
**Solution:**
- Clear browser cache
- Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
- Check that the `chapter_id` in user's profile matches the chapter you updated
- Verify API route `/api/chapters/[id]/features` returns correct flags

### Issue: API returns 403 even with flag enabled
**Check:**
- User is authenticated
- User's `chapter_id` in profiles table matches the chapter with enabled flag
- Feature flag value in database is exactly: `{"financial_tools_enabled": true}`
- No typos in JSON (use Supabase JSON editor)

### Issue: UI components still showing when disabled
**Check:**
- Browser cache cleared
- Components are using `useChapterFeatures()` hook correctly
- No hardcoded visibility in components
- Check browser console for errors

### Issue: Dues page not redirecting when disabled
**Check:**
- `/dashboard/dues/page.tsx` has the feature flag check
- `useEffect` is properly configured
- Router is imported and used correctly

## Test Checklist

- [ ] Feature flag defaults to `false` for new chapters
- [ ] Exec dashboard hides dues/budget when flag is `false`
- [ ] Exec dashboard shows dues/budget when flag is `true`
- [ ] Member portal hides dues UI when flag is `false`
- [ ] Member portal shows dues UI when flag is `true`
- [ ] Direct URL access to `/dashboard/dues` redirects when disabled
- [ ] Direct URL access to `/dashboard/dues` works when enabled
- [ ] API routes return 403 when flag is `false`
- [ ] API routes work normally when flag is `true`
- [ ] No console errors in browser
- [ ] No regressions to other dashboard features

## SQL Commands for Quick Testing

### Enable Financial Tools for a Chapter
```sql
UPDATE chapters
SET feature_flags = jsonb_set(
  COALESCE(feature_flags, '{}'::jsonb),
  '{financial_tools_enabled}',
  'true'::jsonb
)
WHERE id = 'YOUR_CHAPTER_ID';
```

### Disable Financial Tools for a Chapter
```sql
UPDATE chapters
SET feature_flags = jsonb_set(
  COALESCE(feature_flags, '{}'::jsonb),
  '{financial_tools_enabled}',
  'false'::jsonb
)
WHERE id = 'YOUR_CHAPTER_ID';
```

### Check Current Feature Flags
```sql
SELECT id, name, feature_flags
FROM chapters
WHERE id = 'YOUR_CHAPTER_ID';
```

## Notes

- Feature flags are cached client-side, so changes may take a few seconds to reflect
- The API route `/api/chapters/[id]/features` is the source of truth
- All feature flag checks happen both client-side (UI) and server-side (API)
- This pattern can be replicated for future features (e.g., recruitment_crm_enabled)

