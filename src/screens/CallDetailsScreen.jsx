import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput,
  Alert,
  ActivityIndicator,
  Modal
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import IncallManager from 'react-native-incall-manager';

// Import our shared models and React Native adapters
import { Call } from '../../shared/models/Call';
import { Lead } from '../../shared/models/Lead';
import { 
  ReactNativeAPIAdapter,
  ReactNativeStorageAdapter,
  ReactNativeUIAdapters
} from '../../shared/adapters/ReactNativeAdapter';

// Create our API and storage instances
const apiClient = new ReactNativeAPIAdapter('https://api.flutterbye.com');
const storageManager = new ReactNativeStorageAdapter('flutterbye');

const CallDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { leadId } = route.params;
  
  const [lead, setLead] = useState(null);
  const [call, setCall] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [timer, setTimer] = useState(0);
  const [isCallActive, setIsCallActive] = useState(false);
  const [showEndCallModal, setShowEndCallModal] = useState(false);
  const [callOutcome, setCallOutcome] = useState(null);
  const [callNotes, setCallNotes] = useState('');
  
  const timerInterval = useRef(null);
  
  useEffect(() => {
    // Load lead data when the component mounts
    loadLead();
    
    // Clean up function to ensure the call is ended if the user navigates away
    return () => {
      if (isCallActive) {
        endCall('cancelled', 'User navigated away');
      }
      
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    };
  }, [leadId]);
  
  /**
   * Load lead data from API
   */
  const loadLead = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check for authentication token
      const authToken = await storageManager.get('authToken');
      if (authToken) {
        apiClient.setAuthToken(authToken);
      } else {
        // Redirect to login if not authenticated
        navigation.navigate('Login');
        return;
      }
      
      // Fetch lead from API
      const leadData = await apiClient.getLead(leadId);
      const leadObject = new Lead(leadData);
      setLead(leadObject);
      
      setLoading(false);
    } catch (err) {
      setError('Failed to load lead information: ' + err.message);
      setLoading(false);
    }
  };
  
  /**
   * Start a call to the lead
   */
  const startCall = async () => {
    try {
      // Create a new call object
      const newCall = new Call({
        leadId: leadId,
        startTime: new Date(),
        status: 'active',
        direction: 'outbound'
      });
      
      // Validate the call data
      newCall.validate();
      
      // Start call audio handling
      IncallManager.start({media: 'audio', auto: true, ringback: '_BUNDLE_'});
      
      // Save to API
      const savedCall = await apiClient.createCall(newCall);
      setCall(savedCall);
      
      // Update UI
      setIsCallActive(true);
      
      // Start timer
      startTimer();
      
      // Alert to inform the user
      Alert.alert(
        "Call Started",
        `Calling ${lead.getDisplayName()}...`,
        [{ text: "OK" }]
      );
    } catch (err) {
      Alert.alert("Error", `Failed to start call: ${err.message}`);
    }
  };
  
  /**
   * End the current call
   */
  const endCall = async (outcome = null, notes = null) => {
    try {
      if (!call) return;
      
      // Stop the timer
      stopTimer();
      
      // Stop call audio handling
      IncallManager.stop();
      
      // Update the call object
      const updatedCall = new Call({
        ...call,
        endTime: new Date(),
        status: 'completed',
        outcome: outcome || callOutcome,
        notes: notes || callNotes
      });
      
      // Save to API
      await apiClient.updateCall(call.id, updatedCall.toJSON());
      
      // Update UI
      setIsCallActive(false);
      setShowEndCallModal(false);
      
      // Navigate back
      navigation.goBack();
      
      // Alert to inform the user
      Alert.alert(
        "Call Ended",
        `Call with ${lead.getDisplayName()} has ended.`,
        [{ text: "OK" }]
      );
    } catch (err) {
      Alert.alert("Error", `Failed to end call: ${err.message}`);
    }
  };
  
  /**
   * Start the call timer
   */
  const startTimer = () => {
    setTimer(0);
    timerInterval.current = setInterval(() => {
      setTimer(prevTimer => prevTimer + 1);
    }, 1000);
  };
  
  /**
   * Stop the call timer
   */
  const stopTimer = () => {
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
      timerInterval.current = null;
    }
  };
  
  /**
   * Format timer as MM:SS
   */
  const formatTimer = () => {
    const minutes = Math.floor(timer / 60);
    const seconds = timer % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  /**
   * Show the end call modal
   */
  const showEndCallOptions = () => {
    setShowEndCallModal(true);
  };
  
  /**
   * Cancel ending the call
   */
  const cancelEndCall = () => {
    setShowEndCallModal(false);
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Loading lead information...</Text>
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={loadLead}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  if (!lead) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Lead not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.retryText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isCallActive ? 'Call in Progress' : 'Call Lead'}
        </Text>
      </View>
      
      <View style={styles.leadInfoCard}>
        <Text style={styles.companyName}>{lead.getDisplayName()}</Text>
        
        {lead.getContactName() && (
          <Text style={styles.contactName}>{lead.getContactName()}</Text>
        )}
        
        {lead.getPhoneNumber() && (
          <Text style={styles.phoneNumber}>
            {ReactNativeUIAdapters.formatPhoneNumber(lead.getPhoneNumber())}
          </Text>
        )}
        
        <View style={styles.statusContainer}>
          <Text style={styles.statusLabel}>Status:</Text>
          <View 
            style={[
              styles.statusBadge, 
              { backgroundColor: ReactNativeUIAdapters.formatStatus(lead.status).color }
            ]}
          >
            <Text style={styles.statusText}>
              {ReactNativeUIAdapters.formatStatus(lead.status).text}
            </Text>
          </View>
        </View>
      </View>
      
      {isCallActive ? (
        <View style={styles.activeCallContainer}>
          <View style={styles.timerContainer}>
            <Text style={styles.timerLabel}>Call Duration:</Text>
            <Text style={styles.timer}>{formatTimer()}</Text>
          </View>
          
          <TouchableOpacity
            style={styles.endCallButton}
            onPress={showEndCallOptions}
          >
            <Ionicons name="call" size={24} color="white" />
            <Text style={styles.endCallText}>End Call</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.startCallContainer}>
          <Text style={styles.callInstructions}>
            Press the button below to start a call with this lead.
          </Text>
          
          <TouchableOpacity
            style={styles.startCallButton}
            onPress={startCall}
          >
            <Ionicons name="call" size={24} color="white" />
            <Text style={styles.startCallText}>Start Call</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* End Call Modal */}
      <Modal
        visible={showEndCallModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>End Call</Text>
            
            <Text style={styles.modalLabel}>Call Outcome:</Text>
            <View style={styles.outcomeOptions}>
              {['interested', 'not-interested', 'callback', 'no-answer', 'voicemail'].map((outcome) => (
                <TouchableOpacity
                  key={outcome}
                  style={[
                    styles.outcomeOption,
                    callOutcome === outcome && styles.selectedOutcome
                  ]}
                  onPress={() => setCallOutcome(outcome)}
                >
                  <Text 
                    style={[
                      styles.outcomeText,
                      callOutcome === outcome && styles.selectedOutcomeText
                    ]}
                  >
                    {outcome.charAt(0).toUpperCase() + outcome.slice(1).replace('-', ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <Text style={styles.modalLabel}>Notes:</Text>
            <TextInput
              style={styles.notesInput}
              multiline
              placeholder="Add notes about this call..."
              value={callNotes}
              onChangeText={setCallNotes}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={cancelEndCall}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.confirmButton,
                  !callOutcome && styles.disabledButton
                ]}
                disabled={!callOutcome}
                onPress={() => endCall()}
              >
                <Text style={styles.confirmButtonText}>End Call</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#555',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    color: '#c62828',
    fontSize: 16,
    marginBottom: 16,
  },
  retryText: {
    color: '#2196f3',
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  leadInfoCard: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  companyName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  contactName: {
    fontSize: 16,
    marginBottom: 8,
  },
  phoneNumber: {
    fontSize: 16,
    color: '#3498db',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  statusLabel: {
    fontSize: 14,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  startCallContainer: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  callInstructions: {
    textAlign: 'center',
    marginBottom: 16,
    color: '#555',
  },
  startCallButton: {
    backgroundColor: '#27ae60',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  startCallText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  activeCallContainer: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  timerLabel: {
    fontSize: 14,
    color: '#555',
  },
  timer: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333',
  },
  endCallButton: {
    backgroundColor: '#c0392b',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  endCallText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  outcomeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  outcomeOption: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    margin: 4,
  },
  outcomeText: {
    color: '#333',
  },
  selectedOutcome: {
    backgroundColor: '#3498db',
  },
  selectedOutcomeText: {
    color: 'white',
  },
  notesInput: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 12,
    height: 100,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: 'bold',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#3498db',
    padding: 12,
    borderRadius: 8,
    marginLeft: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#95a5a6',
  },
});

export default CallDetailsScreen;