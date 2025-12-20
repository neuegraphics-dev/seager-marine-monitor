# ⚓ Seager Marine Competitor Monitor

Professional competitor website monitoring tool for Seager Marine in Canandaigua, NY.

**Monitor 12 competitor marinas for:**
- ✨ New boats added
- ❌ Boats removed  
- 🔴 Boats marked as sold
- ⏳ Boats marked as pending
- 💰 Price changes

---

## Features

✅ **Automated Monitoring** - Run every 2 hours on a schedule  
✅ **Web Dashboard** - Beautiful, mobile-friendly interface  
✅ **Discord/Slack Notifications** - Get instant alerts  
✅ **Price Tracking** - Track exact price changes  
✅ **Status Monitoring** - See which boats are sold/pending  
✅ **Zero Database** - Uses JSON storage (no server needed)  
✅ **Cloud Deployable** - Deploy to Vercel, Render, or GitHub Actions  
✅ **No Email Required** - Works without server email access  

---

## Quick Start (5 minutes)

### Prerequisites
- Node.js 16+ ([download](https://nodejs.org))
- Discord server (free)
- Text editor (VS Code recommended)

### Installation

```bash
# 1. Clone or extract the project
cd seager-marine-monitor

# 2. Install dependencies
npm install

# 3. Get Discord webhook URL
# - Go to Discord server > Channel Settings > Webhooks > New Webhook
# - Copy the URL

# 4. Create .env file
cp .env.example .env
# Edit .env and add your Discord webhook URL

# 5. Run initial scan
npm run monitor

# 6. Start dashboard
npm start

# Visit: http://localhost:3000
```

👉 **See QUICKSTART.md for detailed walkthrough**

---

## Monitoring All 12 Competitors

The tool monitors these marinas:

1. **Marks Leisure Time Marine** - marksleisuretimemarine.com
2. **Smith Boys** - smithboys.com
3. **Sutters Marina** - suttersmarina.com
4. **FLX Marine** - flxmarine.com
5. **Canandaigua Boat Works** - canandaguiaboatworks.com
6. **Morgan Marine** - morganmarine.net
7. **Anchor Marine** - anchormarine.com
8. **Keuka Watersports** - keukawatersports.com
9. **Oneida Lake Marina** - oneidalakemarina.com
10. **Bryce Marine** - brycemarine.com
11. **McMillan Marine** - mcmillanmarine.com
12. **German Brothers** - germanbrothers.com

---

## How It Works

### Monitor Script
- Fetches HTML from all 12 competitor websites
- Extracts boat listings, prices, and status
- Compares with previous scan to detect changes
- Sends Discord notifications for any changes
- Stores data in `data/inventory.json`

### Dashboard
- Real-time view of all competitor changes
- Click any competitor to see details
- View complete boat inventory
- See price change history
- Mobile-friendly responsive design

### Notifications
- Discord webhook sends rich notifications
- Shows additions, removals, sold boats, pending boats, price changes
- Optional Slack or email support

---

## Setup & Deployment

### Local Setup
See **QUICKSTART.md** for 5-minute setup

### Cloud Deployment (Recommended)

**GitHub Actions (Free & Easiest)**
- Automatically runs monitor every 2 hours
- No server to maintain
- Results stored in Git
- Setup: Push code to GitHub + add secret

**Vercel (Free tier)**
- Hosted dashboard
- Cron jobs for monitoring
- Visit vercel.com → connect GitHub repo

**Render.com (Free tier)**
- Simple deployment
- Good for always-on server
- Build & deploy automatically

See **SETUP.md** for detailed deployment instructions

---

## Dashboard Usage

### Summary Cards
- Total competitors monitoring
- Count of added/removed/sold/pending boats
- Price change count

### Competitor Cards
- Click to expand/collapse
- See recent changes with counts
- View full inventory table
- Mobile-friendly layout

### Real-time Updates
- Auto-refreshes every 5 minutes
- Manual refresh button
- Run monitor button for immediate scan

---

## Scheduling Options

### Option 1: Manual
```bash
npm run monitor
```
Run whenever you want to check for updates.

### Option 2: Cron Job (Mac/Linux)
```bash
crontab -e
# Add: 0 */2 * * * cd /path/to/monitor && npm run monitor
```
Runs automatically every 2 hours.

### Option 3: Windows Task Scheduler
- Create task to run `npm run monitor`
- Set to repeat every 2 hours
- Set to wake computer if sleeping

### Option 4: Cloud Automation (Best)
GitHub Actions runs for free automatically every 2 hours.
No servers, no cron, no maintenance.

See SETUP.md → GitHub Actions section

---

## Configuration

### Add/Remove Competitors
Edit `competitor-monitor.js`:
```javascript
const COMPETITORS = [
  { name: 'Marina Name', url: 'marinaswebsite.com' },
  // Add more here
];
```

### Change Monitor Frequency
Edit GitHub Actions workflow or cron job timing.

### Customize Notifications
Edit notification templates in `competitor-monitor.js` and `server.js`

### Email Notifications (Optional)
1. Sign up for SendGrid (free tier: 100/day)
2. Add credentials to `.env`
3. Edit `server.js` to use SendGrid instead of Discord

---

## File Structure

```
seager-marine-monitor/
├── competitor-monitor.js      # Main scraper script
├── server.js                  # Express API + dashboard server
├── package.json               # Dependencies
├── .env.example               # Configuration template
├── QUICKSTART.md              # 5-minute setup guide
├── SETUP.md                   # Detailed setup & deployment
├── public/
│   └── index.html            # Dashboard (no build needed)
├── .github/workflows/
│   └── monitor.yml           # GitHub Actions automation
└── data/                      # Generated automatically
    ├── inventory.json        # Current state
    └── results-*.json        # Scan history
```

---

## API Endpoints

```
GET  /api/inventory              # Get current data
GET  /api/competitor/:name       # Get specific competitor
POST /api/monitor/run            # Trigger manual scan
GET  /api/health                 # Health check
```

---

## Troubleshooting

### "Cannot find module" error
```bash
npm install
```

### Dashboard won't load
- Confirm you ran `npm run monitor` first
- Check `npm start` is running (no errors in console)
- Visit http://localhost:3000

### No Discord notifications
- Check webhook URL in `.env` is correct
- Verify Discord webhook channel still exists
- Run manual scan: `npm run monitor`

### Websites not scraping correctly
Some sites use JavaScript to load content. Solutions:
1. Update CSS selectors in `competitor-monitor.js`
2. Increase timeout values
3. Check website structure changed

See SETUP.md → Troubleshooting for more help

---

## Performance & Optimization

- **Speed**: Scans all 12 sites in ~30 seconds
- **Data**: Stores as JSON (no database needed)
- **Storage**: ~1-5MB per month of history
- **Memory**: Lightweight, runs on any hardware

---

## Security Notes

⚠️ **Important**
- Never commit `.env` file to GitHub
- Keep Discord webhook URL private
- Add `.env` to `.gitignore` (already done)
- Use environment variables for sensitive data
- Consider IP whitelisting for production

---

## Support & Help

1. **Quick issues**: See Troubleshooting above
2. **Setup help**: Read QUICKSTART.md (5-minute walkthrough)
3. **Detailed guide**: Read SETUP.md (comprehensive reference)
4. **Code issues**: Check GitHub for updates/issues

---

## Next Steps

1. ✅ Install Node.js
2. ✅ Set up Discord webhook
3. ✅ Run Quick Start guide
4. ✅ Set up automation (GitHub Actions recommended)
5. ✅ Monitor your competitors!

---

## License

MIT - Use for Seager Marine purposes

---

## Version History

**v1.0.0** - Initial release
- Monitor 12 competitor sites
- Web dashboard
- Discord notifications
- GitHub Actions automation

---

## Questions?

If something isn't working:
1. Check QUICKSTART.md (5-minute guide)
2. Check SETUP.md (detailed reference)
3. Run `npm run monitor` to test
4. Check browser console (F12) for errors

Happy monitoring! 🎣⚓
