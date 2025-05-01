const { db } = require('./db');
const { eq } = require('drizzle-orm');
const { users } = require('../shared/db/schema');

class DatabaseStorage {
  constructor() {
    // No session store in JWT implementation
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
    try {
      const result = await db.select({ count: db.fn.count() }).from(users);
      // Ensure we have a valid result
      if (!result || !result.length || !result[0]) {
        console.log('No result from user count query, assuming first user');
        return true;
      }
      // Convert to number to safely compare
      const count = parseInt(result[0].count, 10);
      return count === 0;
    } catch (error) {
      console.error('Error checking if first user:', error);
      // If there's an error, assume it's the first user
      return true;
    }
  }
}

// Export singleton instance
const storage = new DatabaseStorage();
module.exports = { storage };
