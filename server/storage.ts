import { db } from './db';
import { eq, sql } from 'drizzle-orm';
import { users } from '../shared/db/schema';
import { User, NewUser, UserUpdate } from '../shared/db/zod-schema';


class DatabaseStorage {
  constructor() {
    // No session store in JWT implementation
  }

  // User methods
  async getUser(id: number): Promise<User | null> {
    const [dbUser] = await db.select().from(users).where(eq(users.id, id));
    if (!dbUser) return null;
    
    // Cast the role to the expected type in User
    return {
      ...dbUser,
      role: dbUser.role as 'user' | 'admin',
    };
  }

  async getUserByUsername(username: string): Promise<User | null> {
    const [dbUser] = await db.select().from(users).where(eq(users.username, username));
    if (!dbUser) return null;
    
    // Cast the role to the expected type in User
    return {
      ...dbUser,
      role: dbUser.role as 'user' | 'admin',
    };
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const [dbUser] = await db.select().from(users).where(eq(users.email, email));
    if (!dbUser) return null;
    
    // Cast the role to the expected type in User
    return {
      ...dbUser,
      role: dbUser.role as 'user' | 'admin',
    };
  }

  async createUser(userData: NewUser): Promise<User> {
    const [dbUser] = await db.insert(users).values(userData).returning();
    
    // Cast the role to the expected type in User
    return {
      ...dbUser,
      role: dbUser.role as 'user' | 'admin',
    };
  }

  async updateUser(userId: number, userData: Partial<UserUpdate>): Promise<User> {
    // Don't allow updating these fields directly
    const { id, username, password, ...updateData } = userData as any;
    
    const [dbUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();
    
    // Cast the role to the expected type in User
    return {
      ...dbUser,
      role: dbUser.role as 'user' | 'admin',
    };
  }

  async isFirstUser(): Promise<boolean> {
    const result = await db.select({ count: sql`count(*)` }).from(users);
    return parseInt(result[0].count as string) === 0;
  }
}

// Export singleton instance
const storage = new DatabaseStorage();
export { storage };
