import React from 'react';
import {
  Box,
  HStack,
  VStack,
  Text,
  Icon,
  Badge,
  Pressable,
  Button,
  IPressableProps
} from 'native-base';
import { Feather } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';
// Import the extended UserLead type
import { UserLeadWithRelations } from '../types';

interface LeadCardProps {
  lead: UserLeadWithRelations;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  showStatus?: boolean;
}

/**
 * LeadCard component displays a lead with contact info and status
 * Enhanced with interactive press feedback
 */
const LeadCard: React.FC<LeadCardProps> = ({
  lead,
  onPress,
  rightElement,
  showStatus = false,
}) => {
  // Get status badge color
  const getStatusColor = (status: string): string => {
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
  const getPriorityText = (priority: number): string => {
    if (priority >= 8) return 'High';
    if (priority >= 4) return 'Medium';
    return 'Low';
  };

  // Format priority color
  const getPriorityColor = (priority: number): string => {
    if (priority >= 8) return 'error';
    if (priority >= 4) return 'warning';
    return 'success';
  };

  // Display company name or contact name if company is missing
  const displayName = lead.globalLead?.companyName || lead.globalLead?.contactName || 'Unknown';
  
  // Format phone number for display
  const formatPhoneNumber = (phoneNumber: string | null | undefined): string => {
    if (!phoneNumber) return '';
    // Simple formatting, could be enhanced with library like libphonenumber-js
    const cleaned = phoneNumber.replace(/\D/g, '');
    return cleaned;
  };

  // Render the card content
  const cardContent = (
    <HStack space={3} alignItems="flex-start">
      <Box rounded="full" bg="secondary.100" p={2}>
        <Text color="primary.500" fontSize="xl">
          <Feather name="briefcase" />
        </Text>
      </Box>
      
      <VStack space={1} flex={1}>
        <HStack alignItems="center" justifyContent="space-between">
          <Text bold numberOfLines={1} fontSize="md" maxW="70%">
            {displayName}
          </Text>
          
          {rightElement || (
            <Box 
              bg={`${getPriorityColor(lead.priority)}.500`} 
              px={2} 
              py={1}
              rounded="md"
            >
              <Text color="white" fontSize="xs" fontWeight="bold">
                {getPriorityText(lead.priority)}
              </Text>
            </Box>
          )}
        </HStack>
        
        <HStack alignItems="center" space={1}>
          <Text color="text.700" fontSize="xs">
            <Feather name="user" size={12} />
          </Text>
          <Text color="text.700" fontSize="sm">
            {lead.globalLead?.contactName || 'No contact name'}
          </Text>
        </HStack>
        
        {lead.globalLead?.phoneNumber && (
          <HStack alignItems="center" space={1}>
            <Text color="text.700" fontSize="xs">
              <Feather name="phone" size={12} />
            </Text>
            <Text color="text.700" fontSize="sm">
              {formatPhoneNumber(lead.globalLead.phoneNumber)}
            </Text>
          </HStack>
        )}
        
        {lead.globalLead?.email && (
          <HStack alignItems="center" space={1}>
            <Text color="text.700" fontSize="xs">
              <Feather name="mail" size={12} />
            </Text>
            <Text color="text.700" fontSize="sm" numberOfLines={1}>
              {lead.globalLead.email}
            </Text>
          </HStack>
        )}
        
        {/* Optional status badge */}
        {showStatus && (
          <HStack space={2} mt={1} flexWrap="wrap">
            <Box
              bg={`${getStatusColor(lead.status)}.100`}
              px={2}
              py={1}
              rounded="md"
            >
              <Text color={`${getStatusColor(lead.status)}.700`} fontSize="xs" fontWeight="medium">
                {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
              </Text>
            </Box>
            
            {/* Team/Personal indicator */}
            {lead.isShared && lead.organizationId ? (
              <Badge colorScheme="blue" variant="subtle" rounded="md">
                <HStack space={1} alignItems="center">
                  <Icon as={MaterialIcons} name="people" size={3} />
                  <Text fontSize="xs">Team</Text>
                </HStack>
              </Badge>
            ) : (
              <Badge colorScheme="gray" variant="subtle" rounded="md">
                <HStack space={1} alignItems="center">
                  <Icon as={MaterialIcons} name="person" size={3} />
                  <Text fontSize="xs">Personal</Text>
                </HStack>
              </Badge>
            )}
            
            {lead.reminderDate && new Date(lead.reminderDate) > new Date() && (
              <HStack alignItems="center" space={1}>
                <Text color="warning.500" fontSize="xs">
                  <Feather name="clock" size={12} />
                </Text>
                <Text color="warning.500" fontSize="xs">
                  Reminder: {new Date(lead.reminderDate).toLocaleDateString()}
                </Text>
              </HStack>
            )}
          </HStack>
        )}
      </VStack>
    </HStack>
  );

  // If there's an onPress handler, wrap the content in a Pressable component
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        _pressed={{
          opacity: 0.8
        }}
      >
        {({ isPressed }) => (
          <Box 
            bg={isPressed ? "gray.100" : "white"}
            p={4} 
            rounded="md"
            borderWidth={1}
            borderColor={isPressed ? "primary.300" : "gray.100"}
            shadow={isPressed ? 0 : 1}
          >
            {cardContent}
          </Box>
        )}
      </Pressable>
    );
  }

  // Otherwise, return the content in a normal Box with action buttons
  return (
    <Box 
      bg="white" 
      p={4} 
      rounded="md"
      borderWidth={1}
      borderColor="gray.100"
      shadow={1}
    >
      <VStack space={3}>
        {cardContent}
        
        {/* Always show action buttons row */}
        <HStack space={2} mt={3} justifyContent="flex-end">
          <Pressable
            onPress={onPress}
            bg="primary.50"
            p={2}
            rounded="sm"
            alignItems="center"
          >
            <Icon as={Feather} name="eye" size="sm" color="primary.600" />
          </Pressable>
          
          <Pressable
            onPress={onPress}
            bg="gray.50"
            p={2}
            rounded="sm"
            alignItems="center"
          >
            <Icon as={Feather} name="phone" size="sm" color="green.600" />
          </Pressable>
          
          <Pressable
            onPress={onPress}
            bg="gray.50"
            p={2}
            rounded="sm"
            alignItems="center"
          >
            <Icon as={Feather} name="edit-2" size="sm" color="gray.600" />
          </Pressable>
        </HStack>
      </VStack>
    </Box>
  );
};

export default LeadCard;
