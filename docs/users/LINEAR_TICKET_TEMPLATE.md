# Linear Ticket Template

Use this structure when creating issues in Linear—for Cursor agents, OpenClaw, or humans. Clear tickets ship faster.

---

## Required Fields

| Field               | Format                                    | Example                                                                |
|---------------------|-------------------------------------------|------------------------------------------------------------------------|
| **Title**           | Verb + what + where (if relevant)         | Add "End event" button to event detail modal                           |
| **Description**     | 1–3 sentences: what, why, constraints     | Enable chapter admins to finalize attendance when an event ends. Button appears only for admins. |
| **Acceptance criteria** | Bullet list of done conditions         | • Button visible for admins only<br/>• Click marks event finalized, disables check-in<br/>• API rejects check-in after finalize |

## Optional Fields

| Field                    | Format / Guidance                               | Example / Tip                                         |
|--------------------------|------------------------------------------------|-------------------------------------------------------|
| **Steps to reproduce**   | Short ordered or bulleted list                 | 1. Visit event page<br/>2. Log in as admin<br/>3. Observe button visibility |
| **Files relating**       | List relevant file paths or components         | `components/features/events/EventDetailModal.tsx`, `app/api/events/[id]/end/route.ts` |
| **Screenshots**          | Attach images that illustrate current or desired state | Drag & drop images, or paste Clipboard screenshots     |

---

## Template (copy into Linear, replace bracketed text)

```
**Title:** [Verb + what + where (if relevant)]
**Description:** [1–3 sentences: what, why, constraints]

**Acceptance criteria:**
- [ ] [Acceptance criterion 1]
- [ ] [Acceptance criterion 2]
- [ ] [Acceptance criterion 3]

<!-- Optional fields below -->
**Steps to reproduce:** [Numbered or bulleted list—for bugs or UX]  
**Files relating:** [`path/to/file.tsx`, `app/api/route.ts`, ...]  
**Screenshots:** [Attach below if needed]
```
 
---

## Do's and Don'ts

| Do | Don't |
|----|-------|
| One ticket = one deliverable | Multiple features in one ticket |
| Include enough context for an agent to implement | Rely on verbal or Slack context |
| Link blockers: "Blocked by TRA-123" | Leave dependencies implicit |
| Add `agent-ready` label when AC is complete | Assign to Cursor before AC is clear |

---

## Agent-Ready Checklist

Before assigning to Cursor, confirm:

- [ ] Title is specific and actionable
- [ ] Description explains what and why
- [ ] Acceptance criteria are testable
- [ ] No open questions or blockers

---

## Example: Complete Linear Ticket

```
**Title:** Update attendance QR code scan flow on mobile

**Description:** The current attendance QR code scanner does not autofocus when the page loads on mobile devices. This causes confusion for users at check-in events, requiring them to tap manually. The scan flow should autofocus the camera, display clearer instructions, and gracefully handle denied camera permissions.

**Acceptance criteria:**
- [ ] QR scanner autofocuses on mobile when page loads
- [ ] Show message if camera access is denied with a "Try Again" button
- [ ] Add tip: "Hold camera steady over event QR code"
- [ ] Maintain fallback manual code entry
- [ ] Works on iOS Safari and Android Chrome

<!-- Optional fields below -->
**Steps to reproduce:**
1. Navigate to `/dashboard/attendance` on a mobile device
2. Tap "Scan QR code"
3. Observe camera does not auto-activate

**Files relating:** 
- `components/features/events/EventAttendanceBlock.tsx`
- `app/dashboard/attendance/page.tsx`

**Screenshots:**  
[Attach image of current scan screen and desired improved screen below]
```


---

*See [LINEAR_CURSOR_WORKFLOW.md](./LINEAR_CURSOR_WORKFLOW.md) for the full workflow.*
