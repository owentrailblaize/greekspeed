# Development Workflow Guide

## Repository Structure

### greekspeed (Development Repo)
- **Location**: `owentrailblaize/greekspeed`
- **Purpose**: Primary development repository
- **Local Path**: `C:\Users\dmaso\...\greekspeed`
- **Branches**: `main`, `develop`

### trailblaize-web-app (Organization Repo)
- **Location**: `Trailblaizedevelopment/trailblaize-web-app`
- **Purpose**: Organization repository, Cursor-Linear integration
- **Local Path**: `C:\Users\dmaso\...\trailblaize-web-app`
- **Branches**: `main`, `develop` (synced from greekspeed)

## Sync Mechanism

### Automatic Sync (greekspeed → trailblaize-web-app)
- **Trigger**: Push to `main` or `develop` in greekspeed
- **Action**: GitHub Actions automatically syncs to trailblaize-web-app
- **Direction**: One-way (greekspeed → trailblaize-web-app)
- **Note**: `.github/workflows` are excluded from sync

### Manual Sync (trailblaize-web-app → greekspeed)
- **When**: After Cursor agent completes work in trailblaize-web-app
- **Process**: See "Syncing Agent Changes Back" section

## Development Workflows

### Standard Development (Manual)
1. Work in `greekspeed` repository
2. Create feature branch: `git checkout -b feature/name`
3. Make changes and commit
4. Push to greekspeed: `git push origin feature/name`
5. Create PR in greekspeed
6. After merge, changes auto-sync to trailblaize-web-app

### AI Agent Development (Cursor-Linear)
1. Open `trailblaize-web-app` directory in Cursor
2. Connect Linear ticket to Cursor agent
3. Agent works directly in trailblaize-web-app
4. Agent commits to trailblaize-web-app
5. **IMPORTANT**: Sync changes back to greekspeed (see below)

## Syncing Agent Changes Back to greekspeed

After Cursor agent completes work in trailblaize-web-app, you need to sync changes back to greekspeed to maintain consistency.

### Option 1: Git Patch Method (Recommended)

This method preserves commit history and is cleaner for tracking changes.

#### Step 1: In trailblaize-web-app - Identify and Export Changes

```powershell
# Navigate to trailblaize-web-app directory
cd C:\Users\dmaso\OneDrive\Documents\002 Projects\003 Web Development Agency\01_Clients\01_Greekrow_Trailblaze\03_Development\trailblaize-web-app

# Fetch latest changes from remote
git fetch origin

# Check which branch the agent worked on (usually a feature branch or main/develop)
git branch -a  # List all branches

# Checkout the branch with agent changes (e.g., cursor/TRA-430-...)
git checkout cursor/TRA-430-comment-link-previews-10c2
# OR if agent worked on main/develop:
git checkout main
git pull origin main

# Identify what changed (compare to base branch, usually develop)
git diff origin/develop > agent-changes.patch

# OR if you want to see the commit history:
git log origin/develop..HEAD --oneline
```

#### Step 2: Apply Changes to greekspeed

```powershell
# Navigate to greekspeed directory
cd C:\Users\dmaso\OneDrive\Documents\002 Projects\003 Web Development Agency\01_Clients\01_Greekrow_Trailblaze\03_Development\greekspeed

# Ensure you're on the correct branch (usually develop)
git checkout develop
git pull origin develop

# Apply the patch from trailblaize-web-app
# Copy the patch file from trailblaize-web-app or use absolute path
git apply C:\Users\dmaso\OneDrive\Documents\002 Projects\003 Web Development Agency\01_Clients\01_Greekrow_Trailblaze\03_Development\trailblaize-web-app\agent-changes.patch

# Review changes
git status
git diff

# Stage and commit the changes
git add .
git commit -m "Sync: Agent changes from trailblaize-web-app [TRA-430]"

# Push to greekspeed
git push origin develop
```

**Note**: If there are conflicts, resolve them manually, then commit.

---

### Option 2: Manual File Copy Method

Use this when you want more control or the patch method fails.

#### Step 1: In trailblaize-web-app - Identify Changed Files

```powershell
# Navigate to trailblaize-web-app
cd C:\Users\dmaso\OneDrive\Documents\002 Projects\003 Web Development Agency\01_Clients\01_Greekrow_Trailblaze\03_Development\trailblaize-web-app

# Checkout the branch with agent changes
git checkout cursor/TRA-430-comment-link-previews-10c2
# OR
git checkout main
git pull origin main

# See what files changed
git diff --name-only origin/develop

# See detailed changes
git diff origin/develop
```

#### Step 2: Copy Files to greekspeed

```powershell
# Navigate to greekspeed
cd C:\Users\dmaso\OneDrive\Documents\002 Projects\003 Web Development Agency\01_Clients\01_Greekrow_Trailblaze\03_Development\greekspeed

# Ensure you're on develop branch
git checkout develop
git pull origin develop

# Manually copy changed files from trailblaize-web-app to greekspeed
# Use File Explorer or PowerShell Copy-Item command
# Example:
# Copy-Item "..\trailblaize-web-app\app\api\posts\[id]\comments\route.ts" -Destination "app\api\posts\[id]\comments\route.ts" -Force

# Review changes
git status
git diff

# Stage and commit
git add .
git commit -m "Sync: Agent changes from trailblaize-web-app [TRA-430]"

# Push to greekspeed
git push origin develop
```

---

### Option 3: Cherry-Pick Commits (For Specific Commits)

If the agent made specific commits you want to bring over:

```powershell
# In trailblaize-web-app - Get commit hashes
cd trailblaize-web-app
git log origin/develop..HEAD --oneline
# Note the commit hashes (e.g., 5a135d4)

# In greekspeed - Cherry-pick commits
cd greekspeed
git checkout develop
git pull origin develop

# Add trailblaize-web-app as a remote (if not already added)
git remote add org-repo https://github.com/Trailblaizedevelopment/trailblaize-web-app.git 2>$null

# Fetch from org repo
git fetch org-repo

# Cherry-pick the commits
git cherry-pick 5a135d4

# Resolve any conflicts if they occur
# Then push
git push origin develop
```

---

## Sync Checklist

After syncing agent changes:

- [ ] Changes identified in trailblaize-web-app
- [ ] Changes applied to greekspeed successfully
- [ ] No merge conflicts (or conflicts resolved)
- [ ] Code tested in greekspeed after sync
- [ ] Changes committed with descriptive message including Linear ticket ID
- [ ] Changes pushed to greekspeed
- [ ] Verified auto-sync to trailblaize-web-app works (check GitHub Actions)
- [ ] Updated Linear ticket with sync completion status

## Troubleshooting

### Patch Apply Fails
- Check if file paths match between repos
- Ensure you're on the correct base branch (develop)
- Try manual file copy method instead

### Merge Conflicts
- Resolve conflicts manually in greekspeed
- Test thoroughly after resolution
- Consider using cherry-pick method for cleaner history

### Files Not Found
- Verify branch names match
- Check if files were deleted in one repo
- Ensure you're comparing against correct base branch

### Auto-Sync Not Working
- Check GitHub Actions in greekspeed repo
- Verify workflow is enabled
- Check if `.github/workflows` was accidentally synced (should be excluded)

## Quick Reference

### Common Sync Scenarios

#### Agent worked on feature branch (e.g., `cursor/TRA-430-...`)
```powershell
# In trailblaize-web-app
git checkout cursor/TRA-430-comment-link-previews-10c2
git diff origin/develop > changes.patch

# In greekspeed
git checkout develop
git apply ..\trailblaize-web-app\changes.patch
git add .
git commit -m "Sync: Agent changes [TRA-430]"
git push origin develop
```

#### Agent worked on main branch
```powershell
# In trailblaize-web-app
git checkout main
git pull origin main
git diff origin/develop > changes.patch

# In greekspeed
git checkout develop
git apply ..\trailblaize-web-app\changes.patch
git add .
git commit -m "Sync: Agent changes from main"
git push origin develop
```

#### View what changed without syncing
```powershell
# In trailblaize-web-app
git checkout <agent-branch>
git diff origin/develop --stat  # Summary
git diff origin/develop          # Full diff
git log origin/develop..HEAD     # Commit list
```

## Important Notes

- **Always sync agent changes back** - Don't let repos diverge
- **Test after syncing** - Verify changes work in greekspeed
- **Include Linear ticket ID** - Makes tracking easier
- **Sync to develop branch** - Keeps main clean
- **Check for conflicts** - Resolve before pushing
