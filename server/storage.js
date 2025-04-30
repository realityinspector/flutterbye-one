const { db } = require('./db');
const { eq } = require('drizzle-orm');
const { users } = require('../shared/schema');
const connectPg = require('connect-pg-simple');
const session = require('express-session');
const { Pool } = require('pg');

// Create PostgreSQL session store
const PgSessionStore = connectPg(session);
const sessionPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

class DatabaseStorage {
  constructor() {
    // Initialize session store
    this.sessionStore = new PgSessionStore({
      pool: sessionPool,
      createTableIfMissing: true,
    });
  }

  // User methods
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || null;
  }

  async getUserByUsername(username) {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || null;
  }

  async getUserByEmail(email) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || null;
  }

  async createUser(userData) {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async updateUser(userId, userData) {
    // Don't allow updating these fields directly
    const { id, username, password, ...updateData } = userData;
    
    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();
    
    return updatedUser;
  }

  async isFirstUser() {
    const count = await db.select({ count: db.fn.count() }).from(users);
    return count[0].count === '0';
  }
}

// Export singleton instance
const storage = new DatabaseStorage();
module.exports = { storage };
