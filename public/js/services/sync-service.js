/**
 * SyncService - Data synchronization between local storage and server
 * Ensures offline capabilities and data consistency
 */
class SyncService {
  /**
   * Create a new SyncService instance
   * @param {APIClient} apiClient - API client instance
   * @param {StorageManager} storageManager - Storage manager instance
   */
  constructor(apiClient, storageManager) {
    this.apiClient = apiClient;
    this.storageManager = storageManager;
    this.syncQueue = this._loadSyncQueue();
    this.isSyncing = false;
    this.isOnline = navigator.onLine;
    this.setupEventListeners();
  }

  /**
   * Set up event listeners for online/offline status
   */
  setupEventListeners() {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.attemptSync();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
    
    // Attempt to sync when the page is about to be unloaded (if online)
    window.addEventListener('beforeunload', () => {
      if (this.isOnline && this.syncQueue.length > 0) {
        this.attemptSync();
      }
    });
  }

  /**
   * Queue an operation for synchronization
   * @param {string} operation - Operation type ('create', 'update', 'delete')
   * @param {string} entityType - Entity type ('lead', 'call')
   * @param {*} data - Operation data
   * @param {string|number} id - Entity ID (for update/delete)
   */
  queueOperation(operation, entityType, data, id = null) {
    // Create a unique ID for this operation
    const operationId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Add to queue
    this.syncQueue.push({
      id: operationId,
      operation,
      entityType,
      data,
      entityId: id,
      timestamp: Date.now(),
      attempts: 0
    });
    
    // Save the updated queue
    this._saveSyncQueue();
    
    // Try to sync immediately if online
    if (this.isOnline) {
      this.attemptSync();
    }
  }

  /**
   * Attempt to synchronize all queued operations
   * @returns {Promise<boolean>} Success status
   */
  async attemptSync() {
    // Don't attempt to sync if offline or already syncing
    if (!this.isOnline || this.isSyncing) {
      return false;
    }
    
    // No operations to sync
    if (this.syncQueue.length === 0) {
      return true;
    }
    
    this.isSyncing = true;
    
    try {
      // Process operations in order (oldest first)
      const sortedQueue = [...this.syncQueue].sort((a, b) => a.timestamp - b.timestamp);
      
      for (const operation of sortedQueue) {
        try {
          // Increment attempt counter
          operation.attempts++;
          
          // Process based on operation type
          await this._processOperation(operation);
          
          // If successful, remove from queue
          this.syncQueue = this.syncQueue.filter(op => op.id !== operation.id);
        } catch (error) {
          console.error(`Error syncing operation ${operation.id}:`, error);
          
          // If too many attempts, mark as failed
          if (operation.attempts >= 5) {
            // Move to failed operations
            this._markOperationAsFailed(operation, error.message);
            
            // Remove from queue
            this.syncQueue = this.syncQueue.filter(op => op.id !== operation.id);
          }
        }
      }
      
      // Save the updated queue
      this._saveSyncQueue();
      
      return true;
    } catch (error) {
      console.error('Error during sync:', error);
      return false;
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Process a single operation
   * @private
   * @param {Object} operation - Operation to process
   * @returns {Promise<void>}
   */
  async _processOperation(operation) {
    const { entityType, operation: opType, data, entityId } = operation;
    
    if (entityType === 'lead') {
      switch (opType) {
        case 'create':
          await this.apiClient.createLead(data);
          break;
        case 'update':
          await this.apiClient.updateLead(entityId, data);
          break;
        case 'delete':
          await this.apiClient.deleteLead(entityId);
          break;
      }
    } else if (entityType === 'call') {
      switch (opType) {
        case 'create':
          await this.apiClient.createCall(data);
          break;
        case 'update':
          await this.apiClient.updateCall(entityId, data);
          break;
      }
    }
  }

  /**
   * Mark an operation as failed
   * @private
   * @param {Object} operation - Failed operation
   * @param {string} errorMessage - Error message
   */
  _markOperationAsFailed(operation, errorMessage) {
    const failedOps = this.storageManager.get('failed_operations', []);
    
    failedOps.push({
      ...operation,
      error: errorMessage,
      failedAt: Date.now()
    });
    
    this.storageManager.set('failed_operations', failedOps);
  }

  /**
   * Load the sync queue from storage
   * @private
   * @returns {Array} Sync queue
   */
  _loadSyncQueue() {
    return this.storageManager.get('sync_queue', []);
  }

  /**
   * Save the sync queue to storage
   * @private
   */
  _saveSyncQueue() {
    this.storageManager.set('sync_queue', this.syncQueue);
  }

  /**
   * Get the current sync queue
   * @returns {Array} Current sync queue
   */
  getSyncQueue() {
    return [...this.syncQueue];
  }

  /**
   * Get failed operations
   * @returns {Array} Failed operations
   */
  getFailedOperations() {
    return this.storageManager.get('failed_operations', []);
  }

  /**
   * Clear failed operations
   */
  clearFailedOperations() {
    this.storageManager.set('failed_operations', []);
  }

  /**
   * Retry a specific failed operation
   * @param {string} operationId - ID of the operation to retry
   * @returns {Promise<boolean>} Success status
   */
  async retryFailedOperation(operationId) {
    const failedOps = this.getFailedOperations();
    const operation = failedOps.find(op => op.id === operationId);
    
    if (!operation) {
      return false;
    }
    
    // Remove from failed operations
    this.storageManager.set(
      'failed_operations',
      failedOps.filter(op => op.id !== operationId)
    );
    
    // Reset attempt count and requeue
    operation.attempts = 0;
    this.syncQueue.push(operation);
    this._saveSyncQueue();
    
    // Attempt to sync
    if (this.isOnline) {
      return this.attemptSync();
    }
    
    return true;
  }

  /**
   * Get the online/offline status
   * @returns {boolean} True if online
   */
  getOnlineStatus() {
    return this.isOnline;
  }
}