# SendGrid Setup Guide

Complete guide to set up email notifications using SendGrid's free tier.

---

## What is SendGrid?

SendGrid is an **email delivery service**. It:
- Sends emails on your behalf
- Has a free tier: 100 emails/day
- Doesn't require a mail server
- Works perfectly with GitHub Actions

Your monitor will send emails every 2 hours (if changes detected). That's ~12 emails/day = well within the free tier.

---

## Step 1: Create SendGrid Account (2 minutes)

1. Go to **sendgrid.com**
2. Click "Sign Up"
3. Enter:
   - First Name
   - Last Name
   - Email address (yours, where you want notifications)
   - Password
4. Click "Create Account"
5. Confirm your email
6. Login to SendGrid

---

## Step 2: Get Your API Key (3 minutes)

This is what GitHub uses to send emails.

### In SendGrid Dashboard:

1. Look at the left sidebar
2. Click **"Settings"** → **"API Keys"**
3. Click **"Create API Key"** (button in top right)
4. Choose:
   - Name: `GitHub Monitor` (or anything)
   - API Key Type: **"Full Access"** (simplest)
   - Click "Create & Confirm"

5. **Copy your API Key**
   - You'll see a long string like: `SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - Click "Copy" or select and copy it manually
   - **Save this somewhere safe** - you'll need it soon

⚠️ **Important:** SendGrid will only show this key once. Save it now!

---

## Step 3: Verify Your Email (5 minutes)

SendGrid requires you to verify that you own the email address you'll send FROM.

### In SendGrid Dashboard:

1. Left sidebar: Click **"Settings"** → **"Sender Authentication"**
2. Click **"Verify a Sender"**
3. Enter:
   - From Email Address: `monitor@seagermarine.com` (or your domain)
   - From Name: `Seager Marine Monitor`
   - Reply To Address: Your actual email
   - Company Address: Your address
4. Click "Create"

### SendGrid sends you a verification email:

1. **Check your email inbox** (the "Reply To" address you provided)
2. Look for email from SendGrid
3. Click the verification link in the email
4. Done! Sender is verified.

---

## Step 4: Note Your Email Address (1 minute)

This is where notifications will be SENT TO.

- **Where notifications go:** Your actual email address (where you want to receive them)
- **Example:** `you@seagermarine.com`

Write this down - you'll need it.

---

## What You Now Have

✅ SendGrid API Key: `SG.xxxxxxxxxxxx...`  
✅ From Email (verified): `monitor@seagermarine.com`  
✅ To Email (where notifications go): `you@seagermarine.com`  

These three things are what GitHub will use to send emails every 2 hours.

---

## Next: Add to GitHub

Follow the GitHub setup guide, but in the "Add Secrets" step, you'll add these 3 values instead of Discord webhook.

---

## Troubleshooting SendGrid

### "Can't find API Keys section"
- Login to SendGrid
- Make sure you're in main dashboard
- Left sidebar → Settings → API Keys

### "Email not verified"
- Check spam folder
- Wait a few minutes and resend verification
- Click link in verification email

### "What's the difference between From and To email?"
- **From Email:** Appears as sender (e.g., `monitor@seagermarine.com`)
- **To Email:** Where you receive them (e.g., `you@seagermarine.com`)

### "Can I send to multiple email addresses?"
- Not in free tier, but you can set up a forwarding rule in your email client
- Or upgrade to SendGrid's paid tier (optional)

### "Why do I need 'Full Access' for API Key?"
- Simplest option
- More restricted options available but more complex
- Full Access is fine for this use case

---

## Email Format Example

Here's what notifications look like:

```
From: Seager Marine Monitor <monitor@seagermarine.com>
Subject: Seager Marine Monitor - Marks Leisure Time Marine Update

⚓ Marks Leisure Time Marine - Inventory Update

Update Time: 12/20/2024, 2:30 PM

✨ Added (2)
• Sea Ray 210 Sundancer - $45,000
• Bayliner Cruiser 220 - $38,500

💰 Price Changes (1)
• 25ft Day Cruiser: $52,000 → $51,500

🔴 Sold (1)
• Thousand Islands 22

This is an automated notification from Seager Marine Competitor Monitor
```

---

## Cost & Limits

| Item | Amount |
|------|--------|
| Free Emails/Day | 100 |
| Monitor Runs/Day | 12 (every 2 hours) |
| Emails Sent/Day | ~12 (only when changes) |
| Cost | $0 |
| **Your Usage** | **~12% of free tier** ✅ |

You're well within the free tier. No charges ever (unless you exceed 100/day).

---

## Security Notes

⚠️ Keep your API Key secret:
- Don't post online
- Don't email it to people
- GitHub will keep it safe in Secrets

✅ GitHub "Secrets" feature:
- Encrypts your API key
- Only visible to GitHub Actions
- You can't see it again (save it now!)

---

## Ready for GitHub Setup?

You now have everything needed:

✅ SendGrid API Key  
✅ From Email (verified)  
✅ To Email (where notifications go)  

Next step: Follow GitHub Actions setup and add these 3 values as secrets.

---

## Support

**SendGrid help:** support.sendgrid.com  
**Common issues:** See "Troubleshooting" above  
**GitHub secrets help:** docs.github.com/en/actions/security-guides/using-secrets-in-github-actions

---

Good to go! 🚀
