const axios = require('axios');
const cheerio = require('cheerio');
require('dotenv').config();

// Mark's Leisure Time Marine configuration
const MARKS_CONFIG = {
  name: "Mark's Leisure Time Marine",
  url: 'https://www.marksleisuretimemarine.com/new-boats-for-sale-conesus-canandaigua-new-york--inventory?condition=new&condition=pre-owned&pg=1',
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
      title,
      link,
      currentPrice,
      savings,
      status: status || 'In Stock'
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

// Build HTML email
function buildEmailHTML(boats) {
  let html = `
    <h2 style="color: #0066cc;">🚤 ${MARKS_CONFIG.name}</h2>
    <p style="font-size: 14px; color: #666;">Inventory as of ${new Date().toLocaleString()}</p>
  `;
  
  if (boats.length === 0) {
    html += `<p>No boats found.</p>`;
    return html;
  }
  
  html += `<p style="font-size: 12px; color: #666; margin-bottom: 15px;">Found ${boats.length} boats</p>`;
  
  boats.slice(0, 5).forEach(boat => {
    html += `
      <div style="margin: 12px 0; padding: 12px; background: white; border-left: 4px solid #0066cc; border-radius: 4px;">
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
  
  if (boats.length > 5) {
    html += `<p style="font-size: 12px; color: #666; margin: 15px 0;">...and ${boats.length - 5} more boats</p>`;
  }
  
  return html;
}

// Send email via SendGrid
async function sendEmail(htmlContent) {
  try {
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    
    const msg = {
      to: process.env.SENDGRID_TO_EMAIL,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: `🚤 Mark's Leisure Time Marine Inventory - ${new Date().toLocaleDateString()}`,
      html: htmlContent
    };
    
    // Add second email if provided
    if (process.env.SENDGRID_TO_EMAIL_2) {
      msg.to = [process.env.SENDGRID_TO_EMAIL, process.env.SENDGRID_TO_EMAIL_2];
    }
    
    await sgMail.send(msg);
    console.log('✅ Email sent successfully');
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
  }
}

// Main function
async function monitor() {
  console.log('\n📊 Starting Mark\'s Leisure Time Marine monitoring...');
  
  const boats = await fetchMarksBoats();
  const emailHTML = buildEmailHTML(boats);
  
  await sendEmail(emailHTML);
}

// Run
monitor().catch(console.error);
