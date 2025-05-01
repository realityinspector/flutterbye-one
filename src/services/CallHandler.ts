/**
 * CallHandler.ts
 * A service to manage phone call functionality using CallKeep (iOS) and InCallManager (Android)
 * This enables automatic logging of outbound calls for Task #7
 */

import { Platform } from 'react-native';
import CallKeep from 'react-native-callkeep';
import InCallManager from 'react-native-incall-manager';
import { Call, NewCall } from '../../shared/db/zod-schema';
import axios from 'axios';
import syncService from './SyncService';

// Define the event types for CallKeep to fix TypeScript errors
type CallKeepEventTypes = 'didPerformEndCallAction' | 'didPerformSetMutedCallAction' | 'didActivateAudioSession';

// Base URL for API
const API_URL = 'http://localhost:5000/api';

// Call service axios instance
const callsAxios = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

interface CallOptions {
  leadId: number;
  userId: number;
  phoneNumber: string;
  leadName?: string;
}

class CallHandlerService {
  private initialized = false;
  private currentCallId: string | null = null;
  private callStartTime: number | null = null;
  private activeCallData: CallOptions | null = null;
  
  constructor() {
    this.setup();
  }
  
  /**
   * Setup CallKeep for iOS and any needed configuration
   */
  async setup() {
    if (this.initialized) return;
    
    // Setup CallKeep for iOS
    if (Platform.OS === 'ios') {
      try {
        await CallKeep.setup({
          ios: {
            appName: 'WalkNTalk CRM',
            supportsVideo: false,
            maximumCallGroups: '1',
            maximumCallsPerCallGroup: '1',
          },
          android: {
            alertTitle: 'Permissions required',
            alertDescription: 'This application needs to access your phone accounts',
            cancelButton: 'Cancel',
            okButton: 'Ok',
            additionalPermissions: [],
            selfManaged: false,
          },
        });
        
        // Register event listeners
        CallKeep.addEventListener('didPerformEndCallAction' as CallKeepEventTypes, this.onEndCall);
        CallKeep.addEventListener('didPerformSetMutedCallAction' as CallKeepEventTypes, this.onMuteCall);
        CallKeep.addEventListener('didActivateAudioSession' as CallKeepEventTypes, this.onAudioSessionActivated);
      } catch (err) {
        console.error('CallKeep setup error:', err);
      }
    }
    
    this.initialized = true;
  }
  
  /**
   * Start an outbound call
   */
  startCall = async (options: CallOptions): Promise<string> => {
    await this.setup();
    
    const callUUID = Math.random().toString(36).substring(2, 15);
    this.currentCallId = callUUID;
    this.callStartTime = Date.now();
    this.activeCallData = options;
    
    if (Platform.OS === 'ios') {
      // iOS: Use CallKeep
      try {
        await CallKeep.startCall(callUUID, options.phoneNumber, options.leadName || 'Unknown', 'number', false);
      } catch (err) {
        console.error('CallKeep startCall error:', err);
      }
    } else {
      // Android: Use InCallManager
      try {
        InCallManager.start({media: 'audio', auto: true, ringback: '_BUNDLE_'});
      } catch (err) {
        console.error('InCallManager start error:', err);
      }
    }
    
    return callUUID;
  };
  
  /**
   * End the current call
   */
  endCall = async (): Promise<void> => {
    if (!this.currentCallId) return;
    
    if (Platform.OS === 'ios') {
      // iOS: End via CallKeep
      try {
        await CallKeep.endCall(this.currentCallId);
      } catch (err) {
        console.error('CallKeep endCall error:', err);
      }
    } else {
      // Android: Stop InCallManager
      try {
        InCallManager.stop();
      } catch (err) {
        console.error('InCallManager stop error:', err);
      }
    }
    
    // Log the call to the server
    await this.logCallToServer();
    
    // Reset call data
    this.currentCallId = null;
    this.callStartTime = null;
    this.activeCallData = null;
  };
  
  /**
   * Handle call end event from CallKeep
   */
  onEndCall = async ({callUUID}: {callUUID: string}) => {
    if (callUUID === this.currentCallId) {
      // Log the call to the server
      await this.logCallToServer();
      
      // Reset call data
      this.currentCallId = null;
      this.callStartTime = null;
      this.activeCallData = null;
    }
  };
  
  /**
   * Handle mute action from CallKeep
   */
  onMuteCall = ({muted, callUUID}: {muted: boolean, callUUID: string}) => {
    if (callUUID === this.currentCallId) {
      if (Platform.OS === 'ios') {
        // Handle iOS mute via CallKeep
      } else {
        // Handle Android mute via InCallManager
        InCallManager.setMicrophoneMute(muted);
      }
    }
  };
  
  /**
   * Handle audio session activation (iOS)
   */
  onAudioSessionActivated = () => {
    // Audio session is activated
    console.log('Audio session activated');
  };
  
  /**
   * Log the call details to the server after call ends
   */
  logCallToServer = async (): Promise<void> => {
    if (!this.callStartTime || !this.activeCallData) return;
    
    const callDuration = Math.floor((Date.now() - this.callStartTime) / 1000); // Duration in seconds
    const { leadId, userId } = this.activeCallData;
    
    // Create a new call record
    const newCall: NewCall = {
      userLeadId: leadId,
      userId: userId,
      callDate: new Date(),
      duration: callDuration,
      notes: `Auto-logged call, ${callDuration} seconds`,
      outcome: 'completed', // Default outcome
    };
    
    try {
      // Attempt to send directly to server
      if (syncService.getOnlineStatus()) {
        const response = await callsAxios.post<{success: boolean, data: Call}>('/calls', newCall);
        console.log('Call logged successfully:', response.data);
      } else {
        // If offline, store for later sync
        await syncService.saveOfflineCall(newCall);
        console.log('Call saved for offline sync');
      }
    } catch (error) {
      console.error('Error logging call:', error);
      // Store for offline logging if server request failed
      try {
        await syncService.saveOfflineCall(newCall);
        console.log('Call saved for offline sync after server error');
      } catch (offlineError) {
        console.error('Failed to save call for offline sync:', offlineError);
      }
    }
  };
  
  /**
   * Check if a call is currently active
   */
  isCallActive = (): boolean => {
    return this.currentCallId !== null;
  };
  
  /**
   * Get the current call duration in seconds
   */
  getCurrentCallDuration = (): number => {
    if (!this.callStartTime) return 0;
    return Math.floor((Date.now() - this.callStartTime) / 1000);
  };
  
  /**
   * Clean up event listeners when the service is no longer needed
   */
  cleanup = () => {
    if (Platform.OS === 'ios') {
      CallKeep.removeEventListener('didPerformEndCallAction' as CallKeepEventTypes);
      CallKeep.removeEventListener('didPerformSetMutedCallAction' as CallKeepEventTypes);
      CallKeep.removeEventListener('didActivateAudioSession' as CallKeepEventTypes);
    }
  };
}

// Singleton instance
const CallHandler = new CallHandlerService();
export default CallHandler;