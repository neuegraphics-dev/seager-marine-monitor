# GitHub Actions Setup Guide (With SendGrid Email)

Complete step-by-step guide to set up GitHub Actions with SendGrid email notifications.

**Total time: ~10 minutes**

---

## Prerequisites

Before starting, make sure you have:

✅ GitHub account (free)  
✅ SendGrid API Key (from SENDGRID_SETUP.md)  
✅ SendGrid From Email (verified)  
✅ SendGrid To Email (where notifications go)  
✅ All code files from this project  

---

## Step 1: Create GitHub Repository (2 minutes)

### In GitHub:

1. Go to **github.com**
2. Login to your account
3. Click the **+** icon in the top right
4. Click **"New repository"**
5. Fill in:
   - Repository name: `seager-marine-monitor`
   - Description: `Competitor monitoring for Seager Marine`
   - Visibility: **"Private"** (keeps your secrets safe)
6. Click **"Create repository"**

✅ GitHub repository created!

---

## Step 2: Upload Code to GitHub (3 minutes)

### On Your Computer:

**Open a terminal** in the folder with your code files.

Windows: Hold Shift + right-click folder → "Open PowerShell here"  
Mac/Linux: Right-click → "Open Terminal Here"

**Run these 6 commands** (copy-paste each one):

```bash
git init
```

```bash
git add .
```

```bash
git commit -m "Initial commit"
```

```bash
git remote add origin https://github.com/YOUR_USERNAME/seager-marine-monitor.git
```

Replace `YOUR_USERNAME` with your actual GitHub username!

```bash
git branch -M main
```

```bash
git push -u origin main
```

**GitHub will ask for your password.** Use your GitHub password (or personal access token if you have 2FA enabled).

✅ Code uploaded to GitHub!

---

## Step 3: Add SendGrid Secrets to GitHub (3 minutes)

GitHub will keep your SendGrid credentials safe. This is how GitHub Actions gets access to send emails.

### In GitHub:

1. Go to your GitHub repository
2. Click **"Settings"** (top menu)
3. Left sidebar: Click **"Secrets and variables"** → **"Actions"**
4. Click **"New repository secret"** (green button)

### Add First Secret: API Key

**Name:** `SENDGRID_API_KEY`  
**Value:** Your SendGrid API Key (the long string starting with `SG.`)

Click **"Add secret"**

### Add Second Secret: From Email

1. Click **"New repository secret"** again
2. **Name:** `SENDGRID_FROM_EMAIL`
3. **Value:** `monitor@seagermarine.com` (or whatever you verified)
4. Click **"Add secret"**

### Add Third Secret: To Email

1. Click **"New repository secret"** again
2. **Name:** `SENDGRID_TO_EMAIL`
3. **Value:** Your email (where you want notifications, e.g., `you@seagermarine.com`)
4. Click **"Add secret"**

✅ All 3 secrets added!

---

## Step 4: Enable Automation (1 minute)

### In GitHub:

1. Go to your repository
2. Click **"Actions"** tab (top menu)
3. You'll see **"Seager Monitor - Automated Competitor Tracking"**
4. Click on it
5. Click **"Enable workflow"** (if there's a button)

✅ Automation enabled! Monitor will start in 2 hours.

---

## Verify It's Working

### Check Actions Progress:

1. Go to your repo → **"Actions"** tab
2. You'll see runs appear with status:
   - 🟡 In progress (yellow)
   - ✅ Success (green)
   - ❌ Failed (red)

### First Run Details:

- Should take about 30-60 seconds
- Checks all 12 competitor sites
- Sends email if changes detected (or not if no changes)

### Where to Find Results:

**In Your Email:**
- Check inbox for emails from `Seager Marine Monitor`
- Emails appear every 2 hours (if changes detected)
- Subject: "Seager Marine Monitor - [Competitor Name] Update"

**In GitHub:**
- Go to repo → **"Actions"** tab
- Click any run to see logs
- Go to **"data"** folder to see JSON files

---

## What Happens Now (Automatic)

**Every 2 hours:**
1. GitHub wakes up and downloads your code
2. Runs the competitor monitor script
3. Checks all 12 websites
4. Detects any changes (added boats, removed boats, price changes, etc.)
5. Sends you an email if changes found
6. Saves results to GitHub repository
7. Goes to sleep

**You do nothing.** Just wait for emails.

---

## Email Notifications Explained

### When You GET an Email:
- Competitor website changed
- New boats added OR removed OR sold OR pending OR prices changed
- Email shows summary of changes
- Sent immediately when detected

### When You DON'T Get an Email:
- No changes on that competitor's website
- Monitor still ran (you can see it in Actions)
- Just no news to report

### Example Email:

```
From: Seager Marine Monitor <monitor@seagermarine.com>
Subject: Seager Marine Monitor - Marks Leisure Time Marine Update

⚓ Marks Leisure Time Marine - Inventory Update
Update Time: 12/20/2024, 2:30 PM

✨ Added (2)
• Sea Ray 210 Sundancer - $45,000
• Bayliner Cruiser 220 - $38,500

💰 Price Changes (1)
• 25ft Cruiser: $52,000 → $51,500

🔴 Sold (1)
• Thousand Islands 22
```

---

## Schedule Explanation

The monitor runs on this schedule:

```
Every 2 hours, starting at midnight UTC:
- 12:00 AM UTC
- 2:00 AM UTC
- 4:00 AM UTC
- ... (every 2 hours)
- 10:00 PM UTC
```

**In Eastern Time:**
- 7:00 AM
- 9:00 AM
- 11:00 AM
- 1:00 PM
- 3:00 PM
- 5:00 PM
- 7:00 PM
- 9:00 PM

(Converts based on your timezone)

---

## Troubleshooting

### "I don't see Actions tab"
- Make sure you're logged into GitHub
- Click on your repository first
- Actions tab should be at top

### "Actions shows red X (failed)"
- Click the failed run
- Scroll down to see error message
- Common issues:
  - SendGrid API key wrong (copy-paste again)
  - Email addresses wrong
  - Check all 3 secrets are added correctly

### "I didn't get an email"
- First run takes a few minutes
- Check spam folder
- Verify SendGrid From Email is correct
- Make sure emails exist in the secrets

### "How do I stop the monitor?"
- Go to Actions tab
- Click "Disable workflow" on the workflow
- Or just let it run (it's free and causes no harm)

### "Can I change how often it runs?"
- Edit `.github/workflows/monitor.yml`
- Change `cron: '0 */2 * * *'` to different schedule
- Push change to GitHub

### "Why didn't competitor X show up?"
- Website might block automated scraping
- May need to update HTML selectors
- Check error logs in Actions tab

---

## Daily Workflow (After Setup)

**Day 1:**
- Set up GitHub and SendGrid (10 minutes)
- Monitor starts automatically

**Day 2+:**
- Check your email for notifications
- That's it! Everything is automatic

**Weekly:**
- Glance at GitHub Actions to see history
- See trends in competitor activity

**Monthly:**
- Zero maintenance
- Everything still running perfectly

---

## Viewing Full History

### In GitHub:

1. Go to your repo
2. Click **"data"** folder
3. See files like:
   - `inventory.json` - Current state of all boats
   - `results-1702345200000.json` - Each scan's results

4. Click any file to see raw data
5. GitHub keeps version history (can see old versions)

### In Email:

- All notification emails are in your inbox
- Can search for competitor name
- Can see which changes happened when

---

## Advanced: Manual Trigger

Want to run the monitor right now (not wait 2 hours)?

1. Go to repo → **"Actions"** tab
2. Click **"Seager Monitor - Automated Competitor Tracking"**
3. Click **"Run workflow"** button
4. Click **"Run workflow"** (in the popup)
5. Monitor runs immediately!

---

## Advanced: Change Schedule

To run more/less frequently:

1. Go to your repo
2. Click on `.github/workflows/monitor.yml` file
3. Click the pencil icon (edit)
4. Find this line: `cron: '0 */2 * * *'`
5. Change it:
   - Every 1 hour: `'0 * * * *'`
   - Every 4 hours: `'0 */4 * * *'`
   - Every 6 hours: `'0 */6 * * *'`
   - Every day at 9 AM: `'0 9 * * *'`
6. Click "Commit changes"

---

## GitHub Actions Limits (Free)

| Item | Limit |
|------|-------|
| Monthly minutes | 3,000 free |
| Your usage | ~360 min/month (12% of limit) |
| Cost | $0 |
| Monthly charges | None |

You're using ~12% of free tier. Plenty of room.

---

## Security Checklist

✅ GitHub secrets are encrypted  
✅ Never share your secrets online  
✅ Repository is private  
✅ API keys can be regenerated in SendGrid if leaked  
✅ GitHub has excellent security  

---

## You're All Set! 🎉

Your monitor is now:
- ✅ Running every 2 hours automatically
- ✅ Checking all 12 competitor websites
- ✅ Sending email notifications
- ✅ Saving results in GitHub
- ✅ Completely free
- ✅ Requires zero maintenance

---

## Next Steps

1. Wait for first email (within minutes or 2 hours)
2. Check spam folder if email doesn't appear
3. Review Actions tab to see monitor running
4. That's it! Let it run automatically

---

## Support

**GitHub help:** docs.github.com  
**SendGrid help:** sendgrid.com/docs  
**This project:** Check SETUP.md for more details  

---

Happy monitoring! ⚓🎣
