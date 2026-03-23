# Profile Bridge Redirect Fix — Test Guide

## What was fixed

When navigating to `/dashboard/profile/[userId]`, the bridge page checks for a profile slug and redirects to `/profile/[slug]`. Previously, loading could clear before the redirect completed, causing the "Profile not found" error to appear briefly. The fix keeps the bridge in a loading state until the redirect finishes.

**File changed:** `app/dashboard/profile/[userId]/page.tsx`

## Entry points that hit the bridge

- **Mobile:** ProfileModalContext (clicking a name), AlumniProfileModal (clicking alumni)
- **Mobile & desktop:** MessageList (clicking a profile link in chat), direct URL navigation

---

## Test steps to reproduce and verify

### Prerequisites

- At least two users with profiles that have `profile_slug` or `username` set
- One user logged in, able to navigate to another user's profile

### 1. Mobile — Profile tap from feed/post

1. Open the app on a mobile device or use Chrome DevTools (mobile viewport).
2. Log in and go to the dashboard.
3. Find a post or feed item that links to another user’s profile.
4. Tap the user’s name or avatar to open their profile.
5. **Expected:** Skeleton loader appears, then redirect to `/profile/[slug]` without a "Profile not found" flash.
6. **Regressed (before fix):** Brief "Profile not found" screen before the profile loads.

### 2. Mobile — Profile tap from messages

1. Open Messages.
2. Open a conversation that includes a shared profile.
3. Tap the profile link/card.
4. **Expected:** Smooth transition from loading to profile; no error flash.

### 3. Mobile — Alumni profile tap

1. Go to the Alumni section.
2. Tap an alumni profile.
3. **Expected:** Skeleton, then redirect to the profile page without an error flash.

### 4. Desktop — Direct URL / messages profile link

1. Log in on desktop.
2. In the address bar, go to: `https://[your-app]/dashboard/profile/[userId]`  
   Replace `[userId]` with a real user ID whose profile has a slug.
3. **Expected:** Page redirects to `/profile/[slug]`; no error UI in between.
4. Alternatively, from Messages, click a profile link and confirm the same behavior.

### 5. Slow network (optional, to stress test)

1. Open Chrome DevTools → Network → set throttling to "Slow 3G".
2. Navigate to `/dashboard/profile/[userId]` or use any profile link that hits the bridge.
3. **Expected:** Loading state remains until the redirect completes; no error flash.

---

## Classification checklist

| Check | Pass / Fail |
|-------|-------------|
| No "Profile not found" flash on mobile when tapping a profile | |
| No error flash on desktop when visiting `/dashboard/profile/[userId]` | |
| Redirect completes to `/profile/[slug]` | |
| Skeleton loader visible during redirect | |
| Real "Profile not found" still shown when the user truly doesn’t exist | |
| Profiles without a slug still load (backward compatibility) | |

---

## Backward compatibility

Profiles without `profile_slug` or `username` still load via `fetchUserProfile` and show the in-bridge profile view. No change to that path.
