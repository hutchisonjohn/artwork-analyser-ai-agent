# 🚀 Deployment Instructions

## Frontend (Cloudflare Pages)

### Method 1: Manual Upload (Current Method)

Since the GitHub repo is linked to the old account and wrangler OAuth lacks Pages permissions, use manual upload:

1. **Build the frontend:**
   ```powershell
   cd "D:\coding\Artwork Analyser AI Agent\src\frontend"
   npm run build
   ```

2. **Upload to Cloudflare Pages:**
   - Go to: https://dash.cloudflare.com/4d9baa62ab7d5d4da1e8d658801e5b13/pages/view/artwork-analyser-ai-agent
   - Click **"Upload assets"** or **"Create deployment"**
   - Drag the entire contents of `src/frontend/dist` folder
   - Click **"Deploy"**

3. **Verify deployment:**
   - Visit: https://artwork-analyser-ai-agent-1qo.pages.dev
   - Navigation menu should be gone (single page app)
   - Chat should not scroll when typing

---

### Method 2: GitHub Actions (Future - Requires Setup)

A GitHub Actions workflow is already committed (`.github/workflows/deploy.yml`), but requires these secrets to be set:

1. Go to: https://github.com/hutchisonjohn/artwork-analyser-ai-agent/settings/secrets/actions
2. Add these secrets:
   - `CLOUDFLARE_API_TOKEN`: Create at https://dash.cloudflare.com/profile/api-tokens
     - Use template: "Edit Cloudflare Workers"
     - Add permission: "Account > Cloudflare Pages > Edit"
   - `CLOUDFLARE_ACCOUNT_ID`: `4d9baa62ab7d5d4da1e8d658801e5b13`

Once set up, every push to `main` with frontend changes will auto-deploy!

---

## Backend (Dartmouth OS Worker)

The worker auto-deploys on every push to the `agent-army-system` repo (already set up).

**Manual deployment:**
```powershell
cd "D:\coding\agent-army-system\packages\worker"
npx wrangler deploy
```

**URL:** https://dartmouth-os-worker.dartmouth.workers.dev

---

## Current Status

- ✅ Backend: Auto-deploys via wrangler
- ⚠️ Frontend: Manual upload required (until GitHub Actions secrets are set)

