# Development to Sales Workflow

*This is a living document and may be updated at the discretion of stakeholders.*

## Table of Contents

- [Roles & End-to-End Flow](#roles--end-to-end-flow)
- [Ticket Lifecycle in Linear](#ticket-lifecycle-in-linear)
- [Trailblaize Space Tracking](#trailblaize-space-tracking)
- [Developer to Sales Handoff](#developer-to-sales-handoff)
- [Sales to Development Input](#sales-to-development-input)
- [Synchronization Meetings](#synchronization-meetings)
- [Our Current Systems](#our-current-systems)

---

### Roles & End-to-End Flow

**Roles**

| Role      | Responsibilities                                                                        |
|-----------|----------------------------------------------------------------------------------------|
| Developer | Implementation, Pull Requests, merges, weekly summary                                   |
| Sales (3) | Product ideas, ticket suggestions, prioritization, client feedback, feature acceptance  |

**End-to-End Flow**

```
Sales idea / client request
    → Backlog ticket (draft)
    → Triage / refinement (AC, priority)
    → Ready (agent-ready label)
    → Developer picks up (or Cursor assigned)
    → PR → merge → staging
    → Developer updates ticket
    → Sales informed (weekly summary)
    → Production release (when you merge develop → main)
```

---

### Ticket Lifecycle in Linear

*Use the [Linear Ticket Template](./LINEAR_TICKET_TEMPLATE.md) when creating issues in Linear.*

| Status      | Meaning                                                          | Owner                   |
|-------------|------------------------------------------------------------------|-------------------------|
| Backlog     | New idea, not yet defined (needs triage, priority, clarification) | Sales / Developer / Agent |
| Todo        | AC clear, dev-ready (use agent/develop if score >5)              | Sales / Developer / Agent |
| In Progress | Being implemented                                                | Developer / Agent       |
| In Review   | PR open, waiting on review                                       | Developer / Agent       |
| Done        | Reviewed & tested, merged to develop (staging)                   | Developer               |

---

### Trailblaize Space Tracking

[Trailblaize Space](https://trailblaize.space/) is the only tool the sales team uses for product work. Linear is kept for development integrations (Cursor, GitHub), and developers handle translation between the two.

**Sales: What to Do in Trailblaize Space**

1. **Add new requests (Tickets or Projects)**  
   Use **Tickets** → **+ New Ticket** or **Projects** → **+ New Project** when you have:
   - Client feature requests
   - Bug reports
   - Product ideas

2. **Use the simplified ticket format**  
   When creating a ticket, include at least:

   | Field       | What to Write                                                                                       |
   |-------------|-----------------------------------------------------------------------------------------------------|
   | Title       | [Verb] + [what] + [where if it helps] — e.g., *Add "End event" button for admins*                   |
   | Description | What, why, and source (e.g., "Client X asked for…")                                                |
   | Done when   | Short bullet list of "this is done when…" — e.g., *Button only shows for admins; Click finalizes attendance* |

   This maps to the Linear ticket template that the developer uses for implementation.

3. **View progress (Roadmap)**  
   Use the Roadmap view for:
   - Sprint-level status
   - What's in progress vs upcoming
   - What the developer updates each week

4. **Place tickets on the Roadmap**  
   When adding tickets, assign them to a sprint or project so the developer can translate and prioritize them into Linear.

**Developers: What to Do**

1. **Weekly Roadmap updates**  
   Each week, update the Roadmap in Trailblaize with:
   - Completed work (moved to Done)
   - In-progress work
   - Blockers and needs input
   - Planned work for next week  
   *This is the main place sales checks progress.*

2. **Translate Trailblaize → Linear**  
   When triaging:
   - Read new Trailblaize tickets (especially in Backlog / Todo)
   - Create corresponding Linear tickets using the [Linear Ticket Template](./LINEAR_TICKET_TEMPLATE.md)
   - Expand "Done when" into full acceptance criteria
   - Add technical details (e.g., files, repro steps) as needed  
   If you use sync, link the Trailblaize ticket to the Linear one (e.g., TRA-xxx).

3. **Keep status in sync**  
   As work moves in Linear (In Progress, In Review, Done), update the matching Trailblaize ticket and Roadmap so sales always sees current status.

**Ticket Template for Sales (Cheat Sheet)**

```
Title: [Verb] + [what] + [where if relevant]
Example: Add "End event" button to event detail for admins

Description: [What + why + source]
Example: Chapter admins need to finalize attendance when an event ends. Client Alpha requested this. Button should only show for admins.

Done when:
- Button is visible for admins only
- Click marks event finalized and disables check-in
- (Add 1–3 bullets of what "done" looks like)
```

---

### Developer to Sales Handoff

**Weekly summaries will be emailed to all product stakeholders.**

Use a weekly dev update (every Friday or Monday) with the following sections:

| Section             | Description                                                      |
|---------------------|------------------------------------------------------------------|
| Completed this week | Merged PRs, resolved tickets, shipped to staging/production      |
| In progress         | Current open PRs and ongoing ticket work                         |
| Next week           | Planned work items and anticipated developer capacity            |
| Needs input         | Blockers, decision points, items needing stakeholder feedback    |
| Staging URL         | [greekspeed.vercel.app](https://greekspeed.vercel.app) for demos |

**Posted In**

- Linear Doc
- Email to Sales
- Text to Trailblaize Dev Group

---

### Sales to Development Input

| Input type         | Flow                                                                   | Where                 |
|--------------------|------------------------------------------------------------------------|-----------------------|
| Feature request    | Create ticket in Trailblaize Backlog → optional sync call to clarify   | Trailblaize Space     |
| Bug report         | Create ticket with steps, label as Bug                                | Trailblaize Space     |
| Prioritization     | Use priority + backlog order; optional bi-weekly triage               | Trailblaize Space     |
| Urgent client need | High priority ticket + short message (Slack/email)                    | Trailblaize + SMS/email |

---

### Synchronization Meetings

| Meeting         | Cadence   | Duration  | Purpose                                                |
|-----------------|-----------|-----------|--------------------------------------------------------|
| Backlog triage  | Bi-weekly | 15–30 min | Refine new tickets, set priority, add AC               |
| Dev sync        | Weekly    | 15 min    | Walk through weekly summary; sales ask questions       |
| Release planning| Monthly   | 1 hr      | Pick what to promote to production                     |

---

### Our Current Systems

| System              | How it's used                                                                                    |
|---------------------|--------------------------------------------------------------------------------------------------|
| **Trailblaize Space** | Sales-only input; tickets, projects, roadmap; developer updates weekly progress, blockers, status |
| **Linear**          | Developer backlog; status, priorities, AC; PR links; Cursor/agent integration                    |
| **GitHub**          | PRs, branch strategy, CI (unchanged)                                                             |
| **Cursor / OpenClaw** | Implements "Ready" tickets when using AI; same workflow as today                               |
| **Email**           | Weekly summary to sales; optional auto-summary from OpenClaw                                     |

*End of document*