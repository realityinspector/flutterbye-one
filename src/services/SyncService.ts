/**
 * SyncService.ts
 * Service to manage the synchronization of offline data with the server
 * Part of Task #8 - implementing offline SQLite queue
 */

import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import axios from 'axios';
import { Call, NewCall } from '../../shared/db/zod-schema';
import sqliteService from './SqliteService';

// Base URL for API
const API_URL = 'http://localhost:5000/api';

// Sync service axios instance
const syncAxios = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

class SyncService {
  private isOnline: boolean = true;
  private isSyncing: boolean = false;
  private syncIntervalId: ReturnType<typeof setInterval> | null = null;
  
  constructor() {
    this.monitorNetworkStatus();
    this.startSyncInterval();
  }
  
  /**
   * Monitor network connectivity changes
   */
  private monitorNetworkStatus() {
    // Check current network status
    NetInfo.fetch().then(state => {
      this.isOnline = state.isConnected || false;
      console.log('Initial network status:', this.isOnline ? 'online' : 'offline');
    });

    // Subscribe to network status changes
    NetInfo.addEventListener(state => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected || false;
      
      console.log('Network status changed:', this.isOnline ? 'online' : 'offline');
      
      // If we just came back online, trigger a sync
      if (!wasOnline && this.isOnline) {
        console.log('Network reconnected, triggering sync');
        this.syncOfflineData();
      }
    });
  }
  
  /**
   * Start periodic sync interval
   */
  private startSyncInterval() {
    // Try to sync every 5 minutes
    this.syncIntervalId = setInterval(() => {
      if (this.isOnline && !this.isSyncing) {
        this.syncOfflineData();
      }
    }, 5 * 60 * 1000);
  }
  
  /**
   * Stop sync interval
   */
  public stopSyncInterval() {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
      this.syncIntervalId = null;
    }
  }
  
  /**
   * Save call data when offline or when server request fails
   */
  public async saveOfflineCall(callData: NewCall): Promise<void> {
    try {
      await sqliteService.saveOfflineCall(callData);
      
      // If we're online, try to sync immediately
      if (this.isOnline) {
        this.syncOfflineData();
      }
    } catch (error) {
      console.error('Error saving offline call:', error);
    }
  }
  
  /**
   * Synchronize all pending offline data with the server
   */
  public async syncOfflineData(): Promise<void> {
    if (this.isSyncing || !this.isOnline) return;
    
    this.isSyncing = true;
    console.log('Starting data sync...');
    
    try {
      // Get all pending calls
      const pendingCalls = await sqliteService.getPendingCalls();
      console.log(`Found ${pendingCalls.length} pending calls to sync`);
      
      // Sync each call
      for (const call of pendingCalls) {
        try {
          // Update status to syncing
          await sqliteService.updateCallSyncStatus(call.localId!, 'syncing');
          
          // Create call data for API
          // Create call data for API and properly type the outcome
          const callData: NewCall = {
            userLeadId: call.userLeadId,
            userId: call.userId,
            callDate: call.callDate,
            duration: call.duration,
            outcome: call.outcome as "completed" | "interested" | "not_interested" | "callback" | "voicemail" | "no_answer" | "left_message" | undefined,
            notes: call.notes,
            reminderDate: call.reminderDate,
          };
          
          // Send to server
          const response = await syncAxios.post<{success: boolean, data: Call}>('/calls', callData);
          
          if (response.data.success) {
            // Update with server ID and mark as completed
            await sqliteService.updateCallSyncStatus(call.localId!, 'completed', response.data.data.id);
            
            // After successful sync, remove the call from offline storage
            await sqliteService.deleteCompletedCall(call.localId!);
            
            console.log(`Successfully synced call ${call.localId} to server, received ID ${response.data.data.id}`);
          } else {
            // Mark as failed with error message
            await sqliteService.updateCallSyncStatus(
              call.localId!, 
              'failed', 
              undefined, 
              'Server returned non-success response'
            );
          }
        } catch (error) {
          // Mark as failed
          const errorMessage = error instanceof Error ? error.message : 'Unknown error during sync';
          await sqliteService.updateCallSyncStatus(call.localId!, 'failed', undefined, errorMessage);
          console.error(`Failed to sync call ${call.localId}:`, error);
        }
      }
      
      console.log('Sync completed');
    } catch (error) {
      console.error('Error during sync process:', error);
    } finally {
      this.isSyncing = false;
    }
  }
  
  /**
   * Check if the device is currently online
   */
  public getOnlineStatus(): boolean {
    return this.isOnline;
  }
}

// Create a singleton instance
const syncService = new SyncService();
export default syncService;