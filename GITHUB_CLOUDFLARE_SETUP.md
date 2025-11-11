# GitHub + Cloudflare Continuous Deployment Setup

This guide will get you deploying to GitHub and Cloudflare so you can continuously deploy as you build.

---

## Phase 1: GitHub Setup (10 minutes)

### Step 1.1: Create GitHub Repository

1. Go to https://github.com/new
2. **Repository name**: `artwork-analyser-ai-agent`
3. **Description**: "Artwork Analyser AI Agent - Print Quality Analysis with AI"
4. **Visibility**: Public or Private (your choice)
5. **Initialize**: Leave unchecked (we'll push existing code)
6. Click **Create repository**

### Step 1.2: Initialize Git Locally

```bash
cd "D:\coding\Artwork Analyser AI Agent"

# Initialize git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Artwork Analyser AI Agent v1.0.0

- Complete file analysis engine (PNG/PDF)
- AI chat integration (Claude/OpenAI)
- RAG knowledge base system
- Admin configuration dashboard
- Cloudflare Workers backend
- React Vite frontend
- GitHub Actions CI/CD
- Full test suite"
```

### Step 1.3: Connect to GitHub and Push

Replace `YOUR_USERNAME` with your GitHub username:

```bash
# Add remote
git remote add origin https://github.com/YOUR_USERNAME/artwork-analyser-ai-agent.git

# Rename main branch (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

### Step 1.4: Create Develop Branch

```bash
git checkout -b develop
git push -u origin develop
```

You now have:
- ✅ **main** branch - Production code
- ✅ **develop** branch - Development code

---

## Phase 2: Cloudflare Setup (20 minutes)

### Step 2.1: Create Cloudflare Account

1. Go to https://dash.cloudflare.com
2. Sign up (free account)
3. Complete email verification

### Step 2.2: Create KV Namespace

```bash
# Authenticate with Cloudflare
wrangler login

# Create KV namespace for production
wrangler kv:namespace create "APP_CONFIG"
# Note the namespace ID

# Create KV namespace for preview/staging
wrangler kv:namespace create "APP_CONFIG" --preview
# Note the preview namespace ID
```

**Save these IDs** - you'll need them in `wrangler.toml`

### Step 2.3: Create D1 Database

```bash
# Create production database
wrangler d1 create artwork_ai_db

# Create preview database
wrangler d1 create artwork_ai_db --preview
```

**Save these IDs** - you'll need them in `wrangler.toml`

### Step 2.4: Apply D1 Migrations

```bash
# Apply migrations to production
wrangler d1 migrations apply artwork_ai_db --remote

# Apply migrations locally for development
wrangler d1 migrations apply artwork_ai_db --local
```

### Step 2.5: Update wrangler.toml

Edit `wrangler.toml` and replace with your IDs:

```toml
name = "artwork-analyser-worker"
main = "src/worker/src/index.ts"
compatibility_date = "2025-11-09"

[vars]
APP_NAME = "Artwork Analyzer AI Agent"
ADMIN_TOKEN = "your-super-secret-admin-token-change-this"
APP_SECRET_KEY = "your-super-secret-encryption-key-change-this"

[[kv_namespaces]]
binding = "APP_CONFIG"
id = "YOUR_KV_NAMESPACE_ID"
preview_id = "YOUR_KV_PREVIEW_ID"

[[d1_databases]]
binding = "DOCS_DB"
database_name = "artwork_ai_db"
database_id = "YOUR_D1_DATABASE_ID"
preview_database_id = "YOUR_D1_PREVIEW_ID"
migrations_dir = "src/worker/migrations"

[ai]
binding = "WORKERS_AI"

[observability]
enabled = true
```

---

## Phase 3: Deploy Worker to Cloudflare (5 minutes)

```bash
cd "D:\coding\Artwork Analyser AI Agent"

# Deploy to Cloudflare Workers
wrangler deploy

# Test it
curl https://artwork-analyser-worker.<your-account>.workers.dev/health
# Should return: {"status":"ok","timestamp":"..."}
```

**Copy your worker URL** - you'll need it for the frontend.

---

## Phase 4: Deploy Frontend to Cloudflare Pages (10 minutes)

### Step 4.1: Connect GitHub to Cloudflare Pages

1. Go to https://dash.cloudflare.com/pages
2. Click **Create a project** → **Connect to Git**
3. Authorize Cloudflare to access GitHub
4. Select **artwork-analyser-ai-agent** repository
5. Choose production branch: **main**

### Step 4.2: Configure Build Settings

**Build command:**
```
npm run build:frontend
```

**Build output directory:**
```
src/frontend/dist
```

**Environment variables:**

Add these:
- **Key**: `VITE_WORKER_URL`
- **Value**: `https://artwork-analyser-worker.<your-account>.workers.dev`

### Step 4.3: Deploy

Click **Save and Deploy**.

Cloudflare will automatically:
1. ✅ Clone your repo
2. ✅ Install dependencies
3. ✅ Run build
4. ✅ Deploy to edge network

**Your app is now live!** 🎉

Get your Pages URL from the deployment info.

---

## Phase 5: Continuous Deployment (Automatic)

Now every time you push code, it automatically deploys:

```bash
# Make changes locally
code .

# Commit and push to GitHub
git add .
git commit -m "Fix: Update AI prompt template"
git push origin develop

# Cloudflare automatically:
# 1. Detects new commit
# 2. Builds frontend
# 3. Deploys to Pages
# ✅ Live in 2-3 minutes!
```

---

## Workflow: Develop → Deploy

### For Development Work

```bash
# Create feature branch
git checkout -b feature/new-feature-name

# Make changes
code .

# Test locally (optional)
npm run dev:frontend

# Commit and push
git add .
git commit -m "Feature: Add new feature"
git push origin feature/new-feature-name

# Create Pull Request on GitHub
# Review & merge to develop
```

### For Production Releases

```bash
# Merge develop → main
git checkout main
git pull origin main
git merge develop

# Tag release
git tag -a v1.0.1 -m "Release v1.0.1: Fixed AI chat"

# Push to GitHub
git push origin main
git push origin v1.0.1

# Cloudflare automatically deploys to production!
```

---

## Your URLs

After deployment, you'll have:

| Resource | URL |
|----------|-----|
| **Frontend (Pages)** | `https://artwork-analyser.YOUR_ACCOUNT.pages.dev` |
| **Worker API** | `https://artwork-analyser-worker.YOUR_ACCOUNT.workers.dev` |
| **Health Check** | `https://artwork-analyser-worker.YOUR_ACCOUNT.workers.dev/health` |
| **GitHub Repo** | `https://github.com/YOUR_USERNAME/artwork-analyser-ai-agent` |

---

## Step-by-Step Checklist

### GitHub Setup
- [ ] Created GitHub repository
- [ ] Initialized local git
- [ ] Committed initial code
- [ ] Pushed to GitHub (main branch)
- [ ] Created develop branch

### Cloudflare Setup
- [ ] Created Cloudflare account
- [ ] Ran `wrangler login`
- [ ] Created KV namespace
- [ ] Created D1 database
- [ ] Applied D1 migrations
- [ ] Updated `wrangler.toml` with IDs

### Worker Deployment
- [ ] Ran `wrangler deploy`
- [ ] Tested `/health` endpoint
- [ ] Copied worker URL

### Pages Deployment
- [ ] Connected GitHub to Cloudflare Pages
- [ ] Configured build settings
- [ ] Added `VITE_WORKER_URL` environment variable
- [ ] Deployed to Pages
- [ ] Verified frontend is live

### Continuous Deployment
- [ ] Set up git workflow
- [ ] Ready to make changes and push
- [ ] CI/CD pipeline working

---

## Troubleshooting

### Git Issues

**"fatal: not a git repository"**
```bash
cd "D:\coding\Artwork Analyser AI Agent"
git status
```

**"remote already exists"**
```bash
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/artwork-analyser-ai-agent.git
```

### Cloudflare Issues

**"Unauthorized" when running wrangler commands**
```bash
wrangler logout
wrangler login
```

**"Failed to find D1 database"**
- Make sure `wrangler.toml` has correct database IDs
- Run: `wrangler d1 list` to see all databases

**Pages build fails**
- Check GitHub Actions logs: https://github.com/YOUR_USERNAME/artwork-analyser-ai-agent/actions
- Common issue: Missing `VITE_WORKER_URL` environment variable

### Frontend Shows Errors

**"Cannot connect to API"**
- Verify worker is deployed: `curl https://artwork-analyser-worker.YOUR_ACCOUNT.workers.dev/health`
- Check `VITE_WORKER_URL` environment variable is correct in Pages settings

**Settings page shows "JSON error"**
- Need to set admin token in Cloudflare KV first (see next section)

---

## Initial Configuration

After deployment, configure your app:

### Step 1: Set Initial Config in KV

```bash
# Create a JSON file with initial config
cat > config.json << 'EOF'
{
  "provider": "claude",
  "model": "claude-3-5-sonnet-latest",
  "embeddingModel": "@cf/baai/bge-base-en-v1.5",
  "systemPrompt": "You are a print production specialist and artwork pre-press expert. Answer questions about uploaded artwork focusing on DPI, color profiles, transparency, and print readiness.",
  "apiKey": null
}
EOF

# Put it in KV
wrangler kv:key put --namespace-id=YOUR_KV_ID --path ./config.json app-config
```

### Step 2: Access Admin Panel

1. Visit your Pages URL
2. Click **Settings** tab
3. Enter admin token (from `wrangler.toml` `ADMIN_TOKEN`)
4. Add Claude or OpenAI API key
5. Click **Save configuration**

### Step 3: Test Upload

1. Click **Analyzer** tab
2. Upload a PNG or PDF file
3. Verify analysis appears
4. Ask AI a question
5. Verify response appears

---

## Making Changes & Deploying

### Small Changes (Bugfixes, UI tweaks)

```bash
# Make changes on develop branch
git checkout develop
code .

# Test locally
npm run dev:frontend

# Push to trigger auto-deploy
git add .
git commit -m "Fix: Update button color"
git push origin develop

# Cloudflare deploys in 2-3 minutes ✅
```

### Major Features

```bash
# Create feature branch
git checkout -b feature/new-analyzer

# Build your feature
code .
npm run test:frontend

# Merge to develop
git add .
git commit -m "Feature: Add SVG file support"
git checkout develop
git merge feature/new-analyzer
git push origin develop

# When ready for production
git checkout main
git merge develop
git push origin main

# Automatic production deployment ✅
```

### Deploy Worker Changes

```bash
# Make changes to worker code
code src/worker/src/

# Test types
npm run check:worker

# Deploy to Cloudflare
wrangler deploy

# Restart Pages build to pick up new worker URL (if changed)
```

---

## Monitoring Deployments

### Check Build Status

GitHub: https://github.com/YOUR_USERNAME/artwork-analyser-ai-agent/actions

### Check Pages Deployments

Cloudflare Pages: https://dash.cloudflare.com/pages

### Check Worker Logs

```bash
wrangler tail
```

### Monitor Uptime

Cloudflare Analytics: https://dash.cloudflare.com

---

## Summary

You now have:
- ✅ **GitHub repository** - Version control & history
- ✅ **Cloudflare Workers** - Serverless backend API
- ✅ **Cloudflare Pages** - Frontend hosting
- ✅ **Automatic deployment** - Push code → Live in minutes
- ✅ **Continuous integration** - Tests run automatically

Every push to `develop` or `main` automatically triggers deployment!

---

## Next: What to Build?

Once deployed, you can immediately:
1. Add SVG support
2. Implement advanced filters
3. Add document upload for RAG
4. Build batch processing
5. Create user accounts
6. And more!

All while continuously deploying!

---

**Ready to deploy? Follow the checklist above! 🚀**

Need help with any step? Let me know!

