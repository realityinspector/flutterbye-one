import React from 'react';
import {
  Box,
  HStack,
  VStack,
  Text,
  Icon,
  Badge,
  Spacer,
} from 'native-base';
import { Feather } from '@expo/vector-icons';

/**
 * LeadCard component displays a lead with contact info and status
 * 
 * @param {Object} props Component props
 * @param {Object} props.lead Lead data object
 * @param {Function} props.onPress Optional callback when card is pressed
 * @param {React.ReactNode} props.rightElement Optional element to render on the right side
 * @param {boolean} props.showStatus Whether to show the lead status
 */
const LeadCard = ({
  lead,
  onPress,
  rightElement,
  showStatus = false,
}) => {
  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'new': return 'info';
      case 'contacted': return 'warning';
      case 'qualified': return 'success';
      case 'unqualified': return 'error';
      case 'converted': return 'purple';
      default: return 'gray';
    }
  };

  // Format priority level
  const getPriorityText = (priority) => {
    if (priority >= 8) return 'High';
    if (priority >= 4) return 'Medium';
    return 'Low';
  };

  // Format priority color
  const getPriorityColor = (priority) => {
    if (priority >= 8) return 'error';
    if (priority >= 4) return 'warning';
    return 'success';
  };

  // Display company name or contact name if company is missing
  const displayName = lead.globalLead?.companyName || lead.globalLead?.contactName || 'Unknown';
  
  // Format phone number for display
  const formatPhoneNumber = (phoneNumber) => {
    if (!phoneNumber) return '';
    // Simple formatting, could be enhanced with library like libphonenumber-js
    const cleaned = phoneNumber.replace(/\D/g, '');
    return cleaned;
  };

  return (
    <Box 
      bg="white" 
      p={4} 
      rounded="md"
      borderWidth={1}
      borderColor="gray.100"
      shadow={1}
    >
      <HStack space={3} alignItems="flex-start">
        <Box rounded="full" bg="primary.100" p={2}>
          <Icon as={Feather} name="briefcase" size={5} color="primary.600" />
        </Box>
        
        <VStack space={1} flex={1}>
          <HStack alignItems="center" justifyContent="space-between">
            <Text bold numberOfLines={1} fontSize="md" maxW="70%">
              {displayName}
            </Text>
            
            {rightElement || (
              <Badge 
                colorScheme={getPriorityColor(lead.priority)} 
                variant="solid" 
                rounded="md"
              >
                {getPriorityText(lead.priority)}
              </Badge>
            )}
          </HStack>
          
          <HStack alignItems="center" space={1}>
            <Icon as={Feather} name="user" size={3} color="gray.500" />
            <Text color="gray.600" fontSize="sm">
              {lead.globalLead?.contactName || 'No contact name'}
            </Text>
          </HStack>
          
          {lead.globalLead?.phoneNumber && (
            <HStack alignItems="center" space={1}>
              <Icon as={Feather} name="phone" size={3} color="gray.500" />
              <Text color="gray.600" fontSize="sm">
                {formatPhoneNumber(lead.globalLead.phoneNumber)}
              </Text>
            </HStack>
          )}
          
          {lead.globalLead?.email && (
            <HStack alignItems="center" space={1}>
              <Icon as={Feather} name="mail" size={3} color="gray.500" />
              <Text color="gray.600" fontSize="sm" numberOfLines={1}>
                {lead.globalLead.email}
              </Text>
            </HStack>
          )}
          
          {/* Optional status badge */}
          {showStatus && (
            <HStack space={2} mt={1}>
              <Badge colorScheme={getStatusColor(lead.status)} variant="subtle">
                {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
              </Badge>
              
              {lead.reminderDate && new Date(lead.reminderDate) > new Date() && (
                <HStack alignItems="center" space={1}>
                  <Icon as={Feather} name="clock" size={3} color="amber.500" />
                  <Text color="amber.500" fontSize="xs">
                    Reminder: {new Date(lead.reminderDate).toLocaleDateString()}
                  </Text>
                </HStack>
              )}
            </HStack>
          )}
        </VStack>
      </HStack>
    </Box>
  );
};

export default LeadCard;