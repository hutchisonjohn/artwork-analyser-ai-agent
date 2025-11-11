# Artwork Analyser AI Agent — Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the **Artwork Analyser AI Agent** to production using Cloudflare Pages (frontend) and Cloudflare Workers (backend API).

## Prerequisites

- **Cloudflare Account**: Sign up at https://dash.cloudflare.com
- **Git Repository**: Code pushed to GitHub (supports GitLab, Gitea)
- **Node.js 20+**: Local development
- **Wrangler CLI**: `npm install -g @cloudflare/wrangler`
- **API Keys** (optional):
  - Claude API key (for production use)
  - OpenAI API key (alternative)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Cloudflare Pages                          │
│             (Frontend: React + Vite + Tailwind)             │
│          ⬇️ Routes requests to /api/* to Workers            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ⬇️
┌─────────────────────────────────────────────────────────────┐
│              Cloudflare Workers (Hono API)                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Routes                                              │  │
│  │  • /api/health        - Health check               │  │
│  │  • /api/chat         - AI assistant endpoint       │  │
│  │  • /api/config       - Admin configuration (auth)  │  │
│  │  • /api/docs         - RAG document management     │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  Bindings:                                                  │
│  • APP_CONFIG (KV Namespace)      - Config & secrets      │
│  • DOCS_DB (D1 Database)          - RAG documents         │
│  • WORKERS_AI (AI Models)         - Embeddings & chat     │
└─────────────────────────────────────────────────────────────┘
```

---

## Step 1: Prepare Cloudflare Resources

### 1.1 Create KV Namespace

```bash
wrangler kv:namespace create "APP_CONFIG"
wrangler kv:namespace create "APP_CONFIG" --preview
```

Note the namespace IDs returned.

### 1.2 Create D1 Database

```bash
wrangler d1 create artwork_ai_db
wrangler d1 create artwork_ai_db --preview
```

Note the database IDs returned.

### 1.3 Apply D1 Migrations

```bash
wrangler d1 migrations apply artwork_ai_db --remote
wrangler d1 migrations apply artwork_ai_db --local
```

This creates the `doc_chunks` table for RAG document storage.

---

## Step 2: Configure `wrangler.toml`

Update `wrangler.toml` with your resource IDs:

```toml
name = "artwork-analyser-worker"
main = "src/worker/src/index.ts"
compatibility_date = "2025-11-09"

[vars]
APP_NAME = "Artwork Analyzer AI Agent"
ADMIN_TOKEN = "your-secret-admin-token-here"
APP_SECRET_KEY = "your-encryption-secret-here"

[[kv_namespaces]]
binding = "APP_CONFIG"
id = "your-kv-namespace-id"
preview_id = "your-kv-preview-id"

[[d1_databases]]
binding = "DOCS_DB"
database_name = "artwork_ai_db"
database_id = "your-d1-database-id"
preview_database_id = "your-d1-preview-id"
migrations_dir = "src/worker/migrations"

[ai]
binding = "WORKERS_AI"

[observability]
enabled = true
```

---

## Step 3: Deploy Worker to Cloudflare

### 3.1 Authenticate Wrangler

```bash
wrangler login
```

### 3.2 Deploy Worker

```bash
wrangler deploy
```

This deploys the API to your Cloudflare Workers account.

**Output**: Your worker URL (e.g., `https://artwork-analyser-worker.<account>.workers.dev`)

### 3.3 Verify Deployment

```bash
curl https://artwork-analyser-worker.<account>.workers.dev/health
# Expected response: {"status":"ok","timestamp":"..."}
```

---

## Step 4: Deploy Frontend to Cloudflare Pages

### 4.1 Connect GitHub Repository

1. Go to [Cloudflare Pages Dashboard](https://dash.cloudflare.com/pages)
2. Click **Create a project** → **Connect to Git**
3. Select your GitHub repository
4. Choose branch: `main` or `develop`

### 4.2 Configure Build Settings

**Build command:**
```
npm run build:frontend
```

**Build output directory:**
```
src/frontend/dist
```

**Environment variables:**
```
VITE_WORKER_URL=https://artwork-analyser-worker.<account>.workers.dev
```

### 4.3 Deploy

Click **Save and Deploy**. Cloudflare will automatically build and deploy on every push to your branch.

**Output**: Your Pages URL (e.g., `https://artwork-analyser.<account>.pages.dev`)

---

## Step 5: Post-Deployment Configuration

### 5.1 Set Admin Credentials

Set up initial configuration in the Worker KV store:

```bash
wrangler kv:key put --namespace-id=<APP_CONFIG-ID> \
  --path ./init-config.json \
  app-config
```

Where `init-config.json`:
```json
{
  "provider": "claude",
  "model": "claude-3-5-sonnet-latest",
  "embeddingModel": "@cf/baai/bge-base-en-v1.5",
  "systemPrompt": "You are a print production specialist...",
  "apiKey": null
}
```

### 5.2 Add API Key (Optional, for LLM usage)

Visit your deployed Pages URL → **Settings** tab:
1. Enter your **Admin Token** (from `wrangler.toml`)
2. Select AI provider (Claude or OpenAI)
3. Paste your API key
4. Click **Save configuration**

---

## Step 6: Testing Production Deployment

### 6.1 Upload Test File

1. Go to your deployed Pages URL
2. Click **"Upload Files"**
3. Select a PNG or PDF file
4. Verify analysis displays correctly

### 6.2 Test AI Assistant (with API Key)

1. Ensure you've added an API key in Settings
2. After uploading an image, scroll to "AI Artwork Assistant"
3. Ask a question: *"Is this file ready for DTF printing?"*
4. Verify the assistant responds

### 6.3 Test Admin Panel

1. Go to **Settings** tab
2. Verify you can update configuration with your admin token
3. Try uploading a knowledge-base document (`.md` or `.txt`)

---

## Monitoring & Troubleshooting

### View Worker Logs

```bash
wrangler tail
```

### Check D1 Database

```bash
wrangler d1 execute artwork_ai_db --remote --command "SELECT COUNT(*) as doc_count FROM doc_chunks;"
```

### Common Issues

| Issue | Solution |
|-------|----------|
| 401 Unauthorized on `/api/config` | Ensure `ADMIN_TOKEN` is set in Settings and passed via `Authorization: Bearer <token>` header |
| AI assistant not responding | Check API key is configured and valid in Settings |
| PDF file analysis fails | Verify PDF is a valid file; PDFs >50MB may timeout |
| Missing "AI Artwork Assistant" | Set up at least one API key (Claude or OpenAI) |

---

## Environment Variables Reference

### Frontend (Cloudflare Pages)

| Variable | Purpose | Example |
|----------|---------|---------|
| `VITE_WORKER_URL` | Worker API base URL | `https://artwork-analyser-worker.example.workers.dev` |

### Worker (Cloudflare Workers)

| Variable | Purpose | Default |
|----------|---------|---------|
| `ADMIN_TOKEN` | Bearer token for admin endpoints | (none, set in wrangler.toml) |
| `APP_SECRET_KEY` | Encryption key for API keys in KV | (none) |
| `WORKERS_AI` | AI binding for embeddings | (auto-configured) |

---

## Maintenance

### Update Application Code

```bash
# Push to main branch
git push origin main

# Cloudflare Pages auto-deploys frontend
# For Worker updates, manually deploy:
wrangler deploy
```

### Backup D1 Data

```bash
wrangler d1 export artwork_ai_db --output backup.sql
```

### Rotate Admin Token

1. Update `ADMIN_TOKEN` in `wrangler.toml`
2. Redeploy: `wrangler deploy`
3. Update Settings panel to use new token

---

## Scaling & Performance

- **Frontend**: Cloudflare Pages automatically caches static assets
- **Worker CPU**: Runs in ~30ms per request (includes LLM calls)
- **D1 Database**: Scales to millions of documents (included in plan)
- **KV Store**: 100k req/s rate limit (more than sufficient)

To optimize:
1. Enable **caching** for `/api` routes (careful with analysis data)
2. Use **Cloudflare Analytics** for traffic monitoring
3. Implement **rate limiting** if needed

---

## Rollback

If deployment fails:

### Frontend Rollback
1. Go to Pages deployment history
2. Select previous successful deployment
3. Click **Rollback**

### Worker Rollback
```bash
wrangler rollback
```

---

## Cost Estimate (Monthly)

| Service | Free Tier | Cost |
|---------|-----------|------|
| Cloudflare Pages | ✅ Unlimited deploys | Free |
| Cloudflare Workers | ✅ 100k req/day | $0.50/M requests |
| D1 Database | ✅ 5GB storage | $0.75/GB stored |
| KV Store | ✅ 100k ops/day | $0.50/M ops |
| Workers AI (embeddings) | ✅ 100k requests | $0.08/k after |

**Total for small-medium usage**: ~$5-10/month

---

## Support & Resources

- **Cloudflare Docs**: https://developers.cloudflare.com
- **Workers AI Docs**: https://developers.cloudflare.com/workers-ai
- **D1 Documentation**: https://developers.cloudflare.com/d1
- **GitHub Issues**: Submit issues to your repository

---

**Last updated**: 2025-11-11  
**Version**: 1.0.0

