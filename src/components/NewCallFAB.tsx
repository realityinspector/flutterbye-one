import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Box, Icon, Pressable } from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import CallHandler from '../services/CallHandler';
import { useLeads } from '../hooks/useLeads';
import { UserLeadWithRelations } from '../types';

interface NewCallFABProps {
  leadId?: number;
}

/**
 * Floating Action Button for creating a new call
 * Present on all main screens per flattened navigation requirements
 */
const NewCallFAB: React.FC<NewCallFABProps> = ({ leadId }) => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { getLead } = useLeads();
  
  const handlePress = async () => {
    // If we have a lead ID, we're in the lead detail screen
    if (leadId && user) {
      try {
        // Get the lead data
        const lead = await getLead(leadId);
        if (lead && lead.globalLead) {
          // Start the call via CallHandler
          await CallHandler.startCall({
            leadId: lead.id,
            userId: user.id,
            phoneNumber: lead.globalLead.phoneNumber,
            leadName: lead.globalLead.contactName,
          });
          
          // Navigate to the active call screen
          // TODO: Create ActiveCallScreen
          // navigation.navigate('ActiveCall', { leadId: lead.id });
          
          // For now, just end the call after 5 seconds for demonstration
          setTimeout(() => {
            CallHandler.endCall();
          }, 5000);
        }
      } catch (error) {
        console.error('Error initiating call:', error);
      }
    } else {
      // Navigate to the new call screen where user can select a lead
      navigation.navigate('Leads' as never);
    }
  };
  
  return (
    <Box style={styles.fabContainer}>
      <Pressable
        style={styles.fab}
        onPress={handlePress}
        _pressed={{ opacity: 0.7 }}
      >
        <Icon
          as={MaterialIcons}
          name="call"
          color="white"
          size="lg"
        />
      </Pressable>
    </Box>
  );
};

const styles = StyleSheet.create({
  fabContainer: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    zIndex: 999,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0066ff', // Primary color
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

export default NewCallFAB;