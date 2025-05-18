/**
 * Synchronization Service
 * Shared between web and React Native applications
 * 
 * This service handles data synchronization between the client and server,
 * providing offline capabilities and conflict resolution.
 */

class SyncService {
  /**
   * Create a new Sync Service
   * @param {Object} apiClient - API client for data communication
   * @param {Object} storageManager - Storage for caching data
   * @param {Object} options - Configuration options
   */
  constructor(apiClient, storageManager, options = {}) {
    this.apiClient = apiClient;
    this.storageManager = storageManager;
    this.options = {
      syncInterval: 60000, // 1 minute
      maxRetries: 5,
      entityTypes: ['leads', 'calls', 'notes'],
      conflictResolution: 'server-wins', // server-wins, client-wins, or manual
      debug: false,
      ...options
    };
    
    this.pendingSyncKey = 'pending_sync_operations';
    this.lastSyncKey = 'last_sync_timestamp';
    this.syncInProgress = false;
    this.syncTimer = null;
    this.offlineMode = false;
    this.retryCount = 0;
    
    // Bind methods
    this.sync = this.sync.bind(this);
    this.startAutoSync = this.startAutoSync.bind(this);
    this.stopAutoSync = this.stopAutoSync.bind(this);
  }

  /**
   * Initialize the sync service
   * @returns {Promise<void>}
   */
  async init() {
    try {
      // Check if we have pending operations
      const pendingOps = await this.getPendingOperations();
      
      if (pendingOps.length > 0 && this.options.debug) {
        console.log(`SyncService: Found ${pendingOps.length} pending operations`);
      }
      
      // Start automatic sync if requested
      if (this.options.autoSync) {
        this.startAutoSync();
      }
      
      // Initial sync
      await this.sync();
    } catch (error) {
      console.error('Sync service initialization error:', error);
    }
  }

  /**
   * Start automatic synchronization
   */
  startAutoSync() {
    // Clear any existing timer
    this.stopAutoSync();
    
    // Start new timer
    this.syncTimer = setInterval(this.sync, this.options.syncInterval);
    
    if (this.options.debug) {
      console.log(`SyncService: Auto-sync started (${this.options.syncInterval}ms interval)`);
    }
  }

  /**
   * Stop automatic synchronization
   */
  stopAutoSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
      
      if (this.options.debug) {
        console.log('SyncService: Auto-sync stopped');
      }
    }
  }

  /**
   * Check if the device is online
   * @returns {Promise<boolean>} True if online
   */
  async isOnline() {
    // Implementation will differ between web and React Native
    // This is just a placeholder - the actual implementation will be in platform-specific adapters
    if (typeof navigator !== 'undefined' && navigator.onLine !== undefined) {
      // Browser implementation
      return navigator.onLine;
    }
    
    // Default to assumed online for now
    return !this.offlineMode;
  }

  /**
   * Set offline mode (for testing or manual control)
   * @param {boolean} offline - Whether to set offline mode
   */
  setOfflineMode(offline) {
    this.offlineMode = offline;
    
    if (this.options.debug) {
      console.log(`SyncService: Offline mode ${offline ? 'enabled' : 'disabled'}`);
    }
  }

  /**
   * Perform synchronization
   * @returns {Promise<Object>} Sync results
   */
  async sync() {
    // Prevent multiple sync operations running simultaneously
    if (this.syncInProgress) {
      if (this.options.debug) {
        console.log('SyncService: Sync already in progress, skipping');
      }
      return { success: false, reason: 'in-progress' };
    }
    
    try {
      this.syncInProgress = true;
      
      // Check if we're online
      const online = await this.isOnline();
      if (!online) {
        if (this.options.debug) {
          console.log('SyncService: Device offline, skipping sync');
        }
        return { success: false, reason: 'offline' };
      }
      
      // Get pending operations
      const pendingOps = await this.getPendingOperations();
      
      // Get last sync timestamp
      const lastSync = await this.getLastSyncTimestamp();
      
      // Results container
      const results = {
        success: true,
        operations: {
          sent: 0,
          received: 0,
          conflicts: 0,
          errors: 0
        },
        timestamp: new Date()
      };
      
      // Process pending operations first (outgoing changes)
      if (pendingOps.length > 0) {
        for (const op of pendingOps) {
          try {
            await this.processPendingOperation(op);
            results.operations.sent++;
          } catch (error) {
            results.operations.errors++;
            console.error('Error processing pending operation:', error);
          }
        }
        
        // Clear processed operations
        await this.clearPendingOperations();
      }
      
      // Fetch updates from server (incoming changes)
      for (const entityType of this.options.entityTypes) {
        try {
          const updates = await this.fetchUpdates(entityType, lastSync);
          if (updates && updates.length > 0) {
            await this.applyUpdates(entityType, updates);
            results.operations.received += updates.length;
          }
        } catch (error) {
          results.operations.errors++;
          console.error(`Error syncing ${entityType}:`, error);
        }
      }
      
      // Update last sync timestamp
      await this.updateSyncTimestamp(results.timestamp);
      
      // Reset retry counter on successful sync
      this.retryCount = 0;
      
      if (this.options.debug) {
        console.log('SyncService: Sync completed successfully', results);
      }
      
      return results;
    } catch (error) {
      console.error('Sync error:', error);
      
      // Increment retry counter
      this.retryCount++;
      
      // If we haven't reached max retries, schedule a retry
      if (this.retryCount < this.options.maxRetries) {
        const retryDelay = Math.pow(2, this.retryCount) * 1000; // Exponential backoff
        
        if (this.options.debug) {
          console.log(`SyncService: Scheduling retry in ${retryDelay}ms (attempt ${this.retryCount})`);
        }
        
        setTimeout(this.sync, retryDelay);
      }
      
      return {
        success: false,
        reason: 'error',
        error: error.message
      };
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Queue an operation for synchronization
   * @param {string} entityType - Type of entity (leads, calls, etc.)
   * @param {string} operation - Operation type (create, update, delete)
   * @param {Object} data - Operation data
   * @returns {Promise<void>}
   */
  async queueOperation(entityType, operation, data) {
    try {
      // Get current pending operations
      const pendingOps = await this.getPendingOperations();
      
      // Create new operation
      const newOp = {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
        entityType,
        operation,
        data,
        timestamp: new Date()
      };
      
      // Add to pending operations
      pendingOps.push(newOp);
      
      // Save updated operations
      await this.storageManager.set(this.pendingSyncKey, pendingOps);
      
      if (this.options.debug) {
        console.log(`SyncService: Queued ${operation} operation for ${entityType}`, newOp);
      }
      
      // Trigger sync if we're online
      const online = await this.isOnline();
      if (online && !this.syncInProgress) {
        this.sync();
      }
    } catch (error) {
      console.error('Error queueing operation:', error);
      throw new Error(`Failed to queue operation: ${error.message}`);
    }
  }

  /**
   * Get pending operations
   * @returns {Promise<Array>} Array of pending operations
   */
  async getPendingOperations() {
    const ops = await this.storageManager.get(this.pendingSyncKey);
    return ops || [];
  }

  /**
   * Clear pending operations
   * @returns {Promise<void>}
   */
  async clearPendingOperations() {
    await this.storageManager.set(this.pendingSyncKey, []);
  }

  /**
   * Get last sync timestamp
   * @returns {Promise<Date|null>} Last sync timestamp
   */
  async getLastSyncTimestamp() {
    const timestamp = await this.storageManager.get(this.lastSyncKey);
    return timestamp ? new Date(timestamp) : null;
  }

  /**
   * Update sync timestamp
   * @param {Date} timestamp - New timestamp
   * @returns {Promise<void>}
   */
  async updateSyncTimestamp(timestamp) {
    await this.storageManager.set(this.lastSyncKey, timestamp.toISOString());
  }

  /**
   * Process a pending operation
   * @param {Object} operation - Operation to process
   * @returns {Promise<void>}
   */
  async processPendingOperation(operation) {
    const { entityType, operation: opType, data } = operation;
    
    switch (opType) {
      case 'create':
        await this.processCreateOperation(entityType, data);
        break;
      case 'update':
        await this.processUpdateOperation(entityType, data);
        break;
      case 'delete':
        await this.processDeleteOperation(entityType, data);
        break;
      default:
        throw new Error(`Unknown operation type: ${opType}`);
    }
  }

  /**
   * Process a create operation
   * @param {string} entityType - Entity type
   * @param {Object} data - Entity data
   * @returns {Promise<void>}
   */
  async processCreateOperation(entityType, data) {
    switch (entityType) {
      case 'leads':
        await this.apiClient.createLead(data);
        break;
      case 'calls':
        await this.apiClient.createCall(data);
        break;
      case 'notes':
        await this.apiClient.createNote(data);
        break;
      default:
        throw new Error(`Unknown entity type: ${entityType}`);
    }
  }

  /**
   * Process an update operation
   * @param {string} entityType - Entity type
   * @param {Object} data - Entity data
   * @returns {Promise<void>}
   */
  async processUpdateOperation(entityType, data) {
    const { id, ...updateData } = data;
    
    switch (entityType) {
      case 'leads':
        await this.apiClient.updateLead(id, updateData);
        break;
      case 'calls':
        await this.apiClient.updateCall(id, updateData);
        break;
      case 'notes':
        await this.apiClient.updateNote(id, updateData);
        break;
      default:
        throw new Error(`Unknown entity type: ${entityType}`);
    }
  }

  /**
   * Process a delete operation
   * @param {string} entityType - Entity type
   * @param {Object} data - Entity data
   * @returns {Promise<void>}
   */
  async processDeleteOperation(entityType, data) {
    const id = data.id;
    
    switch (entityType) {
      case 'leads':
        await this.apiClient.deleteLead(id);
        break;
      case 'calls':
        await this.apiClient.deleteCall(id);
        break;
      case 'notes':
        await this.apiClient.deleteNote(id);
        break;
      default:
        throw new Error(`Unknown entity type: ${entityType}`);
    }
  }

  /**
   * Fetch updates from server
   * @param {string} entityType - Entity type
   * @param {Date} since - Last sync timestamp
   * @returns {Promise<Array>} Updated entities
   */
  async fetchUpdates(entityType, since) {
    const sinceParam = since ? since.toISOString() : '';
    
    switch (entityType) {
      case 'leads':
        const leadsResponse = await this.apiClient.makeRequest(`/api/leads?since=${sinceParam}`);
        return leadsResponse.data;
      case 'calls':
        const callsResponse = await this.apiClient.makeRequest(`/api/calls?since=${sinceParam}`);
        return callsResponse.data;
      case 'notes':
        const notesResponse = await this.apiClient.makeRequest(`/api/notes?since=${sinceParam}`);
        return notesResponse.data;
      default:
        throw new Error(`Unknown entity type: ${entityType}`);
    }
  }

  /**
   * Apply updates to local storage
   * @param {string} entityType - Entity type
   * @param {Array} updates - Updates to apply
   * @returns {Promise<void>}
   */
  async applyUpdates(entityType, updates) {
    // Fetch current cached data
    const cacheKey = entityType;
    const cachedData = await this.storageManager.get(cacheKey) || [];
    
    // Create a map of existing items by ID for easy lookup
    const existingMap = {};
    cachedData.forEach(item => {
      existingMap[item.id] = item;
    });
    
    // Apply updates based on conflict resolution strategy
    const updated = [...cachedData];
    
    updates.forEach(serverItem => {
      const existingItem = existingMap[serverItem.id];
      
      if (!existingItem) {
        // New item, just add it
        updated.push(serverItem);
      } else {
        // Existing item, check for conflicts
        const localUpdatedAt = new Date(existingItem.updatedAt || 0);
        const serverUpdatedAt = new Date(serverItem.updatedAt || 0);
        
        let shouldUpdate = false;
        
        switch (this.options.conflictResolution) {
          case 'server-wins':
            // Always use server version
            shouldUpdate = true;
            break;
          case 'client-wins':
            // Only update if server version is newer
            shouldUpdate = serverUpdatedAt > localUpdatedAt;
            break;
          case 'manual':
            // For now, default to server version in manual mode
            // In a real implementation, this would trigger a UI for conflict resolution
            shouldUpdate = true;
            break;
        }
        
        if (shouldUpdate) {
          // Update existing item
          const index = updated.findIndex(item => item.id === serverItem.id);
          if (index !== -1) {
            updated[index] = serverItem;
          }
        }
      }
    });
    
    // Save updated data to cache
    await this.storageManager.set(cacheKey, updated);
  }

  /**
   * Clear all sync data
   * @returns {Promise<void>}
   */
  async clearSyncData() {
    await this.clearPendingOperations();
    await this.storageManager.remove(this.lastSyncKey);
    
    if (this.options.debug) {
      console.log('SyncService: Sync data cleared');
    }
  }

  /**
   * Get sync status
   * @returns {Promise<Object>} Sync status
   */
  async getSyncStatus() {
    const lastSync = await this.getLastSyncTimestamp();
    const pendingOps = await this.getPendingOperations();
    
    return {
      lastSync,
      pendingOperations: pendingOps.length,
      inProgress: this.syncInProgress,
      offlineMode: this.offlineMode
    };
  }
}

// Export for both web and React Native
export { SyncService };