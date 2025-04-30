import React from 'react';
import {
  Box,
  HStack,
  VStack,
  Text,
  Icon,
  Pressable,
  Badge,
} from 'native-base';
import { UserLead } from '../hooks/useLeads';
import { Feather } from '@expo/vector-icons';

// Status color mapping
const STATUS_COLORS = {
  new: 'info',
  contacted: 'warning',
  qualified: 'success',
  unqualified: 'error',
  converted: 'primary',
};

// Status user-friendly labels
const STATUS_LABELS = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  unqualified: 'Unqualified',
  converted: 'Converted',
};

type LeadCardProps = {
  lead: UserLead;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  showStatus?: boolean;
};

const LeadCard = ({ 
  lead, 
  onPress, 
  rightElement,
  showStatus = false 
}: LeadCardProps) => {
  // Format the reminder date
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Pressable onPress={onPress}>
      <Box
        bg="white"
        p={3}
        rounded="xl"
        borderWidth={1}
        borderColor="gray.200"
        shadow={1}
      >
        <HStack space={3} alignItems="center">
          {/* Initial circle */}
          <Box
            w={12}
            h={12}
            bg="primary.100"
            rounded="full"
            alignItems="center"
            justifyContent="center"
          >
            <Text color="primary.600" fontSize="lg" fontWeight="bold">
              {lead.globalLead?.contactName?.charAt(0) || '?'}
            </Text>
          </Box>
          
          <VStack flex={1} space={1}>
            <Text fontSize="md" fontWeight="semibold" numberOfLines={1}>
              {lead.globalLead?.contactName || 'Unknown'}
            </Text>
            
            <Text fontSize="sm" color="gray.600" numberOfLines={1}>
              {lead.globalLead?.companyName || 'Company Unknown'}
            </Text>
            
            <HStack space={2} alignItems="center" flexWrap="wrap">
              {lead.globalLead?.phoneNumber && (
                <HStack space={1} alignItems="center">
                  <Icon as={Feather} name="phone" size="xs" color="gray.500" />
                  <Text fontSize="xs" color="gray.500">
                    {lead.globalLead.phoneNumber}
                  </Text>
                </HStack>
              )}
              
              {showStatus && lead.status && (
                <Badge colorScheme={STATUS_COLORS[lead.status]} variant="subtle" rounded="sm">
                  <Text fontSize="2xs">
                    {STATUS_LABELS[lead.status]}
                  </Text>
                </Badge>
              )}
            </HStack>
            
            {lead.reminderDate && (
              <HStack space={1} alignItems="center" mt={1}>
                <Icon as={Feather} name="clock" size="xs" color="warning.500" />
                <Text fontSize="xs" color="warning.500">
                  Reminder: {formatDate(lead.reminderDate)}
                </Text>
              </HStack>
            )}
          </VStack>
          
          {rightElement}
        </HStack>
      </Box>
    </Pressable>
  );
};

export default LeadCard;
