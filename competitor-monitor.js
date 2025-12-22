const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Mark's Leisure Time Marine configuration
const MARKS_CONFIG = {
  name: "Mark's Leisure Time Marine",
  url: 'https://www.marksleisuretimemarine.com/new-boats-for-sale-conesus-canandaigua-new-york--inventory?condition=new&condition=pre-owned&pg=1&sz=50',
  selectors: {
    parentContainer: 'div.v7list-results',
    boatCard: 'article.v7list-vehicle',
    title: 'h3.v7list-vehicle__heading',
    link: 'a.vehicle-heading__link',
    price: 'span.vehicle-price.vehicle-price--current',
    savings: 'span.vehicle-price.vehicle-price--savings',
    status: 'span.vehicle-image__overlay-content span.vehicle-image__overlay-text'
  }
};

// Database setup
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'inventory.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize database if it doesn't exist
function initDatabase() {
  if (!fs.existsSync(DB_FILE)) {
    const initialData = {
      lastUpdated: null,
      marks: []
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
  }
}

// Get database
function getDatabase() {
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (error) {
    console.error('Error reading database:', error.message);
    return { lastUpdated: null, marks: [] };
  }
}

// Save database
function saveDatabase(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// Create unique boat ID
function getBoatId(title, price) {
  return `${title}-${price}`.replace(/[^a-zA-Z0-9-]/g, '').toLowerCase();
}

// Parse individual boat card
function parseBoat($, boatElement) {
  try {
    const $boat = cheerio.load(boatElement);
    const $article = $boat('article.v7list-vehicle');
    
    const title = $article.find('h3.v7list-vehicle__heading').text().trim();
    const linkHref = $article.find('a.vehicle-heading__link').attr('href');
    const link = linkHref ? (linkHref.startsWith('http') ? linkHref : 'https://www.marksleisuretimemarine.com' + linkHref) : null;
    const currentPrice = $article.find('span.vehicle-price.vehicle-price--current').text().trim();
    const savings = $article.find('span.vehicle-price.vehicle-price--savings').text().trim();
    const status = $article.find('span.vehicle-image__overlay-content span.vehicle-image__overlay-text').text().trim();
    
    return {
      id: getBoatId(title, currentPrice),
      title,
      link,
      currentPrice,
      savings,
      status: status || 'In Stock',
      fetchedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error parsing boat:', error.message);
    return null;
  }
}

// Fetch Mark's boats
async function fetchMarksBoats() {
  try {
    console.log(`Fetching ${MARKS_CONFIG.name}...`);
    const response = await axios.get(MARKS_CONFIG.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const html = response.data;
    const $ = cheerio.load(html);
    
    const boats = [];
    const $container = $(MARKS_CONFIG.selectors.parentContainer);
    
    if ($container.length === 0) {
      console.warn(`⚠️ Parent container not found`);
      return boats;
    }
    
    $container.find(MARKS_CONFIG.selectors.boatCard).each((idx, boatEl) => {
      const boat = parseBoat($, boatEl);
      if (boat && boat.title) {
        boats.push(boat);
      }
    });
    
    console.log(`✅ Found ${boats.length} boats`);
    return boats;
    
  } catch (error) {
    console.error(`❌ Error fetching boats:`, error.message);
    return [];
  }
}

// Detect changes between old and new data
function detectChanges(oldBoats, newBoats) {
  const changes = {
    added: [],
    removed: [],
    priceChanges: []
  };

  if (!oldBoats || oldBoats.length === 0) {
    changes.added = newBoats;
    return changes;
  }

  const oldMap = new Map(oldBoats.map(b => [b.id, b]));
  const newMap = new Map(newBoats.map(b => [b.id, b]));

  // Find added boats
  newBoats.forEach(boat => {
    if (!oldMap.has(boat.id)) {
      changes.added.push(boat);
    }
  });

  // Find removed boats
  oldBoats.forEach(boat => {
    if (!newMap.has(boat.id)) {
      changes.removed.push(boat);
    }
  });

  // Find price changes
  newBoats.forEach(newBoat => {
    const oldBoat = oldMap.get(newBoat.id);
    if (oldBoat && oldBoat.currentPrice !== newBoat.currentPrice) {
      changes.priceChanges.push({
        title: newBoat.title,
        oldPrice: oldBoat.currentPrice,
        newPrice: newBoat.currentPrice,
        link: newBoat.link
      });
    }
  });

  return changes;
}

// Build HTML email
function buildEmailHTML(changes) {
  let html = `
    <h2 style="color: #0066cc;">🚤 ${MARKS_CONFIG.name}</h2>
    <p style="font-size: 14px; color: #666;">Update detected at ${new Date().toLocaleString()}</p>
  `;

  if (changes.added.length > 0) {
    html += `<h3 style="color: #27ae60;">✨ Added (${changes.added.length})</h3>`;
    changes.added.forEach(boat => {
      html += `
        <div style="margin: 12px 0; padding: 12px; background: white; border-left: 4px solid #27ae60; border-radius: 4px;">
          <p style="margin: 5px 0; font-weight: bold;">
            <a href="${boat.link || '#'}" style="color: #0066cc; text-decoration: none; font-size: 15px;">
              ${boat.title}
            </a>
          </p>
          <p style="margin: 5px 0; font-size: 13px;">
            <strong>Status:</strong> ${boat.status}
          </p>
          <p style="margin: 5px 0; font-size: 13px;">
            <strong>Price:</strong> ${boat.currentPrice}
            ${boat.savings ? ` | <strong>Savings:</strong> ${boat.savings}` : ''}
          </p>
        </div>
      `;
    });
  }

  if (changes.removed.length > 0) {
    html += `<h3 style="color: #e74c3c;">❌ Removed (${changes.removed.length})</h3>`;
    changes.removed.forEach(boat => {
      html += `
        <div style="margin: 12px 0; padding: 12px; background: white; border-left: 4px solid #e74c3c; border-radius: 4px;">
          <p style="margin: 5px 0; font-weight: bold;">${boat.title}</p>
          <p style="margin: 5px 0; font-size: 13px;">${boat.currentPrice}</p>
        </div>
      `;
    });
  }

  if (changes.priceChanges.length > 0) {
    html += `<h3 style="color: #f39c12;">💰 Price Changes (${changes.priceChanges.length})</h3>`;
    changes.priceChanges.forEach(change => {
      html += `
        <div style="margin: 12px 0; padding: 12px; background: white; border-left: 4px solid #f39c12; border-radius: 4px;">
          <p style="margin: 5px 0; font-weight: bold;">
            <a href="${change.link || '#'}" style="color: #0066cc; text-decoration: none;">
              ${change.title}
            </a>
          </p>
          <p style="margin: 5px 0; font-size: 13px;">
            <strong style="color: #e74c3c;">${change.oldPrice}</strong> → <strong style="color: #27ae60;">${change.newPrice}</strong>
          </p>
        </div>
      `;
    });
  }

  return html;
}

// Send email via SendGrid
async function sendEmail(htmlContent) {
  const sendgridApiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.SENDGRID_FROM_EMAIL;
  const toEmail = process.env.SENDGRID_TO_EMAIL;
  const toEmail2 = process.env.SENDGRID_TO_EMAIL_2;

  if (!sendgridApiKey || !fromEmail || !toEmail) {
    console.warn('⚠️ SendGrid credentials not configured, skipping email');
    return;
  }

  const emailPayload = {
    personalizations: [
      {
        to: toEmail2 ? [{ email: toEmail }, { email: toEmail2 }] : [{ email: toEmail }],
        subject: `🚤 Mark's Leisure Time Marine - Inventory Update`
      }
    ],
    from: { email: fromEmail },
    content: [
      {
        type: 'text/html',
        value: htmlContent
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
    console.log('✅ Email sent successfully');
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
  }
}

// Main monitoring function
async function monitor() {
  console.log('\n📊 Starting Mark\'s Leisure Time Marine monitoring...');
  initDatabase();

  const db = getDatabase();
  const oldBoats = db.marks || [];
  const newBoats = await fetchMarksBoats();

  // Detect changes
  const changes = detectChanges(oldBoats, newBoats);
  const hasChanges = changes.added.length > 0 || changes.removed.length > 0 || changes.priceChanges.length > 0;

  if (hasChanges) {
    console.log(`📢 Changes detected:`);
    console.log(`   ✨ Added: ${changes.added.length}`);
    console.log(`   ❌ Removed: ${changes.removed.length}`);
    console.log(`   💰 Price Changes: ${changes.priceChanges.length}`);
    
    const emailHTML = buildEmailHTML(changes);
    await sendEmail(emailHTML);
  } else {
    console.log('✅ No changes detected - skipping email');
  }

  // Save current boats to database
  db.marks = newBoats;
  db.lastUpdated = new Date().toISOString();
  saveDatabase(db);

  console.log('✅ Monitor run completed');
}

// Run
monitor().catch(console.error);
