/**
 * StorageManager - Local data storage and caching
 * Provides a consistent interface for storing and retrieving data locally
 */
class StorageManager {
  constructor(namespace = 'crm') {
    this.namespace = namespace;
    this.storage = window.localStorage;
    this.memoryCache = {};
    this.cacheExpirations = {};
  }

  /**
   * Get the full key with namespace
   * @param {string} key - The key to namespace
   * @returns {string} The namespaced key
   */
  _getNamespacedKey(key) {
    return `${this.namespace}:${key}`;
  }

  /**
   * Set a value in storage
   * @param {string} key - The key to store the value under
   * @param {*} value - The value to store
   * @param {number} [expiration=null] - Optional expiration time in milliseconds
   */
  set(key, value, expiration = null) {
    const nsKey = this._getNamespacedKey(key);
    
    // Store as JSON
    const serialized = JSON.stringify({
      value,
      timestamp: Date.now(),
      expiration: expiration ? Date.now() + expiration : null
    });
    
    // Store in localStorage
    try {
      this.storage.setItem(nsKey, serialized);
    } catch (e) {
      console.error('Storage error:', e);
      // Handle quota errors by clearing old data
      if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
        this._clearOldItems();
        try {
          // Try again after clearing
          this.storage.setItem(nsKey, serialized);
        } catch (retryError) {
          console.error('Storage retry failed:', retryError);
        }
      }
    }
    
    // Also store in memory cache
    this.memoryCache[nsKey] = value;
    
    // Set cache expiration
    if (expiration) {
      this.cacheExpirations[nsKey] = Date.now() + expiration;
    } else {
      delete this.cacheExpirations[nsKey];
    }
  }

  /**
   * Get a value from storage
   * @param {string} key - The key to retrieve
   * @param {*} [defaultValue=null] - Default value if key doesn't exist
   * @returns {*} The stored value or defaultValue
   */
  get(key, defaultValue = null) {
    const nsKey = this._getNamespacedKey(key);
    
    // First check memory cache
    if (nsKey in this.memoryCache) {
      // Check if cache has expired
      if (this.cacheExpirations[nsKey] && this.cacheExpirations[nsKey] < Date.now()) {
        delete this.memoryCache[nsKey];
        delete this.cacheExpirations[nsKey];
      } else {
        return this.memoryCache[nsKey];
      }
    }
    
    // Try to get from localStorage
    try {
      const serialized = this.storage.getItem(nsKey);
      if (serialized) {
        const { value, expiration } = JSON.parse(serialized);
        
        // Check if the stored value has expired
        if (expiration && expiration < Date.now()) {
          this.remove(key);
          return defaultValue;
        }
        
        // Cache in memory for faster access next time
        this.memoryCache[nsKey] = value;
        if (expiration) {
          this.cacheExpirations[nsKey] = expiration;
        }
        
        return value;
      }
    } catch (e) {
      console.error('Error retrieving from storage:', e);
    }
    
    return defaultValue;
  }

  /**
   * Remove a value from storage
   * @param {string} key - The key to remove
   */
  remove(key) {
    const nsKey = this._getNamespacedKey(key);
    
    // Remove from localStorage
    try {
      this.storage.removeItem(nsKey);
    } catch (e) {
      console.error('Error removing from storage:', e);
    }
    
    // Remove from memory cache
    delete this.memoryCache[nsKey];
    delete this.cacheExpirations[nsKey];
  }

  /**
   * Clear all values in the current namespace
   */
  clear() {
    // Get all keys in the current namespace
    const keys = this._getAllNamespacedKeys();
    
    // Remove each key
    keys.forEach(key => {
      try {
        this.storage.removeItem(key);
      } catch (e) {
        console.error('Error clearing storage:', e);
      }
    });
    
    // Clear memory cache
    this.memoryCache = {};
    this.cacheExpirations = {};
  }

  /**
   * Get all keys in the current namespace
   * @returns {string[]} Array of namespaced keys
   */
  _getAllNamespacedKeys() {
    const keys = [];
    
    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      if (key && key.startsWith(`${this.namespace}:`)) {
        keys.push(key);
      }
    }
    
    return keys;
  }

  /**
   * Clear old or least recently used items to free up space
   */
  _clearOldItems() {
    // Get all keys and their timestamps
    const keys = this._getAllNamespacedKeys();
    const keyData = [];
    
    for (const key of keys) {
      try {
        const data = JSON.parse(this.storage.getItem(key));
        keyData.push({
          key,
          timestamp: data.timestamp || 0
        });
      } catch (e) {
        // If we can't parse, it's probably old/invalid data
        keyData.push({
          key,
          timestamp: 0
        });
      }
    }
    
    // Sort by timestamp (oldest first)
    keyData.sort((a, b) => a.timestamp - b.timestamp);
    
    // Remove oldest 20% of items
    const removeCount = Math.ceil(keyData.length * 0.2);
    for (let i = 0; i < removeCount && i < keyData.length; i++) {
      try {
        this.storage.removeItem(keyData[i].key);
      } catch (e) {
        console.error('Error removing old storage item:', e);
      }
    }
  }

  /**
   * Store an array of items where each has a unique ID
   * @param {string} collectionKey - The key for the collection
   * @param {Object[]} items - Array of items with id properties
   * @param {number} [expiration=null] - Optional expiration time in milliseconds
   */
  setCollection(collectionKey, items, expiration = null) {
    // Create a map of items by ID
    const itemMap = {};
    items.forEach(item => {
      if (item && item.id) {
        itemMap[item.id] = item;
      }
    });
    
    this.set(collectionKey, {
      items: itemMap,
      ids: Object.keys(itemMap)
    }, expiration);
  }

  /**
   * Get an array of items from a collection
   * @param {string} collectionKey - The key for the collection
   * @returns {Object[]} Array of stored items
   */
  getCollection(collectionKey) {
    const collection = this.get(collectionKey, { items: {}, ids: [] });
    return collection.ids.map(id => collection.items[id]);
  }

  /**
   * Add or update an item in a collection
   * @param {string} collectionKey - The key for the collection
   * @param {Object} item - Item to add/update (must have id)
   */
  updateCollectionItem(collectionKey, item) {
    if (!item || !item.id) {
      console.error('Cannot update collection item without id');
      return;
    }
    
    const collection = this.get(collectionKey, { items: {}, ids: [] });
    
    // Update or add the item
    collection.items[item.id] = item;
    
    // Ensure the ID is in the list
    if (!collection.ids.includes(item.id)) {
      collection.ids.push(item.id);
    }
    
    this.set(collectionKey, collection);
  }

  /**
   * Remove an item from a collection
   * @param {string} collectionKey - The key for the collection
   * @param {string|number} itemId - ID of the item to remove
   */
  removeCollectionItem(collectionKey, itemId) {
    const collection = this.get(collectionKey, { items: {}, ids: [] });
    
    // Remove the item
    delete collection.items[itemId];
    
    // Remove the ID from the list
    collection.ids = collection.ids.filter(id => id !== itemId);
    
    this.set(collectionKey, collection);
  }

  /**
   * Check if a value exists in storage
   * @param {string} key - The key to check
   * @returns {boolean} True if key exists and is not expired
   */
  has(key) {
    const nsKey = this._getNamespacedKey(key);
    
    // First check memory cache
    if (nsKey in this.memoryCache) {
      // Check if cache has expired
      if (this.cacheExpirations[nsKey] && this.cacheExpirations[nsKey] < Date.now()) {
        return false;
      }
      return true;
    }
    
    // Try to get from localStorage
    try {
      const serialized = this.storage.getItem(nsKey);
      if (serialized) {
        const { expiration } = JSON.parse(serialized);
        
        // Check if the stored value has expired
        if (expiration && expiration < Date.now()) {
          return false;
        }
        
        return true;
      }
    } catch (e) {
      console.error('Error checking storage:', e);
    }
    
    return false;
  }
}

// Create a singleton instance
const storageManager = new StorageManager();