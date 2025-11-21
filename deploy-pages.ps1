# Deploy to Cloudflare Pages
# This script uploads the dist folder to Cloudflare Pages

$PROJECT_NAME = "artwork-analyser-ai-agent"
$ACCOUNT_ID = "4d9baa62ab7d5d4da1e8d658801e5b13"
$DIST_DIR = "src\frontend\dist"

Write-Host "🚀 Deploying Artwork Analyser to Cloudflare Pages..." -ForegroundColor Cyan
Write-Host ""

# Check if dist folder exists
if (-not (Test-Path $DIST_DIR)) {
    Write-Host "❌ Error: dist folder not found at $DIST_DIR" -ForegroundColor Red
    Write-Host "Run 'npm run build' in src/frontend first" -ForegroundColor Yellow
    exit 1
}

# Use wrangler to deploy
Write-Host "📦 Uploading files..." -ForegroundColor Cyan
npx wrangler pages deploy $DIST_DIR --project-name=$PROJECT_NAME --commit-dirty=true

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Deployment successful!" -ForegroundColor Green
    Write-Host "🌐 URL: https://artwork-analyser-ai-agent-1qo.pages.dev" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    Write-Host "Please upload manually via Cloudflare Dashboard:" -ForegroundColor Yellow
    Write-Host "https://dash.cloudflare.com/$ACCOUNT_ID/pages/view/$PROJECT_NAME" -ForegroundColor Yellow
}

