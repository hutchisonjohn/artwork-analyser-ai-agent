# Cloudflare Deployment - Step by Step for hutchisonjohn

Your code is now on GitHub! Follow these steps to deploy to Cloudflare.

---

## ✅ GitHub Status
- **Repository**: https://github.com/hutchisonjohn/artwork-analyser-ai-agent
- **Branches**: main & develop
- **Visibility**: Private (can change to public later)
- **Status**: ✅ Code pushed and ready

---

## Step 1: Cloudflare Setup (5 minutes)

### 1.1 Log in to Cloudflare
Go to: https://dash.cloudflare.com

Sign in with: **johnpaulhutchison@gmail.com**

### 1.2 Create KV Namespace

In Cloudflare dashboard:
1. Click **Workers & Pages** → **KV**
2. Click **Create namespace**
3. Name: `APP_CONFIG`
4. Click **Create**
5. **Copy the Namespace ID** (looks like `4c59e5e7046d414f81df825c277d153c`)

### 1.3 Create D1 Database

1. Click **Workers & Pages** → **D1**
2. Click **Create database**
3. Name: `artwork_ai_db`
4. Click **Create**
5. **Copy the Database ID** (long UUID)

### 1.4 Apply D1 Migrations

Run these commands:

```bash
cd "D:\coding\Artwork Analyser AI Agent"

# Authenticate with Cloudflare
wrangler login

# Apply migrations to your database
wrangler d1 migrations apply artwork_ai_db --remote
```

---

## Step 2: Update wrangler.toml (5 minutes)

Edit `D:\coding\Artwork Analyser AI Agent\wrangler.toml` and update:

```toml
name = "artwork-analyser-worker"
main = "src/worker/src/index.ts"
compatibility_date = "2025-11-09"

[vars]
APP_NAME = "Artwork Analyzer AI Agent"
ADMIN_TOKEN = "your-super-secret-admin-token-HERE"
APP_SECRET_KEY = "your-super-secret-encryption-key-HERE"

[[kv_namespaces]]
binding = "APP_CONFIG"
id = "PASTE_YOUR_KV_NAMESPACE_ID_HERE"
preview_id = "PASTE_YOUR_KV_PREVIEW_ID_HERE"

[[d1_databases]]
binding = "DOCS_DB"
database_name = "artwork_ai_db"
database_id = "PASTE_YOUR_D1_DATABASE_ID_HERE"
preview_database_id = "PASTE_YOUR_D1_PREVIEW_ID_HERE"
migrations_dir = "src/worker/migrations"

[ai]
binding = "WORKERS_AI"

[observability]
enabled = true
```

**Important**: 
- Replace the IDs with your actual Cloudflare IDs
- Choose strong values for `ADMIN_TOKEN` and `APP_SECRET_KEY`
- Keep these secret!

---

## Step 3: Deploy Worker (2 minutes)

```bash
cd "D:\coding\Artwork Analyser AI Agent"

# Deploy to Cloudflare Workers
wrangler deploy

# Test it works
curl https://artwork-analyser-worker.<your-account>.workers.dev/health
```

**Copy your worker URL** - you'll need it next.

It should look like: `https://artwork-analyser-worker.YOUR-ACCOUNT-NAME.workers.dev`

---

## Step 4: Deploy Frontend to Cloudflare Pages (5 minutes)

### 4.1 Connect GitHub

1. Go to: https://dash.cloudflare.com/pages
2. Click **Create a project** → **Connect to Git**
3. Click **GitHub** and authorize Cloudflare
4. Select repository: **artwork-analyser-ai-agent**
5. Choose production branch: **main**
6. Click **Next**

### 4.2 Configure Build

**Build command:**
```
npm run build:frontend
```

**Build output directory:**
```
src/frontend/dist
```

### 4.3 Add Environment Variable

Click **Add environment variable**:
- **Key**: `VITE_WORKER_URL`
- **Value**: `https://artwork-analyser-worker.YOUR-ACCOUNT.workers.dev` (from Step 3)

### 4.4 Deploy

Click **Save and Deploy**

Cloudflare will automatically build and deploy! ✅

**Get your Pages URL** from the deployment details (should be: `https://artwork-analyser.YOUR-ACCOUNT.pages.dev`)

---

## Step 5: Verify Everything Works (2 minutes)

### 5.1 Test Frontend
Visit: `https://artwork-analyser.YOUR-ACCOUNT.pages.dev`

You should see the Artwork Analyser home page!

### 5.2 Test API
```bash
curl https://artwork-analyser-worker.YOUR-ACCOUNT.workers.dev/health
```

Should return: `{"status":"ok","timestamp":"..."}`

### 5.3 Test File Upload
1. Go to your Pages URL
2. Click "Upload Files"
3. Upload a PNG or PDF
4. You should see analysis results!

---

## Step 6: Configure Admin Panel (2 minutes)

1. Visit your Pages URL
2. Click **Settings** tab
3. Enter your **ADMIN_TOKEN** (from wrangler.toml)
4. Select provider: **Claude** or **OpenAI**
5. (Optional) Add API key for Claude/OpenAI
6. Click **Save**

---

## Your Deployed URLs

After all steps, you'll have:

| Resource | URL |
|----------|-----|
| **Frontend** | `https://artwork-analyser.YOUR-ACCOUNT.pages.dev` |
| **Worker API** | `https://artwork-analyser-worker.YOUR-ACCOUNT.workers.dev` |
| **GitHub Repo** | `https://github.com/hutchisonjohn/artwork-analyser-ai-agent` |

---

## Continuous Deployment (From Now On)

Every time you push code to GitHub, it automatically deploys:

```bash
# Make changes locally
code .

# Commit and push
git add .
git commit -m "Feature: Add new feature"
git push origin main

# ✅ Cloudflare automatically deploys to https://artwork-analyser.YOUR-ACCOUNT.pages.dev
# Happens in 2-3 minutes!
```

---

## Quick Checklist

- [ ] Step 1: Cloudflare setup (KV + D1)
- [ ] Step 2: Update wrangler.toml with your IDs
- [ ] Step 3: Deploy worker (`wrangler deploy`)
- [ ] Step 4: Deploy frontend to Pages
- [ ] Step 5: Verify everything works
- [ ] Step 6: Configure admin panel
- [ ] Done! Your app is live! 🎉

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Namespace not found" | Make sure you copied the correct KV Namespace ID to wrangler.toml |
| "Database not found" | Make sure you copied the correct D1 Database ID to wrangler.toml |
| Pages build fails | Check GitHub Actions: https://github.com/hutchisonjohn/artwork-analyser-ai-agent/actions |
| Frontend shows API errors | Make sure `VITE_WORKER_URL` is set correctly in Pages environment variables |
| Admin panel shows "JSON error" | Make sure you've deployed the worker first |

---

## Next Steps After Deployment

1. ✅ **Test file analysis** - Upload PNG/PDF files
2. ✅ **Configure AI** - Add Claude or OpenAI API key in Settings
3. ✅ **Test AI chat** - Ask questions about uploaded files
4. ✅ **Change visibility** - Make repo public when ready
5. ✅ **Build more features** - Continue developing!

---

**Questions?** Check `GITHUB_CLOUDFLARE_SETUP.md` for more detailed information.

**Ready to deploy? Let's go! 🚀**

