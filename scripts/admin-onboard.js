/**
 * Admin onboarding script
 * One-time self-disposing admin onboard process for the first registered user
 */

const { db, pool } = require('../server/db');
const { eq } = require('drizzle-orm');
const { users } = require('../shared/db/schema');

// Ensure schema is properly loaded
console.log('Starting admin onboard process');
console.log('Users schema:', Object.keys(users));

async function onboardFirstAdmin() {
  try {
    console.log('Checking for existing users...');
    
    let userCount = 0;
    
    try {
      // Try using the pool directly for a simple count query
      const countResult = await pool.query('SELECT COUNT(*) as count FROM "users"');
      console.log('Pool query result:', JSON.stringify(countResult, null, 2));
      userCount = parseInt(countResult.rows?.[0]?.count || '0');
    } catch (queryError) {
      console.log('Error in database query:', queryError.message);
      userCount = 0;
    }
    
    console.log(`Found ${userCount} users.`);
    
    if (userCount === 0) {
      console.log('No users found. Waiting for first registration...');
      
      // Set up watcher for first user
      const checkInterval = setInterval(async () => {
        try {
          const checkResult = await pool.query('SELECT COUNT(*) as count FROM "users"');
          const currentCount = parseInt(checkResult.rows?.[0]?.count || '0');
          console.log(`Check: ${currentCount} users found.`);
          
          if (currentCount > 0) {
            clearInterval(checkInterval);
            await makeFirstUserAdmin();
          }
        } catch (error) {
          console.log('Error checking for new users:', error.message);
        }
      }, 3000); // Check every 3 seconds
    } else if (userCount === 1) {
      // Make the user admin if there's exactly one user
      await makeFirstUserAdmin();
    } else {
      console.log(`Found ${userCount} users. Admin should already be set.`);
      process.exit(0);
    }
  } catch (error) {
    console.error('Error in admin onboarding process:', error);
    process.exit(1);
  }
}

async function makeFirstUserAdmin() {
  try {
    // Get first user by lowest ID using direct pool query
    const firstUserResult = await pool.query('SELECT * FROM "users" ORDER BY id LIMIT 1');
    const firstUser = firstUserResult.rows[0];
    console.log('First user:', JSON.stringify(firstUser, null, 2));
    
    if (!firstUser) {
      console.log('No users found to make admin.');
      process.exit(0);
    }
    
    // Check if user is already admin
    if ('isAdmin' in firstUser) {
      if (firstUser.isAdmin) {
        console.log(`User ${firstUser.username} (ID: ${firstUser.id}) is already an admin.`);
        process.exit(0);
      }
      
      // Update user to be admin using isAdmin field
      await pool.query('UPDATE "users" SET "isAdmin" = true WHERE id = $1', [firstUser.id]);
    } else {
      // Use the role field instead if isAdmin isn't available
      if (firstUser.role === 'admin') {
        console.log(`User ${firstUser.username} (ID: ${firstUser.id}) is already an admin.`);
        process.exit(0);
      }
      
      // Update user to be admin using role field
      await pool.query('UPDATE "users" SET role = $1 WHERE id = $2', ['admin', firstUser.id]);
    }
    
    console.log(`Success! User ${firstUser.username} (ID: ${firstUser.id}) is now an admin.`);
    console.log('One-time admin onboarding complete.');
    process.exit(0);
  } catch (error) {
    console.error('Error making first user admin:', error);
    process.exit(1);
  }
}

// Run the onboarding process
onboardFirstAdmin();
