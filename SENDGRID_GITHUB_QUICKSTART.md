# 🚀 SendGrid + GitHub Actions Setup (15 Minutes)

**Complete setup for automated competitor monitoring with email notifications.**

---

## What You'll Have When Done

✅ Fully automated monitor running every 2 hours  
✅ Email notifications to your inbox  
✅ All 12 competitors tracked  
✅ Zero cost, zero maintenance  

---

## 3-Phase Setup

### Phase 1: SendGrid (5 minutes)
### Phase 2: GitHub (7 minutes)
### Phase 3: Verify (3 minutes)

---

## PHASE 1: SENDGRID (5 minutes)

### Step 1.1: Create Account
1. Go to **sendgrid.com**
2. Click "Sign Up"
3. Enter email, password, name
4. Confirm email
5. Login

### Step 1.2: Get API Key
1. Left sidebar → **Settings** → **API Keys**
2. Click "Create API Key"
3. Name: `GitHub Monitor`
4. Type: **Full Access**
5. Click "Create & Confirm"
6. **Copy the API Key** (looks like `SG.xxxxx...`)
7. **Save it somewhere** (you'll need it soon)

### Step 1.3: Verify Your Email
1. Left sidebar → **Settings** → **Sender Authentication**
2. Click "Verify a Sender"
3. From Email: `monitor@seagermarine.com`
4. From Name: `Seager Marine Monitor`
5. Reply-To Email: **Your actual email**
6. Company Address: Your address
7. Click "Create"
8. **Check your email** for verification link
9. Click the link to verify

### Step 1.4: Note Down 3 Things

**You now have:**
- ✅ API Key: `SG.xxxxxxxxxxxx...` (from Step 1.2)
- ✅ From Email: `monitor@seagermarine.com` (from Step 1.3)
- ✅ To Email: `your_email@company.com` (your email from Step 1.3)

Write these down!

---

## PHASE 2: GITHUB (7 minutes)

### Step 2.1: Create Repository
1. Go to **github.com**
2. Login
3. Click **+** (top right) → **New repository**
4. Name: `seager-marine-monitor`
5. Visibility: **Private** ⚠️ Important!
6. Click "Create repository"

### Step 2.2: Upload Code
**Open terminal in your code folder** (where all the files are):

Windows: Hold Shift + right-click → "Open PowerShell here"  
Mac: Right-click → "Services" → "New Terminal at Folder"  
Linux: Right-click → "Open Terminal Here"

**Run these 6 commands** (copy-paste each):

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
(Replace `YOUR_USERNAME` with your GitHub username)

```bash
git branch -M main
```

```bash
git push -u origin main
```

**GitHub will ask for password** - use your GitHub password.

### Step 2.3: Add SendGrid Secrets
1. Go to your GitHub repo in browser
2. Click **Settings** (top menu)
3. Left sidebar → **Secrets and variables** → **Actions**
4. Click "New repository secret" (green button)

**Add 1st Secret:**
- Name: `SENDGRID_API_KEY`
- Value: Paste your API key from Step 1.2
- Click "Add secret"

**Add 2nd Secret:**
- Click "New repository secret"
- Name: `SENDGRID_FROM_EMAIL`
- Value: `monitor@seagermarine.com`
- Click "Add secret"

**Add 3rd Secret:**
- Click "New repository secret"
- Name: `SENDGRID_TO_EMAIL`
- Value: Your email (from Step 1.3)
- Click "Add secret"

### Step 2.4: Enable Automation
1. Go to your repo
2. Click **Actions** tab (top menu)
3. See "Seager Monitor - Automated Competitor Tracking"
4. Click "Enable workflow" (if button appears)

---

## PHASE 3: VERIFY (3 minutes)

### Check It's Running
1. Go to repo → **Actions** tab
2. You should see a run appearing
3. Yellow dot = running
4. Green checkmark = success

### Check Your Email
1. Wait a few minutes
2. Check inbox for email from `Seager Marine Monitor`
3. If no email, check **spam folder**
4. May take up to 2 hours if no changes detected

### What to Expect
- Emails every 2 hours
- Only if changes detected (added boats, removed boats, price changes)
- Subject: "Seager Marine Monitor - [Competitor Name] Update"

---

## That's It! 🎉

Your monitor is now running 24/7:
- ✅ Checks all 12 competitors every 2 hours
- ✅ Sends email when changes detected
- ✅ Saves history to GitHub
- ✅ Zero cost, zero maintenance
- ✅ Runs forever automatically

---

## Example Email (What You'll Receive)

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

## If Something Goes Wrong

### "No email after 2 hours"
- Check spam folder
- Verify all 3 secrets are correct
- Check Actions tab for errors
- Click failed run to see logs

### "Actions shows error"
- Check your SendGrid credentials
- Verify all 3 secrets match what you copied
- Try running manually: Actions tab → "Run workflow"

### "Email looks wrong"
- Refresh inbox
- Wait a bit longer
- Check spam

---

## Daily Use

**Day 1:** Setup complete ✅

**Day 2+:**
- Check email for notifications
- Glance at Actions tab occasionally
- That's it!

---

## More Details

For more information, see:
- **SENDGRID_SETUP.md** - Detailed SendGrid guide
- **GITHUB_SENDGRID_SETUP.md** - Detailed GitHub guide
- **README.md** - Full project documentation

---

## You're Done! 🚀

Monitor is running. Check your email!

Questions? Check the detailed guides or GitHub Actions logs.

Happy monitoring! ⚓
