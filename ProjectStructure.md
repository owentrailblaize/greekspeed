Analyzing the file structure and suggesting improvements:


[10 tools called]

File structure analysis and issues identified:

Current structure
```
greekspeed/
├── (marketing)/                      ❌ ROOT LEVEL - Move to app/
├── app/
│   ├── (auth)/                      ✅ OK
│   ├── (marketing)/                 ✅ OK  
│   └── api/                         ✅ OK
├── components/
│   ├── [15+ Alumni* files]          ❌ Should be in features/alumni/
│   ├── ActivityIndicator.tsx        ❌ Feature-specific
│   ├── ClickableField.tsx           ❌ Feature-specific
│   ├── DashboardClient.tsx          ❌ Should be in features/dashboard/
│   ├── MyChapterPage.tsx             ❌ Duplicate with mychapter/
│   ├── chapter/                     ✅ OK
│   ├── dashboards/                   ✅ OK
│   ├── invitations/                 ✅ OK
│   ├── join/                        ✅ OK
│   ├── messaging/                   ✅ OK
│   ├── mychapter/                   ✅ OK (has types.ts)
│   ├── settings/                    ✅ OK
│   ├── social/                      ✅ OK
│   └── user-management/             ✅ OK
├── lib/
│   ├── config/                      ✅ OK
│   ├── contexts/                    ✅ OK
│   ├── hooks/                       ✅ OK (15 hooks)
│   ├── services/                    ⚠️  Some grouping needed
│   ├── utils/                       ✅ OK (6 utils)
│   ├── utils.ts                     ❌ Duplicate?
│   ├── mockAlumni.ts               ❌ Test data?
│   ├── stripe-server.ts             ⚠️  Consider moving
│   └── stripe.ts                    ⚠️  Consider moving
└── types/                          ✅ OK
```

Major issues
1. Components root is overcrowded with Alumni, Dashboard, and one-off files.
2. Duplicate: `(marketing)` at root and `app/(marketing)`.
3. Services could be grouped (`lib/services`).
4. Test files near production code (`mockAlumni.ts`).
5. Flat feature folders; consider nesting features (e.g., `features/alumni`, `features/dashboard`).

Proposed structure
```
greekspeed/
├── app/                             # Next.js App Router
│   ├── (auth)/                      # Authentication pages
│   ├── (marketing)/                 # Public marketing pages
│   ├── api/                         # API routes
│   └── [pages]/                     # Dashboard, admin, etc.
│
├── components/
│   ├── features/                    # 🆕 Feature-specific components
│   │   ├── alumni/                  # All Alumni-related components
│   │   │   ├── AlumniCard.tsx
│   │   │   ├── AlumniDashboard.tsx
│   │   │   ├── AlumniPipeline.tsx
│   │   │   ├── AlumniTableView.tsx
│   │   │   ├── AlumniProfileModal.tsx
│   │   │   └── ActivityIndicator.tsx
│   │   ├── dashboard/                # Dashboard components
│   │   │   ├── DashboardClient.tsx
│   │   │   ├── DashboardHeader.tsx
│   │   │   ├── DashboardOverview.tsx
│   │   │   └── dashboards/          # Move existing dashboards/
│   │   ├── profile/                 # Profile components
│   │   │   ├── EditProfileModal.tsx
│   │   │   ├── EditAlumniProfileModal.tsx
│   │   │   ├── UserAvatar.tsx
│   │   │   └── ProfileCompletionGate.tsx
│   │   ├── chapter/                 # Chapter components
│   │   │   ├── MyChapterPage.tsx (consolidate)
│   │   │   └── ActivelyHiringPage.tsx
│   │   ├── messaging/               # Existing messaging/
│   │   ├── social/                  # Existing social/
│   │   ├── invitations/             # Existing invitations/
│   │   ├── join/                     # Existing join/
│   │   └── settings/                # Existing settings/
│   │
│   ├── shared/                       # 🆕 Shared/reusable components
│   │   ├── ClickableField.tsx
│   │   ├── ViewToggle.tsx
│   │   └── WelcomeModal.tsx
│   │
│   ├── marketing/                   # 🆕 Marketing components
│   │   ├── MarketingHeader.tsx
│   │   └── LandingPage.tsx          # Move from (marketing)/
│   │
│   ├── ui/                          # Existing shadcn/ui components
│   └── [other groupings]/          # Existing chapter/, user-management/, etc.
│
├── lib/
│   ├── config/                       # Configuration files
│   ├── contexts/                     # React contexts
│   ├── hooks/                        # Custom hooks
│   ├── services/                     # Business logic services
│   │   ├── sms/                      # 🆕 Group SMS services
│   │   │   ├── smsService.ts
│   │   │   └── smsServiceTelnyx.ts
│   │   ├── stripe/                   # 🆕 Group Stripe services
│   │   │   ├── stripe.ts
│   │   │   └── stripe-server.ts
│   │   └── [other services]         # avatar, banner, etc.
│   ├── utils/                        # Utility functions
│   └── utils.ts                      # Main utils export
│
├── types/                            # TypeScript types
├── public/                           # Static assets
└── styles/                           # Global styles
```

Implementation plan
Phase 1: Clean up duplicates
- Delete `(marketing)/LandingPage.tsx` (use app version)
- Delete `components/MyChapterPage.tsx` (duplicate)
- Delete `lib/mockAlumni.ts` (test data)

Phase 2: Restructure components
- Move Alumni components into `features/alumni/`
- Move Dashboard components into `features/dashboard/`
- Move Profile components into `features/profile/`
- Create `shared/` for reusable components
- Create `marketing/` for marketing components

Phase 3: Restructure lib
- Group SMS services under `lib/services/sms/`
- Group Stripe services under `lib/services/stripe/`

Phase 4: Update imports
- Update paths after reorganization


[2 tools called]

## Impact

Current state:
- 12 import statements for Alumni components (7 files)
- 3 import statements for Dashboard components (3 files)
- ~10 files to restructure

Estimated work:
- File moves: ~20 files
- Import updates: ~15 files
- Consolidate duplicates: 2 files

## Recommended order

1. Delete duplicates first:
   - `(marketing)/LandingPage.tsx`
   - `components/MyChapterPage.tsx`
   - `lib/mockAlumni.ts`

2. Create new structure in parallel:
   - `components/features/alumni/`
   - `components/features/dashboard/`
   - `components/features/profile/`
   - `components/shared/`
   - `components/marketing/`
   - `lib/services/sms/`
   - `lib/services/stripe/`

3. Move files in batches and update imports incrementally to reduce risk.

Proceed with:
1) Detailing duplicates to delete,
2) Listing files to move into alumni/features/,
3) Listing files to move into dashboard/features/, or
4) Create a step-by-step script for the full refactor?