# YouTube API Setup - Step-by-Step Guide (Beginner-Friendly)

## 📋 What You'll Need
- **A personal Google account (Gmail)** ⚠️ **IMPORTANT: Use your personal Gmail, not a work/organization account**
- 10 minutes of time
- Your Cloudflare Pages URL (e.g., `https://your-app.pages.dev`)

---

## ⚠️ **CRITICAL: Use Your Personal Google Account**

**Before you start:**
- ✅ **USE:** Your personal Gmail account (e.g., `yourname@gmail.com`)
- ❌ **DON'T USE:** Work email, organization account, or Google Workspace account

**Why?** When creating the project, you'll need to select your email address as the "Location" for the project. This is mandatory and must be your personal Google account.

---

## 🎯 Overview

This guide will help you:
1. Create a Google Cloud project
2. Enable the YouTube Data API v3
3. Create an API key
4. Restrict the key for security
5. Add it to your app

**Total time: ~10 minutes**
**Cost: FREE** (10,000 searches per day)

---

## 📝 STEP 1: Go to Google Cloud Console

### 1.1 Open Your Browser
Open a new browser tab and go to:
```
https://console.cloud.google.com/
```

### 1.2 Sign In
- ⚠️ **IMPORTANT:** Sign in with your **personal Gmail account** (e.g., `yourname@gmail.com`)
- ❌ **DON'T use** work email or Google Workspace accounts
- If you don't have a personal Gmail, create a free one first at https://accounts.google.com/signup

### 1.3 Accept Terms (if prompted)
- If this is your first time, you may see a "Terms of Service" popup
- Check the boxes and click "Agree and Continue"

---

## 📝 STEP 2: Create a New Project

### 2.1 Click the Project Dropdown
- At the very top of the page, you'll see "Select a project" or a project name
- Click on it to open the project selector dropdown

**What you'll see:**
- A popup window titled "Select a project"
- A list of existing projects (if any)
- A "NEW PROJECT" button at the top right

### 2.2 Click "NEW PROJECT"
- Click the blue "NEW PROJECT" button in the top right corner of the popup

### 2.3 Fill in Project Details

You'll see a form with these fields:

**Project name:**
- Enter: `Artwork Analyser YouTube` (or any name you like)
- This is just for your reference

**Organization:**
- Leave as "No organization" (default)
- Don't change this unless you know what you're doing

**⚠️ IMPORTANT: Location (MANDATORY):**
- **You MUST fill in the Location field**
- Click the **"Browse"** button next to the Location field
- A popup will appear
- **Select your personal Gmail address** (e.g., `yourname@gmail.com`)
- Click **"SELECT"**
- The Location field will now show your email address
- **This is correct!** ✅ Your personal Google account is the parent for this project

### 2.4 Visual Example - Your Form Should Look Like This:

```
┌─────────────────────────────────────────────────┐
│ New Project                                     │
├─────────────────────────────────────────────────┤
│ Project name *                                  │
│ Artwork Analyser YouTube          ← You typed   │
├─────────────────────────────────────────────────┤
│ Organization *                                  │
│ No organization                ▼  ← Leave as is │
├─────────────────────────────────────────────────┤
│ Location *                                      │
│ yourname@gmail.com          Browse ← YOUR EMAIL │
│                                     ↑            │
│                          Click Browse, select   │
│                          your Gmail address     │
└─────────────────────────────────────────────────┘

              [CREATE]  [CANCEL]
                 ↑
            Click here!
```

**✅ All three fields filled in? Great! Now click CREATE.**

### 2.5 Click "CREATE"
- Click the blue "CREATE" button at the bottom
- Wait 10-30 seconds for the project to be created
- You'll see a notification bell icon with a message when it's done

### 2.6 Select Your New Project
- Click the project dropdown again (top of page)
- Click on your new project name: "Artwork Analyser YouTube"
- The page will reload with your new project selected

**✅ Checkpoint:** The top of the page should now show "Artwork Analyser YouTube" as the selected project

---

## 📝 STEP 3: Enable YouTube Data API v3

### 3.1 Open the Navigation Menu
- Click the "hamburger menu" (three horizontal lines) in the top left corner
- A sidebar will slide out

### 3.2 Navigate to APIs & Services
- In the sidebar, scroll down and hover over "APIs & Services"
- A submenu will appear
- Click on "Library"

**OR use this direct link:**
```
https://console.cloud.google.com/apis/library
```

### 3.3 Search for YouTube API
You'll see a page titled "API Library" with a search bar

- Click in the search bar at the top
- Type: `YouTube Data API v3`
- Press Enter or click the search icon

### 3.4 Select YouTube Data API v3
- You'll see search results
- Click on the card that says **"YouTube Data API v3"**
- Make sure it's the one by Google (official)
- **NOT** "YouTube Analytics API" or "YouTube Reporting API"

### 3.5 Enable the API
- You'll see a page with details about the YouTube Data API v3
- Click the big blue **"ENABLE"** button
- Wait 5-10 seconds for it to enable
- The page will change to show "API enabled" with a green checkmark

**✅ Checkpoint:** You should see "YouTube Data API v3" at the top with a green "Enabled" status

---

## 📝 STEP 4: Create API Credentials (API Key)

### 4.1 Click "CREATE CREDENTIALS"
- On the "YouTube Data API v3" page (after enabling)
- Look for the blue "CREATE CREDENTIALS" button near the top
- Click it

**OR navigate manually:**
- Click the hamburger menu (top left)
- Go to "APIs & Services" > "Credentials"
- Or use this link: `https://console.cloud.google.com/apis/credentials`

### 4.2 Choose Credential Type
If you see a wizard asking "Which API are you using?":
- Select: **"YouTube Data API v3"**
- For "What data will you be accessing?": Select **"Public data"**
- Click "Next" or "What credentials do I need?"

**OR if you're on the Credentials page:**
- Click "+ CREATE CREDENTIALS" at the top
- Select "API key" from the dropdown

### 4.3 API Key Created!
- A popup will appear showing your new API key
- It looks like: `AIzaSyD1234567890abcdefghijklmnopqrstuvwx`

**IMPORTANT: Copy this key NOW!**
- Click the "COPY" button or manually select and copy the key
- Paste it somewhere safe (Notepad, Notes app, etc.)
- You'll need this in Step 6

### 4.4 Click "RESTRICT KEY" (Recommended)
- In the same popup, click the "RESTRICT KEY" button
- This will take you to the key restriction page
- **Don't skip this!** It's important for security

---

## 📝 STEP 5: Restrict Your API Key (Security)

You should now be on the "Edit API key" page.

### 5.1 Give Your Key a Name (Optional)
- At the top, you'll see "Name" field
- Change it to something memorable: `Artwork Analyser YouTube Key`
- This helps you identify it later

### 5.2 Set Application Restrictions

Scroll down to the "Application restrictions" section.

**Choose one option:**

#### Option A: HTTP referrers (Recommended for web apps)
- Select the radio button: **"HTTP referrers (web sites)"**
- Click "+ ADD AN ITEM"
- In the text box that appears, enter your Cloudflare Pages URL:
  ```
  https://your-app.pages.dev/*
  ```
  **Replace `your-app` with your actual Cloudflare Pages project name**
  
- If you have a custom domain, click "+ ADD AN ITEM" again and add:
  ```
  https://yourdomain.com/*
  ```

- Click "+ ADD AN ITEM" one more time and add (for local testing):
  ```
  http://localhost:*
  ```

**Example:**
```
https://artwork-analyser-ai-agent.pages.dev/*
https://myartworkapp.com/*
http://localhost:*
```

#### Option B: None (Not recommended, but easier for testing)
- Select the radio button: **"None"**
- This allows the key to work from anywhere
- **Warning:** Less secure, but easier for initial testing

### 5.3 Set API Restrictions

Scroll down to the "API restrictions" section.

- Select the radio button: **"Restrict key"**
- A dropdown will appear
- Click the dropdown and search for: `YouTube Data API v3`
- Check the box next to **"YouTube Data API v3"**
- Make sure ONLY this API is checked
- Click outside the dropdown to close it

**✅ You should see:** "1 API selected" and "YouTube Data API v3" listed

### 5.4 Save Your Restrictions
- Scroll to the bottom of the page
- Click the blue **"SAVE"** button
- Wait a few seconds for the changes to save
- You'll see a green "API key saved" notification

**✅ Checkpoint:** Your API key is now created and restricted!

---

## 📝 STEP 6: Add API Key to Your Artwork Analyser App

### 6.1 Go to Your App
- Open a new browser tab
- Go to your Artwork Analyser app URL
- Example: `https://your-app.pages.dev`

### 6.2 Navigate to Settings
- Click on the **"Settings"** tab in the navigation
- (It's usually in the top navigation bar)

### 6.3 Unlock Settings
- You'll see an "Admin Password" field
- Enter your admin password
- Click **"Unlock Settings"**

**Don't know your password?**
- Check your `wrangler.toml` file for `ADMIN_TOKEN`
- Or check Cloudflare Dashboard > Workers > Your Worker > Settings > Variables

### 6.4 Scroll to YouTube API Section
- Scroll down until you see a **purple box** titled:
  **"📺 YouTube Tutorials (Optional)"**

### 6.5 Paste Your API Key
- Click in the "YouTube Data API v3 Key" field
- Paste the API key you copied in Step 4.3
- It should look like: `AIzaSyD1234567890abcdefghijklmnopqrstuvwx`

**Double-check:**
- No extra spaces before or after the key
- The entire key is pasted (usually 39 characters)

### 6.6 Save Settings
- Scroll to the bottom of the Settings page
- Click the big green button: **"💾 Save All Settings"**
- Wait for the success message: "Configuration saved!"
- You should also see: "✓ YouTube API is configured - McCarthy can now provide tutorial links!"

**✅ Checkpoint:** Your YouTube API key is now saved!

---

## 📝 STEP 7: Test It!

### 7.1 Upload an Artwork
- Go back to the main "Analyze" tab
- Upload any image file (PNG, JPG, etc.)
- Wait for the analysis to complete

### 7.2 Open AI Chat
- Click the ✨ AI icon in the top right corner
- The AI chat window will open on the right side
- McCarthy will send you a greeting message

### 7.3 Ask a "How To" Question
Type one of these test questions:

```
How do I fix transparency?
```

or

```
How to increase DPI in Photoshop?
```

or

```
How to create halftones?
```

### 7.4 Check the Response
McCarthy should respond with:

1. **Her answer** (2-3 sentences explaining the solution)
2. **A blank line**
3. **"📺 Helpful Tutorials:"**
4. **3 YouTube video links** formatted like:
   ```
   1. [Video Title Here](https://youtube.com/watch?v=...)
   2. [Another Video Title](https://youtube.com/watch?v=...)
   3. [Third Video Title](https://youtube.com/watch?v=...)
   ```

### 7.5 Click a Link
- Click on one of the YouTube links
- It should open YouTube in a new tab
- The video should be real and relevant to your question

**✅ SUCCESS!** If you see 3 YouTube links and they work, you're done! 🎉

---

## 🐛 Troubleshooting

### Problem 1: "No API keys to display" in Google Cloud Console

**Solution:**
- Make sure you selected the correct project (top of page)
- Go to "APIs & Services" > "Credentials"
- Click "+ CREATE CREDENTIALS" > "API key"

---

### Problem 2: No YouTube links appear in McCarthy's response

**Possible causes and solutions:**

#### A. API key not saved
- Go to Settings > Unlock > Scroll to YouTube section
- Check if the API key field is empty
- If empty, paste your key again and click "Save All Settings"

#### B. Question doesn't include "how to" keywords
- Try asking: "How do I fix transparency?"
- Or: "Show me a tutorial on DPI"
- McCarthy only provides links for "how to" questions

#### C. YouTube API not configured in Google Cloud
- Go back to Step 3 and make sure you enabled "YouTube Data API v3"
- Check that it shows "Enabled" with a green checkmark

#### D. API key restrictions too strict
- Go to Google Cloud Console > APIs & Services > Credentials
- Click on your API key name
- Under "Application restrictions", try selecting "None" temporarily
- Click "Save" and test again

---

### Problem 3: "YouTube API error: 403" in chat

**This means your API key is restricted and blocking the request.**

**Solution:**
1. Go to Google Cloud Console > APIs & Services > Credentials
2. Click on your API key name
3. Scroll to "Application restrictions"
4. Make sure your Cloudflare Pages URL is listed correctly:
   - Format: `https://your-app.pages.dev/*` (with `/*` at the end)
   - Check for typos in the URL
5. Or temporarily select "None" to test
6. Click "Save" and wait 1-2 minutes for changes to take effect
7. Try again in your app

---

### Problem 4: "YouTube API error: 400"

**This means the search query is malformed.**

**Solution:**
- Check worker logs: Open terminal and run `wrangler tail`
- Look for `[TUTORIAL]` messages
- Report the issue with the exact question you asked

---

### Problem 5: "YouTube API error: 429" (Too Many Requests)

**This means you've exceeded the free quota (10,000 searches/day).**

**Solution:**
- Wait until tomorrow (quota resets at midnight Pacific Time)
- Or enable billing in Google Cloud Console to increase quota
- Check your usage: Google Cloud Console > APIs & Services > Dashboard > YouTube Data API v3

---

### Problem 6: API key not working after 5 minutes

**API key restrictions can take a few minutes to propagate.**

**Solution:**
- Wait 5-10 minutes after saving restrictions
- Clear your browser cache
- Try again

---

## 📊 How to Check Your API Usage

### Step 1: Go to Google Cloud Console
```
https://console.cloud.google.com/
```

### Step 2: Select Your Project
- Click the project dropdown at the top
- Select "Artwork Analyser YouTube"

### Step 3: Go to API Dashboard
- Click hamburger menu (top left)
- Go to "APIs & Services" > "Dashboard"
- Or use: `https://console.cloud.google.com/apis/dashboard`

### Step 4: Click on YouTube Data API v3
- You'll see a list of enabled APIs
- Click on "YouTube Data API v3"

### Step 5: View Usage Graph
- You'll see a graph showing:
  - Requests per day
  - Quota usage
  - Errors (if any)

### Step 6: Set Up Quota Alerts (Optional)
- Click "Quotas" in the left sidebar
- Click "YouTube Data API v3"
- Click "Edit Quotas"
- Set an alert at 80% usage (8,000 queries/day)

---

## 💰 Cost Breakdown

### Free Tier (Default)
- **10,000 queries per day** = FREE
- Each search = 100 quota units
- 100 searches per day = 10,000 units
- Resets daily at midnight Pacific Time

### If You Exceed Free Tier
- You'll need to enable billing
- Cost: ~$0.05 per 1,000 searches
- Example: 20,000 searches/day = $1/day = $30/month
- Still very affordable!

### How to Enable Billing (if needed)
1. Google Cloud Console > Billing
2. Link a credit card
3. Set up budget alerts
4. Quota will automatically increase

---

## 🔐 Security Best Practices

### ✅ DO:
- Restrict API key to YouTube Data API v3 only
- Add HTTP referrer restrictions (your domain)
- Use a unique API key for each project
- Monitor usage regularly
- Set up quota alerts
- Rotate keys every 6-12 months

### ❌ DON'T:
- Share your API key publicly
- Commit API keys to GitHub
- Use the same key for multiple projects
- Leave "Application restrictions" as "None" in production
- Ignore quota alerts

---

## 📚 Additional Resources

### Google Documentation
- YouTube Data API v3: https://developers.google.com/youtube/v3
- API Key Best Practices: https://cloud.google.com/docs/authentication/api-keys
- Quota Management: https://developers.google.com/youtube/v3/getting-started#quota

### Your App Documentation
- `TUTORIAL_SCENARIOS.md` - All 13+ scenarios covered
- `YOUTUBE_TEST_QUESTIONS.md` - 50+ test questions
- `YOUTUBE_INTEGRATION_SUMMARY.md` - Technical details

---

## ✅ Final Checklist

Before you finish, make sure:

- [ ] Google Cloud project created
- [ ] YouTube Data API v3 enabled (green checkmark)
- [ ] API key created and copied
- [ ] API key restricted to YouTube Data API v3 only
- [ ] HTTP referrer restrictions added (your domain)
- [ ] API key pasted in Settings and saved
- [ ] Tested with "How do I fix transparency?"
- [ ] 3 YouTube links appeared in McCarthy's response
- [ ] Links are clickable and work
- [ ] Usage monitoring set up (optional)

---

## 🎉 You're Done!

McCarthy can now provide real, working YouTube tutorial links!

**Next steps:**
1. Test all 13+ scenarios (see `YOUTUBE_TEST_QUESTIONS.md`)
2. Monitor your API usage
3. Set up quota alerts
4. Enjoy helping your users with real tutorials!

---

## 💬 Need Help?

If you're still stuck:
1. Check the Troubleshooting section above
2. Run `wrangler tail` to see worker logs
3. Check Google Cloud Console for API errors
4. Review `YOUTUBE_INTEGRATION_SUMMARY.md` for technical details

---

**Last Updated:** November 15, 2025
**Difficulty:** Beginner-Friendly
**Time Required:** 10 minutes
**Cost:** FREE (10,000 searches/day)

