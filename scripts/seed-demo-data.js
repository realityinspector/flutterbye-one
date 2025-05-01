/**
 * seed-demo-data.js
 * Seeds the database with demo company and leads when the application is first run
 * Implementation for Task #16
 */

require('dotenv').config();
const { pool } = require('../server/db');
const { users, globalLeads, userLeads } = require('../shared/db/schema');

// Demo data
const DEMO_COMPANIES = [
  {
    companyName: 'Acme Corporation',
    contactName: 'Wile E. Coyote',
    phoneNumber: '555-123-4567',
    email: 'wcoyote@acme.example',
    address: '123 Desert Road',
    city: 'Tucson',
    state: 'AZ',
    zipCode: '85701',
    industry: 'Manufacturing',
    website: 'acme.example'
  },
  {
    companyName: 'TechNova Solutions',
    contactName: 'Alex Johnson',
    phoneNumber: '555-987-6543',
    email: 'alex@technova.example',
    address: '456 Innovation Drive',
    city: 'San Francisco',
    state: 'CA',
    zipCode: '94105',
    industry: 'Technology',
    website: 'technova.example'
  },
  {
    companyName: 'Global Shipping Logistics',
    contactName: 'Sam Rodriguez',
    phoneNumber: '555-456-7890',
    email: 'sam@globalshipping.example',
    address: '789 Harbor Blvd',
    city: 'Boston',
    state: 'MA',
    zipCode: '02110',
    industry: 'Logistics',
    website: 'globalshipping.example'
  },
  {
    companyName: 'Sunrise Healthcare',
    contactName: 'Emily Chen',
    phoneNumber: '555-234-5678',
    email: 'echen@sunrise.example',
    address: '321 Wellness Way',
    city: 'Chicago',
    state: 'IL',
    zipCode: '60601',
    industry: 'Healthcare',
    website: 'sunrise.example'
  },
  {
    companyName: 'Green Earth Organics',
    contactName: 'Jordan Smith',
    phoneNumber: '555-876-5432',
    email: 'jsmith@greenearth.example',
    address: '567 Nature Lane',
    city: 'Portland',
    state: 'OR',
    zipCode: '97201',
    industry: 'Agriculture',
    website: 'greenearth.example'
  }
];

/**
 * Seed demo data for a given user
 * @param {number} userId - The user ID to associate with demo leads
 */
async function seedDemoData(userId) {
  console.log(`Seeding demo data for user ID ${userId}...`);
  
  try {
    // Check if user already has leads
    const existingLeadsResult = await pool.query(
      'SELECT COUNT(*) FROM user_leads WHERE user_id = $1',
      [userId]
    );
    
    const existingLeadsCount = parseInt(existingLeadsResult.rows[0].count);
    if (existingLeadsCount > 0) {
      console.log(`User already has ${existingLeadsCount} leads. Skipping demo data seeding.`);
      return;
    }
    
    // Insert demo companies as global leads
    for (const company of DEMO_COMPANIES) {
      // Insert as global lead
      const globalLeadResult = await pool.query(
        `INSERT INTO global_leads 
        (company_name, contact_name, phone_number, email, address, city, state, zip_code, industry, website, created_at, updated_at) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW()) 
        RETURNING id`,
        [
          company.companyName,
          company.contactName,
          company.phoneNumber,
          company.email,
          company.address,
          company.city,
          company.state,
          company.zipCode,
          company.industry,
          company.website
        ]
      );
      
      const globalLeadId = globalLeadResult.rows[0].id;
      
      // Create user-specific lead entry with random priority
      const priority = Math.floor(Math.random() * 5) + 1; // Random priority between 1-5
      await pool.query(
        `INSERT INTO user_leads 
        (user_id, global_lead_id, status, priority, notes, created_at, updated_at) 
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
        [
          userId,
          globalLeadId,
          'new', // All demo leads start as 'new'
          priority,
          `Demo lead for ${company.companyName}. This is a sample lead to help you get started with Walk N Talk CRM.`
        ]
      );
    }
    
    console.log(`Successfully seeded ${DEMO_COMPANIES.length} demo leads for user ID ${userId}.`);
  } catch (error) {
    console.error('Error seeding demo data:', error);
  }
}

/**
 * Check for newly registered users and seed demo data for them
 */
async function checkAndSeedForNewUsers() {
  try {
    // Get all users without demo data
    const newUsersResult = await pool.query(
      `SELECT u.id FROM users u 
      LEFT JOIN (
        SELECT DISTINCT user_id FROM user_leads
      ) ul ON u.id = ul.user_id 
      WHERE ul.user_id IS NULL`
    );
    
    if (newUsersResult.rows.length === 0) {
      console.log('No new users without demo data found.');
      return;
    }
    
    // Seed demo data for each new user
    for (const user of newUsersResult.rows) {
      await seedDemoData(user.id);
    }
  } catch (error) {
    console.error('Error checking for new users:', error);
  }
}

// If this script is run directly, check and seed for new users
if (require.main === module) {
  checkAndSeedForNewUsers()
    .then(() => {
      console.log('Demo data check completed.');
      process.exit(0);
    })
    .catch(error => {
      console.error('Error in demo data seeding process:', error);
      process.exit(1);
    });
}

module.exports = {
  seedDemoData,
  checkAndSeedForNewUsers
};
