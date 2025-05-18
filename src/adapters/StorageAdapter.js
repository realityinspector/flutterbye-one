/**
 * Storage Adapter for React Native
 * 
 * Provides a unified interface for data persistence in React Native,
 * implementing the same interface as the web storage adapter.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite';

class StorageAdapter {
  constructor() {
    this.db = null;
    this.initialized = false;
    this.initializeDatabase();
  }

  /**
   * Initialize the SQLite database
   * @returns {Promise<void>}
   */
  async initializeDatabase() {
    if (this.initialized) return;
    
    try {
      // Open database
      this.db = SQLite.openDatabase('flutterbye.db');
      
      // Create tables if they don't exist
      await this.executeQuery(`
        CREATE TABLE IF NOT EXISTS items (
          key TEXT PRIMARY KEY,
          value TEXT,
          timestamp INTEGER
        )
      `);
      
      await this.executeQuery(`
        CREATE TABLE IF NOT EXISTS collections (
          collection_key TEXT NOT NULL,
          item_id TEXT NOT NULL,
          value TEXT,
          timestamp INTEGER,
          PRIMARY KEY (collection_key, item_id)
        )
      `);
      
      this.initialized = true;
      console.log('Storage adapter database initialized');
    } catch (error) {
      console.error('Error initializing database:', error);
    }
  }

  /**
   * Execute a SQLite query
   * @param {string} query - SQL query
   * @param {Array} params - Query parameters
   * @returns {Promise<Object>} Query result
   */
  executeQuery(query, params = []) {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          query,
          params,
          (_, result) => resolve(result),
          (_, error) => reject(error)
        );
      });
    });
  }

  /**
   * Set a value in storage
   * @param {string} key - Storage key
   * @param {any} value - Value to store
   * @param {number} ttl - Time to live in milliseconds
   * @returns {Promise<void>}
   */
  async set(key, value, ttl = null) {
    try {
      // Ensure database is initialized
      if (!this.initialized) {
        await this.initializeDatabase();
      }
      
      // For primitive values, use AsyncStorage for faster access
      if (this.isPrimitive(value)) {
        return AsyncStorage.setItem(key, JSON.stringify(value));
      }
      
      // For objects and arrays, use SQLite
      const serializedValue = JSON.stringify(value);
      const timestamp = Date.now();
      const expiryTime = ttl ? timestamp + ttl : null;
      
      // Insert or replace value in database
      await this.executeQuery(
        'INSERT OR REPLACE INTO items (key, value, timestamp) VALUES (?, ?, ?)',
        [key, serializedValue, expiryTime]
      );
    } catch (error) {
      console.error(`Error setting storage value for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get a value from storage
   * @param {string} key - Storage key
   * @returns {Promise<any>} Stored value or null
   */
  async get(key) {
    try {
      // Ensure database is initialized
      if (!this.initialized) {
        await this.initializeDatabase();
      }
      
      // First try AsyncStorage for faster access
      const asyncValue = await AsyncStorage.getItem(key);
      if (asyncValue !== null) {
        return JSON.parse(asyncValue);
      }
      
      // If not in AsyncStorage, check SQLite
      const result = await this.executeQuery(
        'SELECT value, timestamp FROM items WHERE key = ?',
        [key]
      );
      
      // If no results, return null
      if (result.rows.length === 0) {
        return null;
      }
      
      const { value, timestamp } = result.rows.item(0);
      
      // Check if value has expired
      if (timestamp && Date.now() > timestamp) {
        // Remove expired value
        await this.remove(key);
        return null;
      }
      
      return JSON.parse(value);
    } catch (error) {
      console.error(`Error getting storage value for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Remove a value from storage
   * @param {string} key - Storage key
   * @returns {Promise<void>}
   */
  async remove(key) {
    try {
      // Ensure database is initialized
      if (!this.initialized) {
        await this.initializeDatabase();
      }
      
      // Remove from AsyncStorage
      await AsyncStorage.removeItem(key);
      
      // Remove from SQLite
      await this.executeQuery('DELETE FROM items WHERE key = ?', [key]);
    } catch (error) {
      console.error(`Error removing storage value for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Clear all values from storage
   * @returns {Promise<void>}
   */
  async clear() {
    try {
      // Ensure database is initialized
      if (!this.initialized) {
        await this.initializeDatabase();
      }
      
      // Clear AsyncStorage
      await AsyncStorage.clear();
      
      // Clear SQLite tables
      await this.executeQuery('DELETE FROM items');
      await this.executeQuery('DELETE FROM collections');
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    }
  }

  /**
   * Set a collection of items
   * @param {string} key - Collection key
   * @param {Array} items - Collection items
   * @param {number} ttl - Time to live in milliseconds
   * @returns {Promise<void>}
   */
  async setCollection(key, items, ttl = null) {
    try {
      // Ensure database is initialized
      if (!this.initialized) {
        await this.initializeDatabase();
      }
      
      // Calculate expiry time
      const timestamp = Date.now();
      const expiryTime = ttl ? timestamp + ttl : null;
      
      // Begin transaction
      await new Promise((resolve, reject) => {
        this.db.transaction(
          tx => {
            // Clear existing collection
            tx.executeSql('DELETE FROM collections WHERE collection_key = ?', [key]);
            
            // Insert new items
            items.forEach(item => {
              const id = item.id || item._id;
              if (!id) {
                console.warn('Item without ID in collection:', item);
                return;
              }
              
              tx.executeSql(
                'INSERT INTO collections (collection_key, item_id, value, timestamp) VALUES (?, ?, ?, ?)',
                [key, id.toString(), JSON.stringify(item), expiryTime]
              );
            });
          },
          reject,
          resolve
        );
      });
    } catch (error) {
      console.error(`Error setting collection for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get a collection of items
   * @param {string} key - Collection key
   * @returns {Promise<Array>} Collection items or empty array
   */
  async getCollection(key) {
    try {
      // Ensure database is initialized
      if (!this.initialized) {
        await this.initializeDatabase();
      }
      
      const result = await this.executeQuery(
        'SELECT item_id, value, timestamp FROM collections WHERE collection_key = ?',
        [key]
      );
      
      // If no results, return empty array
      if (result.rows.length === 0) {
        return [];
      }
      
      const items = [];
      const expiredItems = [];
      const now = Date.now();
      
      // Process results
      for (let i = 0; i < result.rows.length; i++) {
        const { item_id, value, timestamp } = result.rows.item(i);
        
        // Check if value has expired
        if (timestamp && now > timestamp) {
          expiredItems.push(item_id);
          continue;
        }
        
        items.push(JSON.parse(value));
      }
      
      // Remove expired items
      if (expiredItems.length > 0) {
        await Promise.all(expiredItems.map(id => 
          this.removeCollectionItem(key, id)
        ));
      }
      
      return items;
    } catch (error) {
      console.error(`Error getting collection for key ${key}:`, error);
      return [];
    }
  }

  /**
   * Update an item in a collection
   * @param {string} key - Collection key
   * @param {Object} item - Item to update
   * @returns {Promise<void>}
   */
  async updateCollectionItem(key, item) {
    try {
      // Ensure database is initialized
      if (!this.initialized) {
        await this.initializeDatabase();
      }
      
      const id = item.id || item._id;
      if (!id) {
        throw new Error('Cannot update item without ID');
      }
      
      // First check if item exists
      const result = await this.executeQuery(
        'SELECT timestamp FROM collections WHERE collection_key = ? AND item_id = ?',
        [key, id.toString()]
      );
      
      if (result.rows.length === 0) {
        // Item doesn't exist, add it to collection
        const collection = await this.getCollection(key);
        collection.push(item);
        await this.setCollection(key, collection);
        return;
      }
      
      // Get existing timestamp
      const { timestamp } = result.rows.item(0);
      
      // Update item
      await this.executeQuery(
        'UPDATE collections SET value = ? WHERE collection_key = ? AND item_id = ?',
        [JSON.stringify(item), key, id.toString()]
      );
    } catch (error) {
      console.error(`Error updating collection item for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Remove an item from a collection
   * @param {string} key - Collection key
   * @param {string|number} id - Item ID
   * @returns {Promise<void>}
   */
  async removeCollectionItem(key, id) {
    try {
      // Ensure database is initialized
      if (!this.initialized) {
        await this.initializeDatabase();
      }
      
      // Remove item
      await this.executeQuery(
        'DELETE FROM collections WHERE collection_key = ? AND item_id = ?',
        [key, id.toString()]
      );
    } catch (error) {
      console.error(`Error removing collection item ${id} from key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Check if a value is primitive
   * @param {any} value - Value to check
   * @returns {boolean} True if primitive
   */
  isPrimitive(value) {
    return value === null || 
           ['string', 'number', 'boolean', 'undefined'].includes(typeof value);
  }
}

export default StorageAdapter;