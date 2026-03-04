# PowerShell script to sync agent changes from trailblaize-web-app to greekspeed
# Usage: .\scripts\sync-agent-changes.ps1 [branch-name]

param(
    [string]$AgentBranch = "",
    [string]$BaseBranch = "develop"
)

$ErrorActionPreference = "Stop"

# Paths
$GREEKSPEED_DIR = "C:\Users\dmaso\OneDrive\Documents\002 Projects\003 Web Development Agency\01_Clients\01_Greekrow_Trailblaze\03_Development\greekspeed"
$ORG_REPO_DIR = "C:\Users\dmaso\OneDrive\Documents\002 Projects\003 Web Development Agency\01_Clients\01_Greekrow_Trailblaze\03_Development\trailblaize-web-app"

Write-Host "🔄 Syncing agent changes from trailblaize-web-app to greekspeed..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Navigate to org repo and identify changes
Write-Host "Step 1: Checking trailblaize-web-app..." -ForegroundColor Yellow
Set-Location $ORG_REPO_DIR

# Fetch latest
Write-Host "  Fetching latest changes..." -ForegroundColor Gray
git fetch origin

# Determine which branch to check
if ($AgentBranch -eq "") {
    Write-Host "  Available branches:" -ForegroundColor Gray
    git branch -a | Select-String "cursor/" | ForEach-Object { Write-Host "    $_" -ForegroundColor Gray }
    $AgentBranch = Read-Host "  Enter branch name (or 'main' for main branch)"
}

Write-Host "  Checking out branch: $AgentBranch" -ForegroundColor Gray
git checkout $AgentBranch
git pull origin $AgentBranch

# Check what changed
Write-Host "  Checking changes against $BaseBranch..." -ForegroundColor Gray
$changedFiles = git diff --name-only "origin/$BaseBranch"
if ($changedFiles.Count -eq 0) {
    Write-Host "  ✅ No changes to sync" -ForegroundColor Green
    exit 0
}

Write-Host "  Changed files:" -ForegroundColor Gray
$changedFiles | ForEach-Object { Write-Host "    $_" -ForegroundColor Gray }

# Create patch
$patchFile = Join-Path $env:TEMP "agent-changes-$(Get-Date -Format 'yyyyMMdd-HHmmss').patch"
Write-Host "  Creating patch file..." -ForegroundColor Gray
git diff "origin/$BaseBranch" > $patchFile

Write-Host ""
Write-Host "Step 2: Applying changes to greekspeed..." -ForegroundColor Yellow
Set-Location $GREEKSPEED_DIR

# Ensure on correct branch
Write-Host "  Checking out $BaseBranch..." -ForegroundColor Gray
git checkout $BaseBranch
git pull origin $BaseBranch

# Apply patch
Write-Host "  Applying patch..." -ForegroundColor Gray
try {
    git apply $patchFile
    Write-Host "  ✅ Patch applied successfully" -ForegroundColor Green
} catch {
    Write-Host "  ⚠️  Patch application had issues. Review manually:" -ForegroundColor Yellow
    Write-Host "     git apply $patchFile" -ForegroundColor Gray
    Write-Host "  Or use manual file copy method." -ForegroundColor Yellow
    exit 1
}

# Show status
Write-Host ""
Write-Host "Step 3: Review changes..." -ForegroundColor Yellow
Write-Host "  Current status:" -ForegroundColor Gray
git status --short

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Review changes: git diff" -ForegroundColor White
Write-Host "  2. Test your changes" -ForegroundColor White
Write-Host "  3. Stage changes: git add ." -ForegroundColor White
Write-Host "  4. Commit: git commit -m 'Sync: Agent changes from trailblaize-web-app [TICKET-ID]'" -ForegroundColor White
Write-Host "  5. Push: git push origin $BaseBranch" -ForegroundColor White
Write-Host ""
Write-Host "Patch file saved at: $patchFile" -ForegroundColor Gray
