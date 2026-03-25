# Crowded API — Cursor / Postman exploration session

**Purpose:** Single living doc for this integration thread: what we verified in Postman (sandbox), findings, and how they map to Trailblaize code and [Linear — Crowded Integration Strategy](https://linear.app/trailblaize/project/crowded-integration-strategy-6e845cc7474a/overview).

**Do not commit API keys or paste full tokens into this file.** Use placeholders like `{{api_token}}` or “redacted”.

---

## Confirmed working — sandbox (Mar 2026)

| Setting | Value |
|---------|--------|
| **API base (`base_url`)** | `https://sandbox-api.crowdedfinance.com` (no trailing slash) |
| **Auth** | **Bearer Token** — same JWT Crowded issued (not `X-API-Key` for this token) |
| **Sanity request** | `GET {{base_url}}/api/v1/organizations` → **200 OK** |
| **Postman** | **Desktop** recommended; Cloud Agent had empty-host / TLS issues on other hosts |

**Why not `api.alpha.staging.crowded.me` (for now):** TLS handshake failures (`EPROTO` / alert 40) occurred from Postman in some setups. **`https://sandbox-api.crowdedfinance.com`** is publicly reachable and works with the sandbox Bearer token. Confirm with Kyle whether production will differ; keep both URLs below for reference.

---

## Crowded base URLs (reference)

| URL | Notes |
|-----|--------|
| `https://sandbox-api.crowdedfinance.com` | **Use for sandbox development & Postman** (verified 200 on organizations). |
| `https://api.alpha.staging.crowded.me` | Alternate staging host; TLS/agent issues reported — retry later with Desktop agent or ask Crowded. |
| `https://api.crowded.me` | **Production** — separate token from Crowded; not for day-to-day dev until go-live. |

---

## Auth summary (meeting + verification)

- **Sandbox token:** `Authorization: Bearer <JWT>`  
- **Production:** `api.crowded.me` + manually issued production token (no self-serve portal yet).  
- Postman collection defaults may still say **API Key / X-API-Key** — override with **Bearer** at collection or request level.

---

## Before you start (pre-flight)

1. **Environment** `Crowded API - Trailblaize`: set **`base_url`** = `https://sandbox-api.crowdedfinance.com`, **`api_token`** = full JWT (Current value). Save. Select this environment (top-right).
2. **Collection** `Crowded API Docs V0.9` → **Authorization** → **Bearer Token** → `{{api_token}}` → Save. (Avoid conflicting `base_url` on collection vs environment — prefer one source of truth, usually **environment**.)
3. **Sanity check:** `GET {{base_url}}/api/v1/organizations` → **200**.
4. Optional: Postman **Console** to confirm resolved URL and `Authorization: Bearer`.

---

## Pass 1 — Organizations & chapters (ID mapping)

**Goal:** Link Trailblaize `chapters` to Crowded org/chapter IDs.

**In Postman:** Organizations → Get all; then **Chapters** folder → Get all (or equivalent).

**Capture:** Redacted JSON samples or screenshots of response bodies.

### Findings — Pass 1 (organizations + chapters — sandbox)

| Item | Notes |
|------|--------|
| Sandbox `base_url` used | `https://sandbox-api.crowdedfinance.com` |
| Org `id` / `name` | From `GET /organizations`: `Trailblaize` org UUID (confirm matches `chapter.organizationId` below). |
| `meta` pagination | Nested: `meta.pagination` with `total`, `limit`, `offset`, `sort`, `order` (see samples). |
| Sample chapter id(s) | `c651e8dd-a3b0-4756-91a0-30d18e22d714` (sandbox; **use as `chapterId` path param** for Accounts + Collect). |
| Chapter fields (live **GET /chapters** sample) | `name` may be `null`; `organization` = display string (`Trailblaize`); `organizationId` links to org; `status` (e.g. `Active`); `businessVertical` (e.g. `SororitiesFraternities`); `createdAt`. |
| `organizationId` on chapter | `c1f85333-2782-478d-97d3-458e3420cecf` — must equal org `id` from **Organizations → Get all** (verify in Postman if any digit mismatch). |
| Mapping hypothesis | **1:1:** Supabase `chapters.id` (our PK) ↔ store **Crowded chapter UUID** (`crowded_chapter_id` or column on `crowded_accounts` / mapping table). Use Crowded `chapterId` in all chapter-scoped API paths. Optionally cache `organizationId` for org-level calls. |

**Live Chapters — Get all (sandbox) sample shape:**

```json
{
  "data": [
    {
      "id": "c651e8dd-a3b0-4756-91a0-30d18e22d714",
      "name": null,
      "organization": "Trailblaize",
      "organizationId": "c1f85333-2782-478d-97d3-458e3420cecf",
      "status": "Active",
      "businessVertical": "SororitiesFraternities",
      "createdAt": "2026-01-25T21:38:18.000Z"
    }
  ],
  "meta": { "pagination": { "total": 1, "limit": 10, "offset": 0, "sort": "createdAt", "order": "DESC" } }
}
```

**Postman env tip:** Add variable `chapter_id` = `c651e8dd-a3b0-4756-91a0-30d18e22d714` so `:chapterId` resolves (replace placeholder `chapter_id` string if the collection uses literals).

**Tickets:** TRA-410, TRA-412, TRA-413.

---

## Pass 2 — Accounts (create / list)

**Goal:** Payloads/IDs for `crowded_accounts`.

### Findings — Pass 2

| Item | Notes |
|------|--------|
| **List endpoint** | `GET {{base_url}}/api/v1/chapters/:chapterId/accounts` |
| **Path param** | `chapterId` = real Crowded chapter UUID (sandbox: `c651e8dd-a3b0-4756-91a0-30d18e22d714`), **not** the literal string `chapter_id`. |
| **Response shape** (list; confirm with live 200) | Each item: `id`, `name`, `status`, `accountNumber`, `routingNumber`, `currency`, `balance`, `hold`, `available`, `contactId`, `createdAt`. Doc/example used placeholders `account_id` / `contact_id` — replace with real IDs from sandbox when testing. |
| **Fields to persist (app)** | `crowded_account_id` ← `id`; link to our `chapter_id`; optional cache: `status`, `currency`, balances; `contactId` if we sync contacts. **Do not** store full account/routing in logs; treat as sensitive in UI. |
| **Create** | Collection includes **POST Bulk create accounts** — run only when ready; not filled here. |

**Tickets:** TRA-412, TRA-413, TRA-410.

**Troubleshooting:** Path param must be `{{chapter_id}}`, not literal `chapter_id` (else 403 / wrong chapter). **400 `NO_CUSTOMER`:** banking customer not ready — complete **Finish setup** in portal (below) or ask Crowded to provision sandbox.

---

## Crowded staging portal — Finish setup (brief)

**URL:** `https://staging.portal.crowdedme.xyz` (log in as your sandbox user).

| Step | What to do |
|------|------------|
| 1 | Click **Finish Setup** (blue banner) or equivalent until the org-type modal appears. |
| 2 | **Select your organization type** → choose **Nonprofit** (matches Greek/chapter use and API `SororitiesFraternities`). Use **For-Profit** only if your legal entity is for-profit and Crowded/Kyle confirm. |
| 3 | Click **Save** (enabled after a selection). |
| 4 | Complete each following screen (legal name, EIN, address, beneficial owners, etc.) using **sandbox/test** data Crowded allows — if a field blocks you, ask **Kyle** for staging shortcuts or test values. |
| 5 | Finish until the **“finish bank account”** flow is done: banner gone or **Crowded Checking** clearly active, not just $0 placeholder with setup pending. |
| 6 | Return to Postman → **GET** `…/chapters/{{chapter_id}}/accounts` — expect **200** with real account rows (not `NO_CUSTOMER`). |

**Then:** **Contacts** → **Collections** in UI or API as planned.

### Business details modal (blockers: legal name, website, address)

Crowded asks for **Legal Entity Name**, **Website**, **Registered Business Address** (street, no P.O. box). The form says *“Not incorporated? Keep scrolling”* — scroll the modal for an alternate path if Trailblaize is not yet a formal entity.

| Field | Where to get it (real) | Sandbox / unblock |
|-------|-------------------------|-------------------|
| **Legal entity name** | Exact name on **EIN** (IRS CP 575) or state formation (LLC/Corp charter). Ask **whoever filed the company** (founder, accountant, lawyer) or check **state business registry**. | **Kyle / Crowded:** ask for **sandbox test legal name + EIN** or **pre-provisioned org** so API work isn’t blocked on production KYC. |
| **Website** | Helper text allows **org profile on social** — use **https://trailblaize.net**, **LinkedIn company URL**, or public Instagram/X for Trailblaize. | Any stable public URL Crowded accepts. |
| **Registered business address** | **Principal place of business** or **registered agent** address from formation docs (often same as mail for small cos). Must be **street** (no P.O. box). | Crowded may allow a **known test address** in staging — confirm with Kyle; do **not** invent a fake real-world address if they require verifiable data. |

**Fastest unblock:** Email/slack **Kyle** (or **support@bankingcrowded.com**): *“We’re on staging Finish Setup; need either approved sandbox business details or a shortcut to complete customer provisioning for partner API testing (NO_CUSTOMER on accounts).”*

---

## Pass 3 — Collect / collection links (dues)

**Goal:** Dues → Crowded **collections** + **intents**; identify member-facing payment URL from **live** responses.

### API surface (from Postman collection + screenshots)

| Step | Method | Path | Notes |
|------|--------|------|--------|
| Create collection | `POST` | `/api/v1/chapters/:chapterId/collections` | Creates a collectable “fund” / campaign under a chapter. |
| Create intent | `POST` | `/api/v1/chapters/:chapterId/collections/:collectionId/intents` | Per-payer intent; body references `contactId`. |

**Create Collection — request body (raw JSON):**

```json
{
  "data": {
    "title": "Making Pizza 187",
    "requestedAmount": 50000
  }
}
```

- **`requestedAmount`:** Treat as **minor units (cents)** unless Crowded docs say otherwise — `50000` ⇒ **$500.00** for product logic / display.

**Create Intent — request body (raw JSON):**

```json
{
  "data": [
    {
      "contactId": "contact_id"
    }
  ]
}
```

- Replace `contact_id` with a real **Crowded contact** UUID from **Contacts** APIs after you create or list contacts for that chapter/member.

### Findings — Pass 3

| Item | Notes |
|------|--------|
| Endpoint(s) | See table above. |
| Required IDs | `chapterId` → sandbox chapter UUID; `collectionId` → from **Create Collection** response after send; `contactId` → from Contacts. |
| **Member-facing URL field** | **TBD — send requests with real IDs** and record which response field holds the pay/checkout URL (e.g. `url`, `checkoutUrl`, `hostedUrl` — confirm from 200 JSON). Collection may also have **Get** on collection — check for link fields there. |

**Tickets:** TRA-414, TRA-415.

---

## Pass 4 — Webhooks

**Goal:** Signature + one event payload for `/api/webhooks/crowded`.

### Findings — Pass 4

| Item | Notes |
|------|--------|
| Event type(s) | |
| Signature approach | |
| Idempotency key | |

**Tickets:** TRA-416.

---

## Local codebase mapping

| Area | Notes |
|------|--------|
| Env | `CROWDED_API_BASE_URL=https://sandbox-api.crowdedfinance.com` (sandbox); Bearer token in env (e.g. `CROWDED_API_TOKEN`); webhook secret when known |
| Client | `lib/services/crowded/crowded-client.ts` — `Authorization: Bearer`, base URL from env |
| Test | `npm run test:crowded` — update to match Postman (Bearer + sandbox base) when implementing TRA-409 |

---

## Session log

| When | What we did | Outcome |
|------|-------------|---------|
| Mar 2026 | Empty `base_url` → Cloud Agent host error | Fixed by setting env `base_url`. |
| Mar 2026 | `api.alpha.staging.crowded.me` | TLS handshake failure in some Postman setups. |
| Mar 2026 | Switched to `https://sandbox-api.crowdedfinance.com` + Bearer | **200** on `GET /api/v1/organizations`; org **Trailblaize** returned in `data`. |
| Mar 2026 | **Chapters Get all** | Recorded sandbox chapter `c651e8dd-…`, `organizationId`, vertical `SororitiesFraternities`. |
| Mar 2026 | **Accounts / Collect** (docs + Postman UI) | Documented `GET …/chapters/:id/accounts`; Collect: `POST …/collections` + `POST …/intents` + bodies; pay URL pending live 200. |
| Mar 2026 | Accounts **403** | Fixed: path variable `{{chapter_id}}` not literal `chapter_id`. |
| Mar 2026 | Accounts **400 NO_CUSTOMER** | Matches portal: bank/customer setup incomplete — user running **Finish setup** on staging portal. |

---

## What to do manually next (in order)

1. **Postman env:** Set **`chapter_id`** = `c651e8dd-a3b0-4756-91a0-30d18e22d714` (Current value). Re-send **Accounts → Get All** so path is `/chapters/c651e8dd-…/accounts` — **not** the literal `chapter_id`. Screenshot or paste **live** `data[]` (redact account numbers if you prefer).

2. **Contacts (prerequisite for intents):** In the collection, open **Contacts** — list or create a contact for the sandbox chapter so you have a real **`contactId`**. Without it, **Create Intent** cannot be exercised meaningfully.

3. **Collect — run for real:**  
   - **POST Create Collection** with `chapterId` = sandbox chapter UUID and body `title` + `requestedAmount` (cents). **Send** → copy **`collection` `id`** from response into env as `collection_id`.  
   - **POST Create Intent** with `collectionId` + real `contactId` in body. **Send** → find the field that is the **member payment / checkout URL** and paste a redacted JSON snippet into chat or add one line to **Findings — Pass 3** in this file.

4. **Optional:** If the collection has **GET** on a single collection, open it and note any `url` / `link` fields without paying.

5. **Pass 4 — Webhooks**  
   If the collection has example webhooks, save a redacted sample.  
   - Otherwise email **Kyle** or **support@bankingcrowded.com** for: signature header name + verification steps + sample `payment.completed` (or equivalent) JSON.

6. **Local env (no commit)**  
   Add to **`.env.local`** (values stay private):  
   - `CROWDED_API_BASE_URL=https://sandbox-api.crowdedfinance.com`  
   - `CROWDED_API_TOKEN=<your sandbox JWT>`  
   When you want the CLI test to match Postman, ask Cursor (Agent) to update `scripts/test-crowded-api.ts` to use **Bearer** + this base URL.

7. **Linear**  
   Continue **TRA-409** (client + env) using this doc as the source of truth for base URL and auth style.

---

## Screenshots that help Cursor (optional)

Share these in chat **with tokens blurred** or crop so secrets are not visible:

| # | What to capture | Why |
|---|-----------------|-----|
| 1 | **Chapters → Get all** — full response body (200) | Fill Pass 1 mapping + confirm field names. |
| 2 | **Accounts** — first successful list (or doc example) | Pass 2 + `crowded_accounts` shape. |
| 3 | **Collect** — request body + 200 response (redact PII) | Pass 3 + dues integration. |
| 4 | Environment editor showing **variable names only** (`base_url`, `api_token`) — values hidden | Confirms naming for code/env docs. |
| 5 | Any **401/403** with wrong base or auth | Debugging if regression. |

---

*(Append new rows to **Session log** and tables after each pass.)*
