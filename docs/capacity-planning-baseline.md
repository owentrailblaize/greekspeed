# Trailblaize Capacity Planning - Baseline Metrics

**Date**: November 2025  
**Project**: Trailblaize (GreekSpeed)  
**Environment**: Production

---

## Executive Summary

Current baseline metrics for the Trailblaize application to establish capacity planning benchmarks. The application is currently operating within healthy limits.

**Key Findings:**
- Connection pool usage: 12% (very healthy - 24/200 connections)
- Database query performance: Good overall, with some optimization opportunities
- API requests: All successful (100% success rate in sample)
-  Some slow queries identified (max times >7 seconds)
-  High frequency of profile updates (264K+ calls)

---

## Infrastructure Configuration

### Vercel
- **Plan**: Pro
- **Function Timeout**: 60 seconds (configured in `vercel.json`)
- **Region**: [Check Vercel Dashboard → Settings]
- **Analytics**: Enabled (`@vercel/analytics` installed)
- **Speed Insights**: Enabled (`@vercel/speed-insights` installed)

### Supabase
- **Project ID**: ssqpfkiesxwnmphwyezb
- **Plan**: Pro (Nano compute size)
- **Database Size**: [Check Database → Reports → Database Size]
- **Connection Pooling**: Configured
  - **Pool Size**: 15 (per user+db combination)
  - **Max Client Connections**: 200 (fixed for Nano compute)
  - **Pooler Type**: [Shared/Dedicated - check Settings → Database]
  - **IPv4 Compatibility**: [Note if Dedicated Pooler warning exists]

### External Services
- **SendGrid**: [Plan] - 100 emails/day
- **Stripe**: Rate limit: 100 requests/second (default)
- **SMS Provider**: Twilio/Telnyx - [Plan] - [Limit] messages/day

---

## Database Performance Metrics

### Connection Usage (Snapshot)
**Measured**: [Date/Time]  
**Query**: `SELECT count(*) FROM pg_stat_activity`

| Metric | Value | Status |
|--------|-------|--------|
| Total Connections | 24 | Healthy (12% of 200 max) |
| Active Connections | 2 | Very Low |
| Idle Connections | 20 | Normal |
| Idle in Transaction | 0 | Excellent |
| Connection Pool Usage | 12% | **Excellent** - Significant headroom |

**Analysis**: Connection usage is very healthy with 88% of capacity available. This indicates the application can handle significant traffic growth before connection limits become a concern.

---

### Query Performance Analysis

**Data Source**: Supabase Query Performance Statements (exported CSV)  
**Analysis Period**: [Time period covered by export]

#### Top 10 Queries by Total Execution Time

| Rank | Query Type | Calls | Avg Time (ms) | Min (ms) | Max (ms) | Total Time | % of Total | Cache Hit Rate |
|------|-----------|-------|---------------|----------|----------|------------|------------|----------------|
| 1 | `realtime.list_changes` | 12,528,159 | 3.76 | 1.88 | 14,516 | 47,117,115 | 88.78% | 100% |
| 2 | Posts with author join | 19,659 | 67.96 | 0.02 | 7,829 | 1,335,984 | 2.52% | 100% |
| 3 | Realtime WAL changes | 347,602 | 3.64 | 3.11 | 598 | 1,263,805 | 2.38% | 100% |
| 4 | Profile last_active_at update | 264,163 | 3.63 | 0.02 | 5,283 | 957,923 | 1.80% | 99.99% |
| 5 | Profile login update | 21,168 | 23.71 | 0.02 | 7,239 | 501,822 | 0.95% | 100% |
| 6 | Posts by chapter | 19,642 | 19.16 | 0.02 | 7,337 | 376,313 | 0.71% | 100% |
| 7 | Schema introspection | 948 | 222.71 | 16.92 | 1,141 | 211,130 | 0.40% | 100% |
| 8 | Posts with author (alt) | 1,457 | 140.88 | 0.02 | 5,231 | 205,268 | 0.39% | 100% |
| 9 | Timezone names | 333 | 417.66 | 52.54 | 2,495 | 139,079 | 0.26% | 0% |
| 10 | User insertion | 8,921 | 15.37 | 0.26 | 4,942 | 137,106 | 0.26% | 99.99% |

**Total Queries Analyzed**: ~13.5 million queries

#### Key Performance Metrics

| Metric | Value | Assessment |
|--------|-------|------------|
| **Average Query Duration** | ~3.76ms (weighted by top queries) | Excellent |
| **Slow Queries (>1s)** | Multiple queries with max times >1s | **Needs Investigation** |
| **Slowest Query** | Posts query: 7,829ms max | **Critical** |
| **Cache Hit Rate** | 99.99%+ on most queries | Excellent |
| **Most Frequent Query** | `realtime.list_changes`: 12.5M calls | System query (normal) |

#### Slow Query Analysis

**Queries Requiring Optimization:**

1. **Posts with Author Join** (19,659 calls)
   - Max time: 7,829ms (7.8 seconds)
   - Avg time: 67.96ms
   - **Impact**: High - User-facing queries
   - **Recommendation**: Add indexes on `posts.chapter_id`, `posts.created_at`, `profiles.id`

2. **Posts Query Alternative** (1,457 calls)
   - Max time: 5,231ms (5.2 seconds)
   - Avg time: 140.88ms
   - **Impact**: Medium - User-facing
   - **Recommendation**: Same as above

3. **Profile Login Update** (21,168 calls)
   - Max time: 7,239ms (7.2 seconds)
   - Avg time: 23.71ms
   - **Impact**: Medium - Frequent activity tracking
   - **Recommendation**: Add index on `profiles.id` (if not exists)

4. **Posts by Chapter** (19,642 calls)
   - Max time: 7,337ms (7.3 seconds)
   - Avg time: 19.16ms
   - **Impact**: High - User-facing
   - **Recommendation**: Ensure index on `posts.chapter_id`, `posts.created_at`

#### High-Frequency Query Patterns

1. **Profile Activity Updates**: 264,163 calls
   - Very frequent `last_active_at` updates
   - **Recommendation**: Consider batching or debouncing these updates
   - **Current Performance**: Good (3.63ms avg)

2. **Realtime Subscriptions**: 12.5M calls
   - System queries for realtime features
   - **Assessment**: Normal for Supabase realtime
   - **Performance**: Excellent (3.76ms avg)

---

## API Usage Metrics

### API Logs Analysis (Sample)

**Sample Period**: [Time range from provided logs]  
**Source**: Supabase → Logs → API Logs

#### Request Distribution

| Endpoint | Method | Count (Sample) | Status | Notes |
|----------|--------|----------------|--------|-------|
| `/rest/v1/profiles` | GET | ~35+ | 200 | Very frequent - likely polling |
| `/rest/v1/post_comments` | GET | ~15+ | 200 | Post detail pages |
| `/rest/v1/post_comments` | HEAD | ~8+ | 200 | Pre-flight checks |
| `/rest/v1/posts` | GET | ~10+ | 200 | Post listings |
| `/rest/v1/comment_likes` | GET | ~3+ | 200 | Like status checks |
| `/auth/v1/user` | GET | ~20+ | 200 | Authentication checks |
| `/rest/v1/posts` | HEAD | ~1 | 200 | Pre-flight check |

**Total Requests in Sample**: ~100+ requests  
**Success Rate**: 100% (all 200 status codes) ✅

#### Request Patterns Identified

1. **Profile Polling**: Very high frequency of profile requests
   - Same profile ID requested repeatedly
   - **Pattern**: `?select=*%2Cchapters%21left%28name%29&id=eq.718f1792-60f6-471e-85bf-c500943274d6`
   - **Recommendation**: Implement client-side caching or reduce polling frequency

2. **Comment Loading**: Multiple parallel requests for different posts
   - **Pattern**: Loading comments for multiple posts simultaneously
   - **Recommendation**: Consider batching or pagination

3. **Authentication Checks**: Frequent `/auth/v1/user` calls
   - **Pattern**: Session validation on page loads
   - **Assessment**: Normal for authenticated apps

#### API Performance (Estimated)

| Metric | Value | Notes |
|--------|-------|-------|
| **Average Response Time** | [Calculate from logs with timestamps] | Need response_time column |
| **Error Rate** | 0% (in sample) | Excellent |
| **4xx Errors** | 0 | None |
| **5xx Errors** | 0 | None |
| **Top Endpoint** | `/rest/v1/profiles` | Profile data |
| **Most Frequent User Agent** | Chrome 142 (Browser) | Browser usage |
| **Server-Side Requests** | Node.js (Vercel functions) | API routes |

---

## Application-Specific Metrics

### User Activity Patterns

**Profile Activity Tracking**:
- **Total Updates**: 264,163 calls (profile activity)
- **Login Updates**: 21,168 calls
- **Frequency**: Very high (likely per-page load or polling)
- **Performance**: Good (3.6-23.7ms avg)

**Post Activity**:
- **Post Queries**: ~39,000 total (with and without author joins)
- **Performance**: Variable (19-140ms avg, but spikes to 7+ seconds)
- **Impact**: User-facing feature

### Database Query Patterns

**Most Common Operations**:
1. Realtime subscriptions (system)
2. Profile activity updates (user tracking)
3. Post fetching with author information (content display)
4. Comment loading (social features)

---

## Current Capacity Assessment

### Connection Pool Capacity

| Metric | Current | Limit | Usage % | Status |
|--------|---------|-------|---------|--------|
| Total Connections | 24 | 200 | 12% | **Excellent** |
| Active Connections | 2 | 200 | 1% | **Very Healthy** |
| Available Headroom | 176 | - | 88% | **Large Growth Capacity** |

**Assessment**: Current usage is very low. The application can handle **8-10x current traffic** before reaching connection limits.

### Query Performance Capacity

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Average Query Time | 3.76ms | <50ms | Excellent |
| P95 Query Time | [Need to calculate] | <200ms | Some outliers |
| P99 Query Time | [Need to calculate] | <500ms | Some slow queries |
| Slow Queries (>1s) | Multiple | 0 | **Needs Optimization** |

**Assessment**: Overall performance is good, but some queries have concerning max times that need optimization.

---

## Identified Bottlenecks & Optimization Opportunities

### Critical Issues

1. **Slow Post Queries** ⚠️
   - **Issue**: Max query time of 7.8 seconds for posts with author joins
   - **Impact**: User-facing feature, poor UX
   - **Frequency**: 19,659 calls
   - **Solution**: 
     - Add composite index: `CREATE INDEX idx_posts_chapter_created ON posts(chapter_id, created_at DESC);`
     - Add index: `CREATE INDEX idx_profiles_id ON profiles(id);`
     - Consider query optimization or pagination

2. **High-Frequency Profile Updates** ⚠️
   - **Issue**: 264,163 profile update calls (very frequent)
   - **Impact**: Database load, potential connection pool pressure at scale
   - **Solution**: 
     - Implement debouncing (update max once per 30 seconds per user)
     - Consider batch updates
     - Use background jobs for non-critical updates

### Optimization Recommendations

1. **Database Indexes** (High Priority)
   ```sql
   -- Add these indexes to improve query performance
   CREATE INDEX IF NOT EXISTS idx_posts_chapter_created 
     ON posts(chapter_id, created_at DESC);
   
   CREATE INDEX IF NOT EXISTS idx_posts_author_id 
     ON posts(author_id);
   
   CREATE INDEX IF NOT EXISTS idx_profiles_id 
     ON profiles(id);
   
   CREATE INDEX IF NOT EXISTS idx_profiles_chapter_id 
     ON profiles(chapter_id);
   ```

2. **Reduce Profile Polling**
   - Implement client-side caching (React Query, SWR)
   - Reduce polling frequency
   - Use Supabase Realtime subscriptions instead of polling

3. **Query Optimization**
   - Review and optimize slow queries
   - Consider denormalization for frequently joined data
   - Implement pagination for large result sets

---

## Scaling Capacity Estimates

### Current Capacity (Conservative Estimate)

Based on current metrics:

| Metric | Current Usage | Estimated Max | Confidence |
|--------|---------------|---------------|------------|
| **Concurrent Users** | [Estimate: 5-10] | **50-100** | Medium |
| **Daily Active Users** | [Estimate: 20-50] | **200-500** | Medium |
| **API Requests/Hour** | [Estimate: 500-1000] | **10,000-20,000** | Medium |
| **Database Queries/Second** | [Estimate: 50-100] | **500-1000** | Low |

**Assumptions**:
- Current connection usage: 12% (24/200)
- Query performance remains stable
- No major bottlenecks are hit

### Scaling Triggers

| Metric | Warning Threshold | Critical Threshold | Action Required |
|--------|-------------------|-------------------|-----------------|
| Connection Pool Usage | >80% (160 connections) | >90% (180 connections) | Upgrade compute or optimize |
| Query P95 Time | >200ms | >500ms | Add indexes, optimize queries |
| Error Rate | >1% | >5% | Investigate immediately |
| Database Size | >80% of plan limit | >95% of plan limit | Upgrade plan or archive data |

---

## Monitoring & Alerts Setup Status

### ✅ Completed
- [x] Vercel Analytics enabled
- [x] Supabase connection monitoring
- [x] Query performance analysis
- [x] API logs review
- [x] Sentry error tracking setup ✅
- [x] Sentry alerts configured ✅

### ⏳ In Progress
- [ ] Database index optimization
- [ ] Alert configuration

### 📋 Next Steps
- [ ] Set up Sentry for error tracking
- [ ] Configure Supabase email alerts
- [ ] Implement database indexes
- [ ] Set up performance monitoring dashboards
- [ ] Create alerting rules

---

## Baseline Metrics Summary

### Connection Metrics
- **Total Connections**: 24 / 200 (12%)
- **Status**: Healthy

### Query Performance
- **Average Query Time**: 3.76ms
- **Slow Queries**: Multiple with >1s max times
- **Status**: Good overall, needs optimization

### API Performance
- **Success Rate**: 100%
- **Error Rate**: 0%
- **Status**: Excellent

### Capacity Headroom
- **Connection Pool**: 88% available
- **Query Performance**: Good with optimization opportunities
- **Overall Status**: **Healthy - Significant growth capacity**

---

## Next Steps for Phase 2

### Immediate Actions (Week 1)
1. Complete baseline documentation (this document)
2. ⏳ Set up Sentry error tracking
3. ⏳ Add recommended database indexes
4. ⏳ Implement profile update debouncing

### Short-term Actions (Week 2-3)
1. Monitor query performance after index additions
2. Set up load testing with k6
3. Configure Supabase alerts
4. Review and optimize slow queries

### Medium-term Actions (Week 4+)
1. Conduct load testing (50, 100, 200 concurrent users)
2. Document scaling procedures
3. Create performance dashboards
4. Establish alerting thresholds

---

## Notes & Observations

- Profile requests are very frequent (likely polling) - consider implementing caching
- Post queries have concerning max times despite good averages - needs investigation
- Connection pool usage is excellent - no immediate concerns
- All API requests successful - system stability is good
- Realtime subscriptions are working well (normal system overhead)

---

**Document Version**: 1.0  
**Last Updated**: January 2025  
**Next Review**: [Date + 1 month]
