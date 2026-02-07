const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// ============================================
// CONFIGURATION
// ============================================
// Mark's Leisure Time Marine configuration
const MARKS_CONFIG = {
  name: "Mark's Leisure Time Marine",
  url: 'https://www.marksleisuretimemarine.com/new-boats-for-sale-conesus-canandaigua-new-york--inventory?condition=new&condition=pre-owned&make=avalon&make=lund&make=nautique&pg=1&sz=50',
  selectors: {
    parentContainer: 'div.v7list-results',
    boatCard: 'article.v7list-vehicle',
    title: 'h3.v7list-vehicle__heading',
    link: 'a.vehicle-heading__link',
    price: 'span.vehicle-price.vehicle-price--current',
    savings: 'span.vehicle-price.vehicle-price--savings',
    status: 'span.vehicle-image__overlay-content span.vehicle-image__overlay-text',
    // New selectors for pagination detection
    totalResults: 'div.v7list-subheader__result-text span'
  }
};

// ============================================
// DATABASE SETUP
// ============================================
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'inventory.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * Initialize database if it doesn't exist
 * Creates a fresh inventory.json with empty structure
 */
function initDatabase() {
  if (!fs.existsSync(DB_FILE)) {
    const initialData = {
      lastUpdated: null,
      marks: []
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
  }
}

/**
 * Get database contents
 * Returns the current inventory data from inventory.json
 */
function getDatabase() {
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (error) {
    console.error('Error reading database:', error.message);
    return { lastUpdated: null, marks: [] };
  }
}

/**
 * Save database contents
 * Writes the updated inventory data back to inventory.json
 * This completely REPLACES the file content - no appending
 */
function saveDatabase(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// ============================================
// BOAT PARSING FUNCTIONS
// ============================================

/**
 * Create unique boat ID
 * Combines title and price to create a unique identifier
 * Example: "2024 Lund 1650 Angler - $25,999" becomes "2024lund1650angler25999"
 */
function getBoatId(title, price) {
  return `${title}-${price}`.replace(/[^a-zA-Z0-9-]/g, '').toLowerCase();
}

/**
 * Parse individual boat card from HTML
 * Extracts all boat details from a single article element
 * Returns a boat object with id, title, link, price, etc.
 */
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
    const vehicleImage = $article.find('.vehicle__image').attr('data-dsp-small-image');
    const vehicleImageHref = vehicleImage ? (vehicleImage.startsWith('http') ? vehicleImage : 'https:' + vehicleImage) : null;
    
    return {
      id: getBoatId(title, currentPrice),
      title,
      link,
      currentPrice,
      savings,
      status: status || 'In Stock',
      vehicleImageHref,  // ✅ ADD THIS LINE
      fetchedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error parsing boat:', error.message);
    return null;
  }
}

/**
 * Extract total results count from page
 * Looks for "Showing 1-50 of 110 results" and extracts the 110
 * Returns null if not found
 */
function getTotalResults($) {
  try {
    // Find the div with class v7list-subheader__result-text
    const resultText = $('div.v7list-subheader__result-text');
    
    // Get all span elements inside it
    const spans = resultText.find('span');
    
    // The second span contains the total count
    // Example: <span>101-110</span> of <span>110</span>
    if (spans.length >= 2) {
      const totalText = $(spans[1]).text().trim();
      const total = parseInt(totalText, 10);
      
      if (!isNaN(total)) {
        console.log(`📊 Total results found: ${total}`);
        return total;
      }
    }
    
    console.warn('⚠️ Could not parse total results from page');
    return null;
  } catch (error) {
    console.error('Error extracting total results:', error.message);
    return null;
  }
}

// ============================================
// PAGE FETCHING FUNCTIONS
// ============================================

/**
 * Fetch a single page of Mark's boats
 * Makes HTTP request to specified page number
 * Returns array of boat objects found on that page
 */
async function fetchPage(pageNum) {
  try {
    const url = `https://www.marksleisuretimemarine.com/new-boats-for-sale-conesus-canandaigua-new-york--inventory?condition=new&condition=pre-owned&pg=${pageNum}&sz=50`;
    
    console.log(`Fetching page ${pageNum}...`);
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const html = response.data;
    const $ = cheerio.load(html);
    
    const boats = [];
    const $container = $(MARKS_CONFIG.selectors.parentContainer);
    
    if ($container.length === 0) {
      console.warn(`⚠️ Parent container not found on page ${pageNum}`);
      return { boats: [], $ };
    }
    
    $container.find(MARKS_CONFIG.selectors.boatCard).each((idx, boatEl) => {
      const boat = parseBoat($, boatEl);
      if (boat && boat.title) {
        boats.push(boat);
      }
    });
    
    console.log(`✅ Found ${boats.length} boats on page ${pageNum}`);
    
    // Return both boats and the cheerio object for pagination info extraction
    return { boats, $ };
    
  } catch (error) {
    console.error(`❌ Error fetching page ${pageNum}:`, error.message);
    return { boats: [], $: null };
  }
}

/**
 * Fetch all pages of Mark's boats with multiple safety mechanisms
 * 
 * SAFETY MECHANISM #1: Calculate exact pages needed from total results
 * SAFETY MECHANISM #2: Track seen boat IDs to prevent duplicates
 * SAFETY MECHANISM #3: Maximum page limit of 20 as final failsafe
 * 
 * This prevents the infinite loop issue where page 7+ redirects to page 6
 */
async function fetchAllPages() {
  try {
    console.log(`\n🚤 Fetching all pages for ${MARKS_CONFIG.name}...`);
    
    // SAFETY MECHANISM #3: Hard limit - never fetch more than 20 pages
    const MAX_PAGES = 20;
    
    let allBoats = [];
    let seenBoatIds = new Set(); // SAFETY MECHANISM #2: Track IDs we've seen
    
    // ============================================
    // STEP 1: Fetch page 1 to get total results
    // ============================================
    console.log('\n📊 Fetching page 1 to determine total pages...');
    const firstPage = await fetchPage(1);
    
    if (firstPage.boats.length === 0) {
      console.warn('⚠️ No boats found on page 1');
      return [];
    }
    
    // Add page 1 boats to our collection
    firstPage.boats.forEach(boat => {
      if (!seenBoatIds.has(boat.id)) {
        allBoats.push(boat);
        seenBoatIds.add(boat.id);
      }
    });
    
    // ============================================
    // STEP 2: Calculate total pages needed
    // ============================================
    // SAFETY MECHANISM #1: Get exact page count from total results
    let totalPages = 1; // Default to 1 if we can't determine
    
    if (firstPage.$) {
      const totalResults = getTotalResults(firstPage.$);
      
      if (totalResults) {
        // Calculate pages: 110 results / 50 per page = 2.2 = 3 pages
        totalPages = Math.ceil(totalResults / 50);
        console.log(`✅ Calculated ${totalPages} total pages (${totalResults} results / 50 per page)`);
        
        // Apply hard limit
        if (totalPages > MAX_PAGES) {
          console.warn(`⚠️ Calculated pages (${totalPages}) exceeds max limit (${MAX_PAGES}), capping at ${MAX_PAGES}`);
          totalPages = MAX_PAGES;
        }
      } else {
        console.warn('⚠️ Could not determine total pages, will use fallback method');
      }
    }
    
    // ============================================
    // STEP 3: Fetch remaining pages
    // ============================================
    console.log(`\n📥 Fetching pages 2-${totalPages}...`);
    
    // If we successfully got total pages, fetch exactly that many
    if (totalPages > 1) {
      for (let pageNum = 2; pageNum <= totalPages; pageNum++) {
        const pageData = await fetchPage(pageNum);
        const pageBoats = pageData.boats;
        
        if (pageBoats.length === 0) {
          console.log(`⚠️ Page ${pageNum} returned 0 boats, stopping pagination`);
          break;
        }
        
        // SAFETY MECHANISM #2: Check for duplicates before adding
        let newBoatsCount = 0;
        let duplicatesCount = 0;
        
        pageBoats.forEach(boat => {
          if (!seenBoatIds.has(boat.id)) {
            allBoats.push(boat);
            seenBoatIds.add(boat.id);
            newBoatsCount++;
          } else {
            duplicatesCount++;
          }
        });
        
        console.log(`   📦 Page ${pageNum}: ${newBoatsCount} new boats, ${duplicatesCount} duplicates`);
        
        // If ALL boats on this page were duplicates, we've hit the redirect issue
        if (duplicatesCount === pageBoats.length && duplicatesCount > 0) {
          console.warn(`⚠️ All boats on page ${pageNum} were duplicates - stopping (likely hit redirect)`);
          break;
        }
      }
    }
    
    // ============================================
    // STEP 4: Final summary
    // ============================================
    console.log(`\n✅ Fetching complete:`);
    console.log(`   📊 Total unique boats: ${allBoats.length}`);
    console.log(`   📄 Pages fetched: ${Math.min(totalPages, MAX_PAGES)}`);
    console.log(`   🔒 Duplicate prevention: ${seenBoatIds.size} unique IDs tracked`);
    
    return allBoats;
    
  } catch (error) {
    console.error(`❌ Error fetching pages:`, error.message);
    return [];
  }
}

// ============================================
// CHANGE DETECTION FUNCTIONS
// ============================================

/**
 * Detect changes between old and new inventory data
 * Compares previous inventory with current scrape
 * Returns object with added, removed, and priceChanges arrays
 */
function detectChanges(oldBoats, newBoats) {
  const changes = {
    added: [],
    removed: [],
    priceChanges: []
  };

  // If no old data exists, everything is "new"
  if (!oldBoats || oldBoats.length === 0) {
    changes.added = newBoats;
    return changes;
  }

  // Create maps for efficient lookup by boat ID
  const oldMap = new Map(oldBoats.map(b => [b.id, b]));
  const newMap = new Map(newBoats.map(b => [b.id, b]));

  // Find added boats (in new but not in old)
  newBoats.forEach(boat => {
    if (!oldMap.has(boat.id)) {
      changes.added.push(boat);
    }
  });

  // Find removed boats (in old but not in new)
  oldBoats.forEach(boat => {
    if (!newMap.has(boat.id)) {
      changes.removed.push(boat);
    }
  });

  // Find price changes (same boat ID, different price)
  newBoats.forEach(newBoat => {
    const oldBoat = oldMap.get(newBoat.id);
    if (oldBoat && oldBoat.currentPrice !== newBoat.currentPrice) {
      changes.priceChanges.push({
        title: newBoat.title,
        oldPrice: oldBoat.currentPrice,
        newPrice: newBoat.currentPrice,
        link: newBoat.link,
        vehicleImageHref: newBoat.vehicleImageHref,
      });
    }
  });

  return changes;
}

// ============================================
// EMAIL FUNCTIONS
// ============================================

/**
 * Build HTML email content from detected changes
 * Creates a formatted email showing added, removed, and price changed boats
 * If no changes, shows a friendly confirmation message
 */
function buildEmailHTML(changes, hasChanges = true) {
  let html = `
    <h2 style="color: #0066cc;">🚤 ${MARKS_CONFIG.name}</h2>
    <p style="font-size: 14px; color: #666;">Update checked at ${new Date().toLocaleString()}</p>
  `;

  // If no changes, show friendly message
  if (!hasChanges) {
    html += `
      <div style="margin: 20px 0; padding: 20px; background: #f0f8ff; border-left: 4px solid #0066cc; border-radius: 4px;">
        <p style="margin: 0; font-size: 15px; color: #333;">
          ✅ <strong>No changes detected.</strong> No new boats, removals, or price changes since the last check.
        </p>
        <p style="margin: 10px 0 0 0; font-size: 13px; color: #666;">
          We're keeping an eye on things and will let you know as soon as anything changes.
        </p>
      </div>
    `;
    return html;
  }

  // Added boats section
if (changes.added.length > 0) {
  html += `<h3 style="color: #27ae60;">✨ Added (${changes.added.length})</h3>`;
  changes.added.forEach(boat => {
    html += `
      <div style="margin: 12px 0; padding: 12px; background: white; border-left: 4px solid #27ae60; border-radius: 4px; display: flex; align-items: flex-start; gap: 15px;">
        ${boat.vehicleImageHref ? `
          <img src="${boat.vehicleImageHref}" alt="${boat.title}" style="width: 120px; height: auto; border-radius: 4px; flex-shrink: 0;" />
        ` : ''}
        <div style="flex: 1;">
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
      </div>
    `;
  });
}

// Removed boats section - also add images here
if (changes.removed.length > 0) {
  html += `<h3 style="color: #e74c3c;">❌ Removed (${changes.removed.length})</h3>`;
  changes.removed.forEach(boat => {
    html += `
      <div style="margin: 12px 0; padding: 12px; background: white; border-left: 4px solid #e74c3c; border-radius: 4px; display: flex; align-items: flex-start; gap: 15px;">
        ${boat.vehicleImageHref ? `
          <img src="${boat.vehicleImageHref}" alt="${boat.title}" style="width: 120px; height: auto; border-radius: 4px; flex-shrink: 0;" />
        ` : ''}
        <div style="flex: 1;">
          <p style="margin: 5px 0; font-weight: bold;">${boat.title}</p>
          <p style="margin: 5px 0; font-size: 13px;">${boat.currentPrice}</p>
        </div>
      </div>
    `;
  });
}

// Price changes section - add images here too
if (changes.priceChanges.length > 0) {
  html += `<h3 style="color: #f39c12;">💰 Price Changes (${changes.priceChanges.length})</h3>`;
  changes.priceChanges.forEach(change => {
    html += `
      <div style="margin: 12px 0; padding: 12px; background: white; border-left: 4px solid #f39c12; border-radius: 4px; display: flex; align-items: flex-start; gap: 15px;">
        ${change.vehicleImageHref ? `
          <img src="${change.vehicleImageHref}" alt="${change.title}" style="width: 120px; height: auto; border-radius: 4px; flex-shrink: 0;" />
        ` : ''}
        <div style="flex: 1;">
          <p style="margin: 5px 0; font-weight: bold;">
            <a href="${change.link || '#'}" style="color: #0066cc; text-decoration: none;">
              ${change.title}
            </a>
          </p>
          <p style="margin: 5px 0; font-size: 13px;">
            <strong style="color: #e74c3c;">${change.oldPrice}</strong> → <strong style="color: #27ae60;">${change.newPrice}</strong>
          </p>
        </div>
      </div>
    `;
  });
}
  return html;  // ✅ Return the complete HTML
}  // ✅ Close the function properly

/**
 * Send email via SendGrid API
 * Sends formatted HTML email with inventory changes
 */
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

// ============================================
// MAIN MONITORING FUNCTION
// ============================================

/**
 * Main monitoring function - orchestrates the entire process
 * 
 * FLOW:
 * 1. Initialize database (create if doesn't exist)
 * 2. Load previous inventory from database
 * 3. Fetch current inventory from website (with safety mechanisms)
 * 4. Detect changes (added/removed/price changes)
 * 5. Send email if changes detected
 * 6. REPLACE database with current inventory (not append!)
 */
async function monitor() {
  console.log('\n📊 Starting Mark\'s Leisure Time Marine monitoring...');
  console.log('='.repeat(60));
  
  // Initialize database
  initDatabase();

  // Load previous inventory
  const db = getDatabase();
  const oldBoats = db.marks || [];
  console.log(`📚 Loaded ${oldBoats.length} boats from previous run`);

  // Fetch current inventory (with all safety mechanisms)
  const newBoats = await fetchAllPages();

  // Detect changes
  console.log('\n🔍 Detecting changes...');
  const changes = detectChanges(oldBoats, newBoats);
  const hasChanges = changes.added.length > 0 || changes.removed.length > 0 || changes.priceChanges.length > 0;

  if (hasChanges) {
    console.log(`\n📢 Changes detected:`);
    console.log(`   ✨ Added: ${changes.added.length}`);
    console.log(`   ❌ Removed: ${changes.removed.length}`);
    console.log(`   💰 Price Changes: ${changes.priceChanges.length}`);
  } else {
    console.log('✅ No changes detected - but still sending confirmation email');
  }
  
  // Always send email (either with changes or confirmation message)
  const emailHTML = buildEmailHTML(changes, hasChanges);
  await sendEmail(emailHTML);

  // IMPORTANT: Save REPLACES the entire marks array with newBoats
  // This does NOT append - it completely overwrites the previous data
  console.log(`\n💾 Saving ${newBoats.length} boats to database...`);
  db.marks = newBoats; // COMPLETE REPLACEMENT, not appending
  db.lastUpdated = new Date().toISOString();
  saveDatabase(db);

  console.log('='.repeat(60));
  console.log('✅ Monitor run completed successfully\n');
}

// ============================================
// RUN THE MONITOR
// ============================================
monitor().catch(console.error);
