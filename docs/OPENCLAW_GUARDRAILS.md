# OpenClaw Guardrails & Workflow - Trailblaize

## Overview
This document defines the strict guardrails, workflow, and standards that OpenClaw must follow when working on the Trailblaize codebase. These rules are **non-negotiable** and must be enforced in all automation and manual work.

## Critical Rules - NEVER VIOLATE

### ❌ NEVER DO THESE
- **NEVER push directly to `main` branch**
- **NEVER push directly to `develop` branch**
- **NEVER commit directly to protected branches**
- **NEVER skip PR review process**
- **NEVER merge your own PRs without approval**
- **NEVER skip testing/verification steps**

### ✅ ALWAYS DO THESE
- **ALWAYS create a feature branch from `develop`**
- **ALWAYS open PR to `develop` (never to `main`)**
- **ALWAYS commit throughout the ticket process (not just at the end)**
- **ALWAYS include Linear ticket ID in commits and PR**
- **ALWAYS send email summary for automated tasks**
- **ALWAYS wait for PR review/approval before merging**

## Branch Workflow

### Branch Strategy

**Base Branch:** `develop` (always)
- All feature branches must branch FROM `develop`
- All PRs must target `develop` (never `main`)
- `main` is only for production releases (handled manually by humans)

**Branch Naming Convention:**
```
agent/[linear-ticket-id]-[short-description]
```

**Examples:**
- `agent/TRA-123-add-user-profile-editing`
- `agent/TRA-456-fix-payment-webhook`
- `agent/TRA-789-update-alumni-directory`

**Rules:**
- Use lowercase
- Use hyphens for word separation
- Include Linear ticket ID (e.g., `TRA-123`)
- Keep description short but descriptive (max 50 chars)
- No special characters except hyphens

### Branch Lifecycle

1. **Create Branch:**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b agent/TRA-123-short-description
   ```

2. **Work on Branch:**
   - Make commits throughout the ticket process
   - Push commits to the branch regularly
   - Keep branch up to date with `develop` if needed

3. **Create PR:**
   - PR must target `develop` branch
   - PR title must include Linear ticket ID
   - PR must include testing notes

4. **After PR Merge:**
   - Branch can be deleted (usually auto-deleted by GitHub)
   - Changes will auto-deploy to staging (`greekspeed.vercel.app`)

## Commit Standards

### Commit Message Format

Use **Conventional Commits** format with Linear ticket ID:

```
<type>(<scope>): <subject> [TRA-XXX]

<body>

<footer>
```

### Commit Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements

### Commit Examples

**Good:**
```
feat(profile): add avatar upload functionality [TRA-123]

- Implemented image upload component
- Added Supabase storage integration
- Added error handling for file size limits

Closes TRA-123
```

```
fix(payments): resolve webhook signature validation [TRA-456]

Fixed issue where webhook signatures were not being validated
correctly, causing payment status updates to fail.

Fixes TRA-456
```

**Bad:**
```
update code
```
```
fixed bug
```
```
changes
```

### Commit Frequency

- **Commit early and often** - Don't wait until the end
- Commit logical units of work
- Commit when a feature is partially complete but working
- Commit when fixing a bug
- Commit when refactoring
- Aim for 3-10 commits per ticket (depending on complexity)

### Commit Rules

- Every commit must include Linear ticket ID: `[TRA-XXX]`
- Use present tense: "add feature" not "added feature"
- Keep subject line under 72 characters
- Include body for complex changes
- Reference Linear ticket in footer

## Pull Request Standards

### PR Title Format

```
<type>: <description> [TRA-XXX]
```

**Examples:**
- `feat: Add user profile editing [TRA-123]`
- `fix: Resolve payment webhook validation [TRA-456]`
- `refactor: Improve alumni directory performance [TRA-789]`

### PR Description Template

Every PR must include:

```markdown
## Description
[Brief description of what this PR does]

**Linear Ticket:** [TRA-XXX](link-to-linear-ticket)

## Changes Made
- [Change 1]
- [Change 2]
- [Change 3]

## Testing Notes
- [ ] Tested locally
- [ ] Tested on staging (greekspeed.vercel.app)
- [ ] Tested with [user roles tested]
- [ ] Verified no console errors
- [ ] Checked mobile responsiveness

### Test Accounts Used
- Standard Member: [email]
- Chapter President: [email]
- Admin: [email]

### Features Tested
- [Feature 1] - Works as expected
- [Feature 2] - Works as expected

## Screenshots (if UI changes)
[Add screenshots if applicable]

## Checklist
- [ ] Code follows project conventions
- [ ] TypeScript types are correct
- [ ] No linting errors
- [ ] Build passes (`npm run build`)
- [ ] Type check passes (`npm run typecheck`)
- [ ] Documentation updated (if needed)
- [ ] Linear ticket updated with PR link
```

### PR Requirements

1. **Target Branch:** Always `develop` (never `main`)
2. **Base Branch:** Must be up to date with `develop`
3. **CI Checks:** Must pass all GitHub Actions checks
4. **Review:** Must wait for human approval
5. **Labels:** Add appropriate labels (if available)
6. **Linear Link:** Must link to Linear ticket

### PR Labels (if available)

- `enhancement` - New features
- `bug` - Bug fixes
- `documentation` - Docs changes
- `refactor` - Code refactoring
- `agent-work` - Work done by OpenClaw
- `needs-review` - Ready for review
- `blocked` - Blocked on something

### PR Review Process

1. **Create PR** → Auto-triggers CI checks
2. **Wait for CI** → Type check and lint must pass
3. **Request Review** → Assign reviewers (if applicable)
4. **Wait for Approval** → Do NOT merge without approval
5. **Address Feedback** → Make changes if requested
6. **Merge** → Only after approval (usually by human)

## Email Summary Requirements

### When to Send Email Summary

Send email summary for:
- ✅ Automated tasks completed
- ✅ Multiple tickets completed in a session
- ✅ Significant changes or deployments
- ✅ Production deployments (if applicable)

Do NOT send for:
- ❌ Single small commits
- ❌ Work-in-progress updates
- ❌ Every single commit

### Email Summary Template

**Subject:** `[Trailblaize] OpenClaw Work Summary - [Date]`

**Body:**
```
Hello,

This is an automated summary of work completed by OpenClaw on [Date].

## Completed Tickets
- [TRA-XXX] - [Ticket Title]
  - PR: [PR Link]
  - Status: Merged/In Review
  - Summary: [Brief description]

## Work Summary
[Overall summary of what was accomplished]

## Deployments
- Staging: [URL] (auto-deployed from develop)
- Production: [URL] (if applicable)

## Next Steps
[Any follow-up items or blockers]

---
Generated by OpenClaw
```

### Email Recipients

- [To be configured - provide email addresses]
- Include project stakeholders
- Include development team

## Automation & Guardrails Setup

### GitHub Branch Protection Rules

**For `main` branch:**
- ✅ Require pull request reviews
- ✅ Require status checks to pass
- ✅ Require branches to be up to date
- ✅ Require linear history
- ✅ Restrict pushes (no direct pushes)
- ✅ Restrict who can push (admins only)

**For `develop` branch:**
- ✅ Require pull request reviews
- ✅ Require status checks to pass
- ✅ Require branches to be up to date
- ✅ Restrict pushes (no direct pushes)
- ✅ Allow force pushes (disabled)
- ✅ Allow deletions (disabled)

### GitHub Actions Checks

Required checks that must pass:
- ✅ Type check (`npm run typecheck`)
- ✅ Lint check (`npm run lint`)
- ✅ Build check (`npm run build`)

### CODEOWNERS File

Create `.github/CODEOWNERS` to enforce reviews:
```
# All code requires review
* @[team-github-handle]

# Critical files require specific reviewers
/.github/workflows/ @[admin-handle]
/package.json @[admin-handle]
/next.config.ts @[admin-handle]
```

## Workflow Summary

### Complete Workflow for OpenClaw

1. **Receive Linear Ticket**
   - Read ticket requirements
   - Understand acceptance criteria

2. **Start Work**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b agent/TRA-XXX-short-description
   ```

3. **Implement Changes**
   - Make changes
   - Commit frequently with proper messages
   - Push to branch regularly

4. **Test Changes**
   - Test locally
   - Test on staging (if applicable)
   - Verify all checks pass

5. **Create PR**
   - Push final changes
   - Create PR targeting `develop`
   - Fill out PR template completely
   - Link Linear ticket
   - Request review

6. **Wait for Review**
   - Do NOT merge without approval
   - Address any feedback
   - Update PR if needed

7. **After Merge**
   - Update Linear ticket status
   - Send email summary (if applicable)
   - Clean up branch (if not auto-deleted)

## Production Deployment

### Important: OpenClaw Does NOT Deploy to Production

- **OpenClaw only works on `develop` branch**
- **Production deployments are manual and handled by humans**
- **Production workflow:**
  1. Human reviews `develop` branch
  2. Human merges `develop` → `main` when ready
  3. `main` branch auto-deploys to production
  4. OpenClaw does NOT touch `main` branch

## Error Handling

### If You Make a Mistake

**If you accidentally push to `develop`:**
1. Immediately notify the team
2. Do NOT try to fix it yourself
3. Wait for human intervention

**If you accidentally push to `main`:**
1. Immediately notify the team
2. This is critical - alert immediately
3. Do NOT try to fix it yourself

**If CI checks fail:**
1. Review the error messages
2. Fix the issues locally
3. Push fixes to your branch
4. Wait for CI to pass before requesting review

## Quick Reference

### Branch Commands
```bash
# Start new work
git checkout develop
git pull origin develop
git checkout -b agent/TRA-XXX-description

# Commit work
git add .
git commit -m "feat(scope): description [TRA-XXX]"
git push origin agent/TRA-XXX-description

# Update branch with latest develop
git checkout agent/TRA-XXX-description
git merge develop
# Resolve conflicts if any
git push origin agent/TRA-XXX-description
```

### PR Checklist
- [ ] Branch name follows convention: `agent/TRA-XXX-description`
- [ ] Branch is up to date with `develop`
- [ ] All commits include `[TRA-XXX]`
- [ ] PR title includes ticket ID
- [ ] PR description is complete
- [ ] Testing notes included
- [ ] CI checks passing
- [ ] Linear ticket linked
- [ ] Ready for review

### Commit Checklist
- [ ] Follows Conventional Commits format
- [ ] Includes Linear ticket ID: `[TRA-XXX]`
- [ ] Subject line under 72 characters
- [ ] Body explains what and why (if complex)
- [ ] Footer references Linear ticket

## Questions & Support

If you're unsure about any workflow:
1. **Check this document first**
2. **Review similar PRs in the repo**
3. **Ask for clarification before proceeding**
4. **When in doubt, create a branch and PR (never push directly)**

## Enforcement

These guardrails are enforced by:
- ✅ GitHub branch protection rules
- ✅ GitHub Actions CI checks
- ✅ CODEOWNERS file (if configured)
- ✅ Automated monitoring (if configured)
- ✅ Code review process

**Violations will be caught and prevented by automation where possible.**

---

**Last Updated:** [Date]
**Version:** 1.0
**For:** OpenClaw AI Agent
