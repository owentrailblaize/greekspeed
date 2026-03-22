# AGENTS.md

## Cursor Cloud specific instructions

### Service overview

This is a single Next.js 15 monolith (no microservices, no Docker). The only runtime service is the Next.js dev server. All data lives in a cloud-hosted Supabase instance (PostgreSQL + Auth + Storage); there is no local database to run.

### Running the app

Standard commands are in `package.json` and documented in `CLAUDE.md`:

- `npm run dev` — starts dev server on port 3000
- `npm run lint` — ESLint (pre-existing warnings/errors in the codebase are expected)
- `npm run typecheck` — TypeScript strict-mode check (`tsc --noEmit`)
- `npm run build` — production build

### Environment variables

All secrets are injected as environment variables by the Cloud Agent platform. However, Next.js requires a `.env.local` file to pick them up at runtime. Before starting the dev server, generate `.env.local` from injected env vars. A minimal approach:

```bash
env | grep -E '^(NEXT_PUBLIC_|SUPABASE_|SENDGRID_|TWILIO_|TELNYX_|SENTRY_|LINKEDIN_|ONE_SIGNAL|CRON_|STRIPE_|CROWDED_|TEST_NOTIFICATION)' | sort > .env.local
echo 'NEXT_PUBLIC_APP_URL=http://localhost:3000' >> .env.local
```

### Gotchas

- **No automated test suite** — the repo has no test framework configured. Validation is manual (browser + lint + typecheck).
- **Lint exits non-zero** — `npm run lint` returns exit code 1 due to pre-existing errors (mostly `react/no-unescaped-entities` and `prefer-const`). This is expected and does not indicate a problem with your changes.
- **Sentry deprecation warnings** — the dev server prints several `@sentry/nextjs DEPRECATION WARNING` lines on startup. These are cosmetic and do not affect functionality.
- **First page load is slow** — Next.js compiles pages on first request in dev mode; the initial `GET /` may take 10-15 seconds.
- **Authentication requires a real Supabase account** — the app uses a cloud Supabase project for auth. To test authenticated flows, you need valid credentials for that Supabase instance. A test login account is required for end-to-end testing beyond the public pages.
