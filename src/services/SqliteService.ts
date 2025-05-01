/**
 * SqliteService.ts
 * This service implements offline SQLite storage for calls that can't be logged immediately
 * Part of Task #8 - creating an offline queue for data syncing
 */

// @ts-ignore
import * as SQLite from 'expo-sqlite';
import { NewCall, Call } from '../../shared/db/zod-schema';

const DB_NAME = 'offlinedata.db';
type SyncStatus = 'pending' | 'syncing' | 'completed' | 'failed';

// Define our offline call structure with necessary fields for syncing
interface OfflineCall {
  localId?: number;
  id?: number;
  userLeadId: number;
  userId: number;
  callDate: Date;
  duration?: number;
  outcome?: string;
  notes?: string;
  reminderDate?: Date;
  syncStatus: SyncStatus;
  createdAt: string;
  errorMessage?: string;
  retryCount: number;
}

class SqliteService {
  private db: any; // Using any type to work around expo-sqlite type issues
  
  constructor() {
    // Open database
    this.db = SQLite.openDatabase(DB_NAME);
    this.setupDatabase();
  }
  
  /**
   * Set up the database schema
   */
  private async setupDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.transaction(
        (tx) => {
          // Create offline calls table
          tx.executeSql(
            `CREATE TABLE IF NOT EXISTS offline_calls (
              localId INTEGER PRIMARY KEY AUTOINCREMENT,
              id INTEGER,
              userLeadId INTEGER NOT NULL,
              userId INTEGER NOT NULL,
              callDate TEXT NOT NULL,
              duration INTEGER,
              outcome TEXT,
              notes TEXT,
              reminderDate TEXT,
              syncStatus TEXT NOT NULL,
              createdAt TEXT NOT NULL,
              errorMessage TEXT,
              retryCount INTEGER NOT NULL DEFAULT 0
            );`
          );
        },
        (error) => {
          console.error('Error setting up database:', error);
          reject(error);
        },
        () => {
          console.log('Database setup complete');
          resolve();
        }
      );
    });
  }
  
  /**
   * Convert a NewCall to an OfflineCall for storage
   */
  private convertToOfflineCall(callData: NewCall): OfflineCall {
    return {
      userLeadId: callData.userLeadId,
      userId: callData.userId,
      callDate: callData.callDate,
      duration: callData.duration,
      outcome: callData.outcome,
      notes: callData.notes,
      reminderDate: callData.reminderDate,
      syncStatus: 'pending',
      createdAt: new Date().toISOString(),
      retryCount: 0
    };
  }
  
  /**
   * Save a call record for offline storage when online sync fails
   */
  async saveOfflineCall(callData: NewCall): Promise<number> {
    return new Promise((resolve, reject) => {
      const offlineCall = this.convertToOfflineCall(callData);
      
      this.db.transaction(
        (tx) => {
          tx.executeSql(
            `INSERT INTO offline_calls 
            (userLeadId, userId, callDate, duration, outcome, notes, reminderDate, syncStatus, createdAt, retryCount)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              offlineCall.userLeadId,
              offlineCall.userId,
              offlineCall.callDate.toISOString(),
              offlineCall.duration || null,
              offlineCall.outcome || null,
              offlineCall.notes || null,
              offlineCall.reminderDate ? offlineCall.reminderDate.toISOString() : null,
              offlineCall.syncStatus,
              offlineCall.createdAt,
              offlineCall.retryCount,
            ],
            (_, result) => {
              console.log('Call saved for offline sync, localId:', result.insertId);
              resolve(result.insertId);
            }
          );
        },
        (error) => {
          console.error('Error saving offline call:', error);
          reject(error);
        }
      );
    });
  }
  
  /**
   * Get all pending offline calls that need to be synced
   */
  async getPendingCalls(): Promise<OfflineCall[]> {
    return new Promise((resolve, reject) => {
      this.db.transaction(
        (tx) => {
          tx.executeSql(
            'SELECT * FROM offline_calls WHERE syncStatus = ? ORDER BY createdAt ASC',
            ['pending'],
            (_, result) => {
              const calls: OfflineCall[] = [];
              for (let i = 0; i < result.rows.length; i++) {
                const row = result.rows.item(i);
                calls.push({
                  localId: row.localId,
                  id: row.id,
                  userLeadId: row.userLeadId,
                  userId: row.userId,
                  callDate: new Date(row.callDate),
                  duration: row.duration,
                  outcome: row.outcome,
                  notes: row.notes,
                  reminderDate: row.reminderDate ? new Date(row.reminderDate) : undefined,
                  syncStatus: row.syncStatus as SyncStatus,
                  createdAt: row.createdAt,
                  errorMessage: row.errorMessage,
                  retryCount: row.retryCount,
                });
              }
              resolve(calls);
            }
          );
        },
        (error) => {
          console.error('Error getting pending calls:', error);
          reject(error);
        }
      );
    });
  }
  
  /**
   * Update the sync status of a call
   */
  async updateCallSyncStatus(localId: number, status: SyncStatus, serverId?: number, errorMessage?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.transaction(
        (tx) => {
          let query = 'UPDATE offline_calls SET syncStatus = ?';
          const params: any[] = [status];
          
          if (serverId !== undefined) {
            query += ', id = ?';
            params.push(serverId);
          }
          
          if (errorMessage !== undefined) {
            query += ', errorMessage = ?, retryCount = retryCount + 1';
            params.push(errorMessage);
          }
          
          query += ' WHERE localId = ?';
          params.push(localId);
          
          tx.executeSql(
            query,
            params,
            (_, result) => {
              console.log(`Call sync status updated: ${status}`);
              resolve();
            }
          );
        },
        (error) => {
          console.error('Error updating call sync status:', error);
          reject(error);
        }
      );
    });
  }
  
  /**
   * Delete a call that has been successfully synced
   */
  async deleteCompletedCall(localId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.transaction(
        (tx) => {
          tx.executeSql(
            'DELETE FROM offline_calls WHERE localId = ? AND syncStatus = ?',
            [localId, 'completed'],
            (_, result) => {
              console.log(`Call deleted from offline storage: ${localId}`);
              resolve();
            }
          );
        },
        (error) => {
          console.error('Error deleting completed call:', error);
          reject(error);
        }
      );
    });
  }
}

// Create a singleton instance
const sqliteService = new SqliteService();
export default sqliteService;