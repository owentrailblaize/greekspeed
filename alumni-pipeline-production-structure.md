# Alumni Pipeline Production Structure Documentation

**Commit:** `055ce6848123883132db4e914c58b3720b2863fe`  
**Branch:** Production/Main  
**Date:** [Production version as of commit]  
**File:** `app/api/alumni/route.ts`

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture & Data Flow](#architecture--data-flow)
3. [Helper Functions](#helper-functions)
4. [Main GET Handler](#main-get-handler)
5. [Query Structure](#query-structure)
6. [Pagination Strategy](#pagination-strategy)
7. [Sorting Logic](#sorting-logic)
8. [Data Transformation](#data-transformation)
9. [Filtering Mechanisms](#filtering-mechanisms)
10. [Privacy & Security](#privacy--security)
11. [Known Issues & Limitations](#known-issues--limitations)
12. [Performance Considerations](#performance-considerations)

---

## Overview

The Alumni Pipeline API route (`/api/alumni`) handles fetching, filtering, sorting, and paginating alumni records from the Supabase database. The current production implementation uses **database-level pagination** which means records are paginated at the database query level before sorting, which has implications for the sorting behavior.

### Key Characteristics

- **Total Alumni Count:** 2,119 (as shown in UI)
- **Default Page Size:** 100 records per page
- **Database:** Supabase (PostgreSQL)
- **Primary Table:** `alumni`
- **Joined Table:** `profiles` (via `user_id` foreign key)

---

## Architecture & Data Flow

### High-Level Flow

```
1. Request comes in with query parameters
   ↓
2. Initialize Supabase client & get viewer identity
   ↓
3. Build database query with filters
   ↓
4. Apply DATABASE-LEVEL pagination (.range())
   ↓
5. Execute query (returns only current page's records)
   ↓
6. Transform data (privacy checks, mutual connections)
   ↓
7. Apply client-side filtering (activityStatus, showActiveOnly)
   ↓
8. Sort the fetched records (activity + completeness)
   ↓
9. Return paginated response
```

### Critical Flow Point

⚠️ **IMPORTANT:** Pagination happens at **Step 4** (database level), while sorting happens at **Step 8** (client-side). This means:
- Only the current page's records (e.g., 24 records) are fetched
- Sorting is applied only to those 24 records
- The "best" alumni may not appear on page 1 if they weren't in the database's initial sort order

---

## Helper Functions

### 1. `getChapterId(supabase, chapterIdentifier)`

**Purpose:** Converts chapter name to UUID or validates existing UUID

**Location:** Lines 6-20

**Logic:**
```typescript
- If identifier is 36 chars with dashes → return as-is (already UUID)
- Otherwise → lookup in 'chapters' table by name
- Returns: Promise<string | null>
```

**Usage:** Used when filtering by chapter to handle both name and UUID formats

---

### 2. `calculateCompletenessScore(alumni)`

**Purpose:** Calculates a numeric score (0-100) representing profile completeness for sorting

**Location:** Lines 26-55

**Scoring Breakdown:**

| Category | Field | Points |
|----------|-------|--------|
| **Basic Info (30 pts)** | fullName | 10 |
| | chapter | 8 |
| | graduationYear | 7 |
| | avatar | 5 |
| **Professional Info (30 pts)** | jobTitle | 12 |
| | company | 10 |
| | industry | 8 |
| **Contact Info (20 pts)** | email | 10 |
| | phone | 6 |
| | location | 4 |
| **Social Info (15 pts)** | description (non-default) | 8 |
| | mutualConnectionsCount > 0 | 4 |
| | tags.length > 0 | 3 |
| **Verification (5 pts)** | verified | 3 |
| | hasProfile | 2 |

**Note:** Unlike develop branch, this version does NOT use `isValidField()` - it only checks for truthy values, not placeholder strings.

---

### 3. `getMutualConnectionsForAlumni(supabase, viewerId, alumniUserIds)`

**Purpose:** Efficiently calculates mutual connections for multiple alumni in batch

**Location:** Lines 64-201

**Process:**
1. Get viewer's accepted connections (single query)
2. Get all alumni connections in one batch query
3. Group connections by alumni user ID
4. Find intersections (mutual connections)
5. Fetch profile details for all mutual connections in one query
6. Build final map: `Map<alumniUserId, Array<{id, name, avatar}>>`

**Performance:** Uses batch queries instead of N+1 queries

**Returns:** `Promise<Map<string, Array<{ id: string; name: string; avatar: string | null }>>>`

---

### 4. `locationMatchesState(location, stateCode)`

**Purpose:** Checks if location string matches state code/name in various formats

**Location:** Lines 204-222

**Handles:**
- `"City, ST"` format
- `"City, StateName"` format
- Standalone state codes
- Standalone state names
- Case-insensitive matching

---

## Main GET Handler

### Entry Point

**Function:** `export async function GET(request: NextRequest)`

**Location:** Lines 224-1082

### Initialization Phase (Lines 225-297)

1. **Environment Check:**
   ```typescript
   - NEXT_PUBLIC_SUPABASE_URL
   - SUPABASE_SERVICE_ROLE_KEY
   - NEXT_PUBLIC_SUPABASE_ANON_KEY (for cookie auth)
   ```

2. **Supabase Client Creation:**
   - Uses service role key for admin-level access

3. **Viewer Identity Resolution:**
   - Tries Bearer token from Authorization header first
   - Falls back to cookies (SSR requests)
   - Gets viewer role for privacy checks

### Query Parameters (Lines 300-314)

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Current page number |
| `limit` | number | 100 | Records per page |
| `search` | string | '' | Multi-field search term |
| `industry` | string | '' | Industry filter |
| `chapter` | string | '' | Chapter filter (name or UUID) |
| `location` | string | '' | Exact location match |
| `graduationYear` | string | '' | Year or "older" |
| `activelyHiring` | string | '' | Boolean filter |
| `state` | string | '' | State code filter |
| `activityStatus` | string | '' | 'hot', 'warm', 'cold' |
| `showActiveOnly` | string | '' | 24hr activity filter |
| `userChapter` | string | '' | User's chapter filter |

---

## Query Structure

### Base Query (Lines 317-327)

```typescript
supabase
  .from('alumni')
  .select(`
    *,
    profile:profiles!user_id(
      avatar_url,
      last_active_at,
      last_login_at,
      role
    )
  `, { count: 'exact' })
```

**Key Points:**
- Selects all fields from `alumni` table
- Joins `profiles` table via `user_id` foreign key
- Gets activity data (`last_active_at`, `last_login_at`) from profiles
- Uses `count: 'exact'` for accurate total count

### Filtering Logic

#### Search Filter (Lines 330-338)
- Multi-term search (splits on whitespace)
- Searches across: `full_name`, `company`, `job_title`, `industry`, `chapter`
- Uses `ilike` for case-insensitive matching
- Each term must match at least one field

#### Industry Filter (Lines 340-342)
- Exact match: `query.eq('industry', industry)`
- **Note:** Does NOT use `normalizeIndustry()` helper (unlike develop branch)

#### Chapter Filtering (Lines 345-619, 620-860)

**Special Handling:** When `userChapter` or `chapter` filter is used:

1. **Dual Query Approach:**
   - Query 1: Filter by chapter name (`chapter` field)
   - Query 2: Filter by chapter UUID (`chapter_id` field)
   - Both queries run in parallel with `Promise.all()`

2. **Why Dual Queries?**
   - Handles cases where chapter might be stored as name or UUID
   - Ensures no records are missed

3. **All Other Filters Applied to Both:**
   - Search, industry, location, state, graduationYear, activelyHiring
   - Applied identically to both queries

4. **Deduplication:**
   ```typescript
   const uniqueResults = combinedResults.filter((alumni, index, self) => 
     index === self.findIndex(a => a.id === alumni.id)
   );
   ```

#### Location Filter (Lines 863-865)
- Exact match: `query.eq('location', location)`

#### State Filter (Lines 867-875)
- Broader matching (contains state code or name)
- Uses `getStateNameByCode()` helper
- Handles: `"City, ST"`, `"City, StateName"`, or standalone

#### Graduation Year Filter (Lines 877-883)
- Exact match for specific year
- Special case: `"older"` → `lte('graduation_year', 2019)`

#### Actively Hiring Filter (Lines 885-887)
- Boolean filter: `eq('is_actively_hiring', true)`

---

## Pagination Strategy

### ⚠️ CRITICAL: Database-Level Pagination

**Location:** Lines 422-427, 697-702, 890-893

**Current Implementation:**
```typescript
const from = (page - 1) * limit;
const to = from + limit - 1;

query = query.range(from, to).order('created_at', { ascending: false });
```

### How It Works

1. **Pagination Applied BEFORE Fetching:**
   - Database only returns records in the specified range
   - Example: Page 1, limit 24 → returns records 0-23
   - Example: Page 2, limit 24 → returns records 24-47

2. **Database Ordering:**
   - Orders by `created_at DESC` (newest first)
   - This is the ONLY database-level sorting

3. **Client-Side Sorting:**
   - Happens AFTER fetching
   - Only sorts the records in the current page
   - Uses activity + completeness logic

### Implications

| Aspect | Behavior | Impact |
|--------|----------|--------|
| **Data Fetched** | Only current page (24-100 records) | Limited dataset for sorting |
| **Database Sort** | `created_at DESC` only | Not sorted by relevance |
| **Client Sort** | Activity + completeness | Only affects current page |
| **Result** | Best alumni may not appear on page 1 | Incorrect global ordering |

### Total Count Calculation

**Location:** Lines 447, 718, 1067

```typescript
// For chapter queries:
const totalCount = Math.max(chapterNameResult.count || 0, chapterIdResult.count || 0);

// For main query:
total: count || 0  // From database query with count: 'exact'
```

**Note:** Total count is accurate (2,119), but only represents the total matching records, not the sorted order.

---

## Sorting Logic

### When Sorting Happens

**Location:** Lines 543-586, 787-827, 1000-1043

Sorting is applied **AFTER** pagination, meaning it only sorts the records in the current page.

### Sorting Algorithm

#### 1. Primary Sort: Activity Priority (Lines 553-566)

```typescript
const getActivityPriority = (lastActive: Date | null) => {
  if (!lastActive) return 4        // No activity - lowest priority
  if (lastActive >= oneHourAgo) return 1  // Active within 1 hour - highest
  if (lastActive >= oneDayAgo) return 2   // Active within 24 hours - medium
  return 3                              // Active but older - low priority
}
```

**Priority Levels:**
- **Priority 1:** Active within last 1 hour
- **Priority 2:** Active within last 24 hours
- **Priority 3:** Active but older than 24 hours
- **Priority 4:** No activity data

#### 2. Secondary Sort: Completeness Score (Lines 569-573)

Within the same activity priority level:
- Higher completeness score comes first
- Uses `calculateCompletenessScore()` function
- Range: 0-100 points

#### 3. Tertiary Sort: Most Recent Activity (Lines 576-578)

If both have activity data:
- More recent `lastActiveAt` comes first
- Compares timestamps: `bActive.getTime() - aActive.getTime()`

#### 4. Fallback: Alphabetical by Name (Line 585)

If all else is equal:
- `a.fullName.localeCompare(b.fullName)`

### Sorting Example

Given these alumni on the current page:

| Alumni | Activity | Completeness | Result Order |
|--------|----------|--------------|--------------|
| Alice | 30 min ago | 85 | 1st (Priority 1, high score) |
| Bob | 2 hours ago | 90 | 2nd (Priority 2, highest score) |
| Charlie | 3 days ago | 75 | 3rd (Priority 3, medium score) |
| David | No activity | 95 | 4th (Priority 4, despite high score) |

**Note:** This sorting only affects the current page. If Alice was on page 2, she wouldn't appear on page 1 even though she's the most active.

---

## Data Transformation

### Transformation Phase (Lines 467-511, 721-757, 924-968)

### Privacy Checks (Lines 469-472, 723-726, 926-929)

```typescript
const isOwner = viewerId && (viewerId === alumniUserId);
const isAdmin = viewerRole === 'admin';
const canSeeEmail = isOwner || isAdmin || (alumni.is_email_public !== false);
const canSeePhone = isOwner || isAdmin || (alumni.is_phone_public !== false);
```

**Rules:**
- Owner can always see their own email/phone
- Admins can always see email/phone
- Otherwise, respects `is_email_public` and `is_phone_public` flags
- Default: `true` (public) if flag is not explicitly `false`

### Mutual Connections (Lines 474-480, 932-937)

```typescript
const mutualConnectionsData = mutualConnectionsMap.get(alumniUserId) || [];
const mutualConnections = mutualConnectionsData.map(mc => ({
  id: mc.id,
  name: mc.name,
  avatar: mc.avatar || undefined
}));
```

**Source:** Pre-calculated in `getMutualConnectionsForAlumni()` function

### Output Structure

```typescript
{
  id: string,                    // user_id (for connections)
  alumniId: string,              // Original alumni table ID
  firstName: string,
  lastName: string,
  fullName: string,
  chapter: string,
  industry: string,              // Direct from alumni table
  graduationYear: number,
  company: string,               // Direct from alumni table
  jobTitle: string,              // Direct from alumni table
  email: string | null,          // Privacy-filtered
  phone: string | null,          // Privacy-filtered
  isEmailPublic: boolean,
  isPhonePublic: boolean,
  location: string,              // Direct from alumni table
  description: string,
  mutualConnections: Array<{id, name, avatar}>,
  mutualConnectionsCount: number,
  avatar: string | undefined,
  verified: boolean,
  isActivelyHiring: boolean,
  lastContact: string | null,
  tags: string[],
  hasProfile: boolean,
  lastActiveAt: string | null,   // From profiles table
  lastLoginAt: string | null     // From profiles table
}
```

---

## Filtering Mechanisms

### Client-Side Filters (Applied After Fetching)

#### 1. Activity Status Filter (Lines 517-540, 762-785, 974-997)

**Parameter:** `activityStatus` ('hot', 'warm', 'cold')

**Logic:**
```typescript
if (!alumni.lastActiveAt) {
  return activityStatus === 'cold'  // No activity = cold
}

const diffHours = (now - lastActiveAt) / (1000 * 60 * 60)

switch (activityStatus) {
  case 'hot': return diffHours < 1      // Active within 1 hour
  case 'warm': return diffHours >= 1 && diffHours < 24  // 1-24 hours
  case 'cold': return diffHours >= 24    // Older than 24 hours
}
```

**Note:** This filter is applied AFTER pagination, so it may reduce the number of records returned on a page.

#### 2. Show Active Only Filter (Lines 589-601, 830-842, 1046-1058)

**Parameter:** `showActiveOnly` (boolean)

**Logic:**
```typescript
const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

filteredAlumni = filteredAlumni.filter(alumni => {
  if (!alumni.lastActiveAt) return false  // Exclude no activity
  return new Date(alumni.lastActiveAt) >= oneDayAgo  // Active within 24hr
})
```

**Impact:** Further reduces the number of records on the current page.

---

## Privacy & Security

### Viewer Identity Resolution

1. **Bearer Token (Lines 250-257):**
   - Checks `Authorization: Bearer <token>` header
   - Validates token with Supabase Auth

2. **Cookie-Based (Lines 260-283):**
   - Falls back to cookies for SSR requests
   - Uses `@supabase/ssr` package
   - Read-only cookie access

3. **Role Lookup (Lines 286-293):**
   - Fetches viewer's role from `profiles` table
   - Used for admin-level access

### Privacy Rules

| Data Type | Owner | Admin | Public Default |
|-----------|-------|-------|----------------|
| Email | ✅ Always | ✅ Always | ✅ If `is_email_public !== false` |
| Phone | ✅ Always | ✅ Always | ✅ If `is_phone_public !== false` |
| Other Data | ✅ Always | ✅ Always | ✅ Always |

### Error Handling

- If viewer identity cannot be determined → continues without privacy checks (shows all data)
- Logs error but doesn't fail the request

---

## Known Issues & Limitations

### 🔴 Critical Issue #1: Pagination Before Sorting

**Problem:**
- Database pagination happens BEFORE sorting
- Only current page's records are sorted
- Best alumni may not appear on page 1

**Impact:**
- Incorrect global ordering
- Users may miss highly active/complete profiles
- Sorting is inconsistent across pages

**Example:**
- Page 1 might show: [Inactive Alumni A, Inactive Alumni B, ...]
- Page 5 might contain: [Very Active Alumni X, Very Active Alumni Y, ...]
- Even though X and Y should be on page 1

### 🟡 Issue #2: Client-Side Filtering Reduces Page Size

**Problem:**
- `activityStatus` and `showActiveOnly` filters are applied AFTER pagination
- If 24 records are fetched but 10 are filtered out, only 14 are returned
- Page size becomes inconsistent

**Impact:**
- Inconsistent user experience
- May show fewer records than expected

### 🟡 Issue #3: No Industry Normalization

**Problem:**
- Industry filter uses exact match: `query.eq('industry', industry)`
- Does NOT use `normalizeIndustry()` helper
- May miss records with slight variations (e.g., "Technology" vs "Tech")

**Impact:**
- Incomplete search results
- User frustration

### 🟡 Issue #4: Completeness Score Simplicity

**Problem:**
- Does NOT use `isValidField()` to filter placeholder values
- Only checks for truthy values
- May give points for "Not specified", "N/A", etc.

**Impact:**
- Inaccurate completeness scores
- Poor sorting quality

### 🟢 Performance Considerations

**Positive:**
- ✅ Batch mutual connections calculation (efficient)
- ✅ Parallel chapter queries with `Promise.all()`
- ✅ Single query for all alumni connections

**Concerns:**
- ⚠️ Database pagination limits data transfer (good for performance)
- ⚠️ But prevents proper global sorting (bad for UX)

---

## Performance Considerations

### Database Queries

1. **Main Query:**
   - Single query with join to `profiles`
   - Paginated at database level (efficient)
   - Uses `count: 'exact'` for accurate totals

2. **Chapter Queries (when filtering):**
   - Two parallel queries (name + UUID)
   - Both paginated separately
   - Combined and deduplicated client-side

3. **Mutual Connections:**
   - Batch calculation (efficient)
   - Single query for viewer's connections
   - Single query for all alumni connections
   - Single query for profile details

### Memory Usage

- Only current page's records in memory (24-100 records)
- Low memory footprint
- Good for scalability

### Response Time

- Fast for individual pages
- But requires multiple requests to see all sorted data
- User must paginate through to find best alumni

---

## Response Structure

### Success Response

```typescript
{
  alumni: Alumni[],  // Array of transformed alumni records
  pagination: {
    page: number,           // Current page (1-based)
    limit: number,          // Records per page
    total: number,          // Total matching records (e.g., 2,119)
    totalPages: number,     // Calculated: Math.ceil(total / limit)
    hasNextPage: boolean,   // true if page < totalPages
    hasPrevPage: boolean    // true if page > 1
  },
  message: string           // Human-readable status message
}
```

### Error Responses

#### Missing Environment Variables (Lines 230-239)
```typescript
{
  error: 'Missing environment variables',
  details: {
    hasUrl: boolean,
    hasServiceKey: boolean
  }
}
```
**Status:** 500

#### Database Error (Lines 897-904)
```typescript
{
  error: 'Database query failed',
  details: string,  // Error message
  code: string      // Supabase error code
}
```
**Status:** 500

#### General Error (Lines 1075-1081)
```typescript
{
  error: 'Internal server error',
  details: string  // Error message
}
```
**Status:** 500

---

## Comparison with Expected Behavior

### What Should Happen (Ideal)

1. ✅ Fetch ALL matching records (with high limit: 10,000)
2. ✅ Sort ALL records by activity + completeness
3. ✅ Apply client-side filters (activityStatus, showActiveOnly)
4. ✅ Paginate the sorted/filtered results
5. ✅ Return current page

### What Actually Happens (Production)

1. ⚠️ Apply database-level pagination (fetch only current page)
2. ⚠️ Fetch limited records (24-100)
3. ⚠️ Transform data
4. ⚠️ Apply client-side filters (may reduce count)
5. ⚠️ Sort only the current page's records
6. ⚠️ Return results

### Key Difference

**Ideal:** Sort → Filter → Paginate  
**Production:** Paginate → Filter → Sort (only current page)

---

## Recommendations for Fix

### Primary Fix: Fetch All Before Sorting

1. **Remove database-level pagination:**
   ```typescript
   // REMOVE: query.range(from, to)
   // ADD: query.limit(10000)  // High limit to get all records
   ```

2. **Fetch all matching records:**
   ```typescript
   const { data: alumni, error, count } = await query.limit(10000)
   ```

3. **Sort all records:**
   ```typescript
   // Sort ALL records, not just current page
   filteredAlumni.sort((a, b) => { /* sorting logic */ })
   ```

4. **Apply pagination AFTER sorting:**
   ```typescript
   const from = (page - 1) * limit;
   const to = from + limit;
   const paginatedAlumni = filteredAlumni.slice(from, to);
   ```

### Secondary Fixes

1. **Add industry normalization:**
   ```typescript
   if (industry) {
     const normalized = normalizeIndustry(industry);
     query = query.ilike('industry', `%${normalized || industry}%`);
   }
   ```

2. **Use `isValidField()` in completeness score:**
   ```typescript
   if (isValidField(alumni.fullName)) score += 10;
   // Instead of: if (alumni.fullName) score += 10;
   ```

3. **Apply filters BEFORE pagination:**
   - Move `activityStatus` and `showActiveOnly` filters before pagination
   - This ensures consistent page sizes

---

## Summary

The production alumni pipeline uses **database-level pagination** which means:
- ✅ Efficient (only fetches current page)
- ✅ Fast response times
- ❌ **Incorrect global sorting** (only sorts current page)
- ❌ Best alumni may not appear on page 1
- ❌ Inconsistent user experience

The total count (2,119) is accurate, but the ordering is not globally optimal. Users must paginate through all pages to see all alumni in the correct order, which defeats the purpose of sorting.

**Recommendation:** Switch to fetch-all-then-sort-then-paginate approach for proper global ordering while maintaining performance through efficient queries and batch operations.

---

## Appendix: Code Locations Reference

| Component | Lines | Description |
|-----------|-------|-------------|
| `getChapterId` | 6-20 | Chapter name/UUID lookup |
| `calculateCompletenessScore` | 26-55 | Profile completeness scoring |
| `getMutualConnectionsForAlumni` | 64-201 | Batch mutual connections |
| `locationMatchesState` | 204-222 | State matching helper |
| `GET handler` | 224-1082 | Main API handler |
| Base query | 317-327 | Supabase query setup |
| Search filter | 330-338 | Multi-field search |
| Chapter filtering | 345-619, 620-860 | Dual query chapter filter |
| Database pagination | 422-427, 697-702, 890-893 | ⚠️ Pagination before sorting |
| Data transformation | 467-511, 721-757, 924-968 | Privacy + mutual connections |
| Activity filtering | 517-540, 762-785, 974-997 | Client-side activity filter |
| Sorting logic | 543-586, 787-827, 1000-1043 | Activity + completeness sort |
| Show active only | 589-601, 830-842, 1046-1058 | 24hr activity filter |
| Response | 605-616, 846-857, 1062-1073 | JSON response structure |

---

**Document Version:** 1.0  
**Last Updated:** [Current Date]  
**Author:** AI Assistant  
**Review Status:** Ready for comparison with develop branch

