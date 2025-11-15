# YouTube API Setup Guide

## Overview
This guide will walk you through setting up the YouTube Data API v3 to enable McCarthy to provide real, working tutorial links when users ask "how to" questions.

---

## Why YouTube API?

When users ask questions like:
- "How do I fix transparency?"
- "How to increase DPI?"
- "Show me a tutorial on halftones"

McCarthy will automatically:
1. Detect the tutorial need
2. Search YouTube for relevant videos
3. Provide 3-5 real, working video links with titles
4. Continue the conversation naturally

**Cost:** FREE for up to 10,000 searches per day (more than enough for most use cases)

---

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Click **"Select a project"** at the top
4. Click **"New Project"**
5. Enter a project name (e.g., "Artwork Analyser YouTube")
6. Click **"Create"**
7. Wait for the project to be created (takes ~30 seconds)

---

## Step 2: Enable YouTube Data API v3

1. In the Google Cloud Console, make sure your new project is selected
2. Go to **"APIs & Services"** > **"Library"** (or click [here](https://console.cloud.google.com/apis/library))
3. Search for **"YouTube Data API v3"**
4. Click on **"YouTube Data API v3"** in the results
5. Click the blue **"Enable"** button
6. Wait for it to enable (~10 seconds)

---

## Step 3: Create API Credentials

1. Go to **"APIs & Services"** > **"Credentials"** (or click [here](https://console.cloud.google.com/apis/credentials))
2. Click **"+ Create Credentials"** at the top
3. Select **"API Key"**
4. A popup will show your new API key - **COPY IT NOW** (you'll need it in a moment)
5. Click **"Restrict Key"** (recommended for security)

---

## Step 4: Restrict Your API Key (Recommended)

1. In the "API restrictions" section:
   - Select **"Restrict key"**
   - Check **"YouTube Data API v3"**
   - Uncheck all other APIs
2. In the "Application restrictions" section (optional):
   - Select **"HTTP referrers (web sites)"**
   - Add your Cloudflare Pages URL (e.g., `https://your-app.pages.dev/*`)
   - Add your custom domain if you have one (e.g., `https://yourdomain.com/*`)
3. Click **"Save"**

---

## Step 5: Add API Key to Your App

### Option A: Via Settings UI (Easiest)

1. Go to your app's **Settings** tab
2. Unlock with your admin password
3. Scroll to **"📺 YouTube Tutorials (Optional)"**
4. Paste your API key in the **"YouTube Data API v3 Key"** field
5. Click **"💾 Save All Settings"**
6. You should see: ✓ YouTube API is configured - McCarthy can now provide tutorial links!

### Option B: Via Cloudflare Dashboard (Alternative)

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Select your account
3. Go to **Workers & Pages**
4. Click on your worker (e.g., `artwork-analyser-worker`)
5. Go to **Settings** > **Variables**
6. Click **"Add variable"**
7. Name: `YOUTUBE_API_KEY`
8. Value: Paste your API key
9. Click **"Encrypt"** (recommended)
10. Click **"Save"**

---

## Step 6: Test It!

1. Upload an artwork to your app
2. Open the AI chat
3. Ask: **"How do I fix transparency in Photoshop?"**
4. McCarthy should respond with her answer + 3 YouTube video links!

Example response:
```
In Photoshop: Layer > Flatten Image, then use Filter > Pixelate > Color Halftone (set radius to 4-8 for smooth dots). In Illustrator: Select semi-transparent objects, set Opacity to 100%, use Effect > Pixelate > Color Halftone for gradients. Export as PNG at 300 DPI.

📺 Helpful Tutorials:
1. [How to Remove Transparency in Photoshop for DTF Printing](https://youtube.com/watch?v=...)
2. [Creating Halftones for Print - Complete Guide](https://youtube.com/watch?v=...)
3. [Photoshop Transparency Fix Tutorial](https://youtube.com/watch?v=...)
```

---

## Troubleshooting

### "YouTube API not configured" error
- Make sure you've saved the API key in Settings
- Check that the key is correct (no extra spaces)
- Verify the API is enabled in Google Cloud Console

### "YouTube API error: 403"
- Your API key might be restricted to specific domains
- Go back to Google Cloud Console > Credentials
- Edit your API key restrictions to allow your Cloudflare domain

### "YouTube API error: 400"
- The search query might be malformed
- Check worker logs: `wrangler tail`
- Report the issue if it persists

### No tutorial links appearing
- Check if you're asking a "how to" question
- Try: "How do I fix transparency?" or "Show me a tutorial on DPI"
- Check worker logs to see if tutorial detection is working: `wrangler tail`

---

## API Quota & Costs

### Free Tier
- **10,000 queries per day** (FREE)
- Each search costs 100 quota units
- 100 searches per day = 10,000 units
- More than enough for most apps!

### If You Exceed Free Tier
- You'll need to enable billing in Google Cloud
- Cost: ~$0.05 per 1,000 searches
- Very affordable even at high volume

### Monitor Your Usage
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to **"APIs & Services"** > **"Dashboard"**
4. Click on **"YouTube Data API v3"**
5. View your quota usage graph

---

## Tutorial Detection Scenarios

McCarthy will automatically detect and provide tutorials for:

### Transparency Issues
- "How to fix transparency"
- "How to remove semi-transparent pixels"
- "How to flatten transparency"
- "How to create halftones"

### DPI / Resolution
- "How to increase DPI"
- "How to upscale artwork"
- "How to improve resolution"
- "AI upscaling tutorial"

### Color Profiles
- "How to add ICC profile"
- "How to convert to sRGB"
- "How to fix color profile"

### Text & Lines
- "How to make text bigger"
- "How to increase line thickness"
- "How to make lines thicker"

### File Formats
- "How to export PNG"
- "How to save for printing"
- "How to convert to PNG"

### And many more!
See `TUTORIAL_SCENARIOS.md` for the complete list.

---

## Security Best Practices

1. **Restrict your API key** to only YouTube Data API v3
2. **Add domain restrictions** to prevent unauthorized use
3. **Store as encrypted secret** in Cloudflare (not in code)
4. **Monitor usage** regularly in Google Cloud Console
5. **Rotate keys** periodically (every 6-12 months)

---

## Need Help?

- **Google Cloud Console:** https://console.cloud.google.com/
- **YouTube API Docs:** https://developers.google.com/youtube/v3
- **Cloudflare Workers:** https://dash.cloudflare.com/

---

**Last Updated:** November 15, 2025

