const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

// Competitor websites to monitor
const COMPETITORS = [
  { name: 'Marks Leisure Time Marine', url: 'marksleisuretimemarine.com' },
  { name: 'Smith Boys', url: 'smithboys.com' },
  { name: 'Sutters Marina', url: 'suttersmarina.com' },
  { name: 'FLX Marine', url: 'flxmarine.com' },
  { name: 'Canandaigua Boat Works', url: 'canandaguiaboatworks.com' },
  { name: 'Morgan Marine', url: 'morganmarine.net' },
  { name: 'Anchor Marine', url: 'anchormarine.com' },
  { name: 'Keuka Watersports', url: 'keukawatersports.com' },
  { name: 'Oneida Lake Marina', url: 'oneidalakemarina.com' },
  { name: 'Bryce Marine', url: 'brycemarine.com' },
  { name: 'McMillan Marine', url: 'mcmillanmarine.com' },
  { name: 'German Brothers', url: 'germanbrothers.com' }
];

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'inventory.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize database
function initDatabase() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({
      lastUpdated: null,
      competitors: {}
    }, null, 2));
  }
}

function getDatabase() {
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function saveDatabase(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// Parse boat listings from HTML
async function parseBoats(html, competitorName) {
  const $ = cheerio.load(html);
  const boats = [];

  // Generic selectors for common boat listing patterns
  const boatSelectors = [
    '.boat-listing',
    '.inventory-item',
    '.boat-item',
    '[class*="boat"]',
    '[data-boat]',
    '.product-item',
    '.listing'
  ];

  for (const selector of boatSelectors) {
    $(selector).each((i, el) => {
      const title = $(el).find('h2, h3, .title, [class*="title"]').text().trim();
      const price = $(el).find('.price, [class*="price"]').text().trim();
      const status = $(el).find('.status, [class*="status"]').text().toLowerCase();
      const link = $(el).find('a').attr('href') || '';

      if (title) {
        boats.push({
          id: `${competitorName}-${title}-${price}`.replace(/[^a-zA-Z0-9]/g, ''),
          title,
          price,
          status: status || 'available',
          link: link.startsWith('http') ? link : `https://${COMPETITORS.find(c => c.name === competitorName).url}${link}`,
          soldStatus: determineSoldStatus(title, status, html),
          fetchedAt: new Date().toISOString()
        });
      }
    });

    if (boats.length > 0) break;
  }

  return boats;
}

// Determine if boat is sold, pending, or available
function determineSoldStatus(title, status, html) {
  const text = `${title} ${status}`.toLowerCase();
  
  if (text.includes('sold')) return 'sold';
  if (text.includes('pending') || text.includes('under contract')) return 'pending';
  if (text.includes('available') || text.includes('for sale')) return 'available';
  
  return 'available';
}

// Fetch and parse a competitor website
async function fetchCompetitor(competitor) {
  try {
    const response = await axios.get(`https://${competitor.url}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });

    const boats = await parseBoats(response.data, competitor.name);
    
    return {
      success: true,
      competitor: competitor.name,
      url: competitor.url,
      boats,
      fetchedAt: new Date().toISOString()
    };
  } catch (error) {
    return {
      success: false,
      competitor: competitor.name,
      url: competitor.url,
      error: error.message,
      fetchedAt: new Date().toISOString()
    };
  }
}

// Compare old and new data to detect changes
function detectChanges(oldData, newData) {
  const changes = {
    added: [],
    removed: [],
    sold: [],
    pending: [],
    priceChanges: []
  };

  if (!oldData) {
    changes.added = newData;
    return changes;
  }

  const oldMap = new Map(oldData.map(b => [b.id, b]));
  const newMap = new Map(newData.map(b => [b.id, b]));

  // Find added boats
  newData.forEach(boat => {
    if (!oldMap.has(boat.id)) {
      changes.added.push(boat);
    }
  });

  // Find removed boats
  oldData.forEach(boat => {
    if (!newMap.has(boat.id)) {
      changes.removed.push(boat);
    }
  });

  // Find status changes and price changes
  newData.forEach(newBoat => {
    const oldBoat = oldMap.get(newBoat.id);
    if (oldBoat) {
      if (oldBoat.soldStatus !== newBoat.soldStatus) {
        if (newBoat.soldStatus === 'sold') {
          changes.sold.push(newBoat);
        } else if (newBoat.soldStatus === 'pending') {
          changes.pending.push(newBoat);
        }
      }

      // Compare prices (remove currency symbols for comparison)
      const oldPrice = oldBoat.price.replace(/[^\d.]/g, '');
      const newPrice = newBoat.price.replace(/[^\d.]/g, '');
      
      if (oldPrice && newPrice && oldPrice !== newPrice) {
        changes.priceChanges.push({
          boat: newBoat,
          oldPrice: oldBoat.price,
          newPrice: newBoat.price
        });
      }
    }
  });

  return changes;
}

// Send notification via SendGrid email
async function sendEmailNotification(changes, competitor) {
  const sendgridApiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.SENDGRID_FROM_EMAIL;
  const toEmail = process.env.SENDGRID_TO_EMAIL;
  const toEmail2 = process.env.SENDGRID_TO_EMAIL_2;

  if (!sendgridApiKey || !fromEmail || !toEmail) {
    console.warn('SendGrid credentials not configured, skipping email notification');
    return;
  }

  // Build email content
  let emailContent = `<h2>⚓ ${competitor} - Inventory Update</h2>`;
  emailContent += `<p><strong>Update Time:</strong> ${new Date().toLocaleString()}</p>`;

  if (changes.added.length > 0) {
    emailContent += `<h3>✨ Added (${changes.added.length})</h3>`;
    emailContent += '<ul>';
    changes.added.slice(0, 5).forEach(b => {
      emailContent += `<li>${b.title} - ${b.price}</li>`;
    });
    if (changes.added.length > 5) {
      emailContent += `<li>... and ${changes.added.length - 5} more</li>`;
    }
    emailContent += '</ul>';
  }

  if (changes.removed.length > 0) {
    emailContent += `<h3>❌ Removed (${changes.removed.length})</h3>`;
    emailContent += '<ul>';
    changes.removed.slice(0, 5).forEach(b => {
      emailContent += `<li>${b.title}</li>`;
    });
    if (changes.removed.length > 5) {
      emailContent += `<li>... and ${changes.removed.length - 5} more</li>`;
    }
    emailContent += '</ul>';
  }

  if (changes.sold.length > 0) {
    emailContent += `<h3>🔴 Sold (${changes.sold.length})</h3>`;
    emailContent += '<ul>';
    changes.sold.slice(0, 5).forEach(b => {
      emailContent += `<li>${b.title}</li>`;
    });
    if (changes.sold.length > 5) {
      emailContent += `<li>... and ${changes.sold.length - 5} more</li>`;
    }
    emailContent += '</ul>';
  }

  if (changes.pending.length > 0) {
    emailContent += `<h3>⏳ Pending (${changes.pending.length})</h3>`;
    emailContent += '<ul>';
    changes.pending.slice(0, 5).forEach(b => {
      emailContent += `<li>${b.title}</li>`;
    });
    if (changes.pending.length > 5) {
      emailContent += `<li>... and ${changes.pending.length - 5} more</li>`;
    }
    emailContent += '</ul>';
  }

  if (changes.priceChanges.length > 0) {
    emailContent += `<h3>💰 Price Changes (${changes.priceChanges.length})</h3>`;
    emailContent += '<ul>';
    changes.priceChanges.slice(0, 5).forEach(c => {
      emailContent += `<li>${c.boat.title}: ${c.oldPrice} → ${c.newPrice}</li>`;
    });
    if (changes.priceChanges.length > 5) {
      emailContent += `<li>... and ${changes.priceChanges.length - 5} more</li>`;
    }
    emailContent += '</ul>';
  }

  emailContent += '<hr><p><small>This is an automated notification from Seager Marine Competitor Monitor</small></p>';

  const emailPayload = {
    personalizations: [
      {
        to: [{ email: toEmail }, { email: toEmail2 }],
        subject: `Seager Marine Monitor - ${competitor} Update`
      }
    ],
    from: { email: fromEmail },
    content: [
      {
        type: 'text/html',
        value: emailContent
      }
    ]
  };

  try {
    await axios.post('https://api.sendgrid.com/v3/mail/send', emailPayload, {
      headers: {
        'Authorization': `Bearer ${sendgridApiKey}`,
        'Content-Type': 'application/json'
      }
    });
    console.log(`📧 Email notification sent for ${competitor}`);
  } catch (error) {
    console.error(`📧 Email notification failed for ${competitor}:`, error.message);
  }
}

// Main monitoring function
async function runMonitor() {
  console.log('🚀 Starting competitor monitoring...');
  initDatabase();

  const db = getDatabase();
  const results = {
    timestamp: new Date().toISOString(),
    competitors: {}
  };

  for (const competitor of COMPETITORS) {
    console.log(`📍 Fetching ${competitor.name}...`);
    const fetchResult = await fetchCompetitor(competitor);

    if (fetchResult.success) {
      const oldData = db.competitors[competitor.name];
      const changes = detectChanges(oldData, fetchResult.boats);

      results.competitors[competitor.name] = {
        success: true,
        boats: fetchResult.boats,
        changes,
        fetchedAt: fetchResult.fetchedAt
      };

      // Send notification if there are changes
      if (Object.values(changes).some(arr => arr.length > 0)) {
        console.log(`📢 Changes detected for ${competitor.name}`);
        await sendEmailNotification(changes, competitor.name);
      }

      db.competitors[competitor.name] = fetchResult.boats;
    } else {
      console.error(`❌ Failed to fetch ${competitor.name}: ${fetchResult.error}`);
      results.competitors[competitor.name] = {
        success: false,
        error: fetchResult.error
      };
    }

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  db.lastUpdated = new Date().toISOString();
  saveDatabase(db);

  // Save results
  fs.writeFileSync(path.join(DATA_DIR, `results-${Date.now()}.json`), JSON.stringify(results, null, 2));
  console.log('✅ Monitor run completed');

  return results;
}

// Export for use in other modules
module.exports = {
  runMonitor,
  getDatabase,
  COMPETITORS
};

// Run if executed directly
if (require.main === module) {
  runMonitor().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
  });
}
