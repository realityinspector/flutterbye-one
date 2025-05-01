/**
 * ShareCallRecap.tsx
 * Viral hook component for sharing call recaps with prospects via text message
 */

import React, { useState, useEffect } from 'react';
import { View, Modal, Text, TextInput, StyleSheet, TouchableOpacity, Alert, Share, Platform } from 'react-native';
import { UserLeadWithRelations, Call } from '../types';

interface ShareCallRecapProps {
  call: Call;
  lead?: UserLeadWithRelations;
  isVisible: boolean;
  onClose: () => void;
  userName?: string;
}

const ShareCallRecap: React.FC<ShareCallRecapProps> = ({ call, lead, isVisible, onClose, userName }) => {
  const [message, setMessage] = useState('');
  
  useEffect(() => {
    // Initialize the message when props change
    setMessage(
      `Hi ${lead?.globalLead?.contactName || 'there'},\n\nThanks for our call today. As promised, here's a quick recap:\n\n${call.notes || 'We discussed your needs and next steps.'}\n\nI'll follow up as discussed${call.reminderDate ? ` on ${new Date(call.reminderDate).toLocaleDateString()}` : ''}.\n\nBest regards,\n${userName || ''}`
    );
  }, [call, lead, userName]);

  const handleShare = async () => {
    try {
      // Get phone number from lead
      const phoneNumber = lead?.globalLead?.phoneNumber;
      
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        // Native sharing options
        const result = await Share.share({
          message: message,
          title: 'Call Recap'
        });
        
        if (result.action === Share.sharedAction) {
          // Shared successfully
          Alert.alert('Success', 'Recap shared successfully!');
          onClose();
        }
      } else {
        // Web fallback - copy to clipboard or use SMS link
        if (phoneNumber) {
          // Create SMS link with URI encoded message
          const encodedMessage = encodeURIComponent(message);
          const smsLink = `sms:${phoneNumber}?body=${encodedMessage}`;
          
          // Open SMS link in new window/tab
          window.open(smsLink, '_blank');
          onClose();
        } else {
          Alert.alert('Missing Phone Number', 'No phone number available for this lead.');
        }
      }
    } catch (error) {
      console.error('Error sharing recap:', error);
      Alert.alert('Error', 'Failed to share recap. Please try again.');
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>Text this recap to the prospect?</Text>
          
          <TextInput
            style={styles.messageInput}
            multiline
            value={message}
            onChangeText={setMessage}
          />
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.shareButton]}
              onPress={handleShare}
            >
              <Text style={styles.shareText}>Share Recap</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  modalView: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 500,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  messageInput: {
    width: '100%',
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    borderRadius: 8,
    padding: 12,
    minWidth: 120,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f2f2f2',
    marginRight: 10,
  },
  shareButton: {
    backgroundColor: '#4c6ef5',
  },
  cancelText: {
    color: '#333',
    fontWeight: '600',
  },
  shareText: {
    color: 'white',
    fontWeight: '600',
  },
});

export default ShareCallRecap;
