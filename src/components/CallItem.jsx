import React from 'react';
import {
  Box,
  HStack,
  VStack,
  Text,
  Icon,
  Badge,
  Pressable,
} from 'native-base';
import { Feather } from '@expo/vector-icons';

/**
 * CallItem component displays a call record with outcome and duration
 * 
 * @param {Object} props Component props
 * @param {Object} props.call Call data object
 * @param {Function} props.onPress Optional callback when item is pressed
 * @param {boolean} props.compact Display in compact mode (less details)
 * @param {boolean} props.leadName Whether to show the lead name (for call history view)
 */
const CallItem = ({ call, onPress, compact = false, leadName = false }) => {
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' · ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Format duration in minutes and seconds
  const formatDuration = (seconds) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  // Get icon and color for call outcome
  const getOutcomeDetails = (outcome) => {
    switch (outcome) {
      case 'completed':
        return { icon: 'check', color: 'success' };
      case 'left_message':
        return { icon: 'voicemail', color: 'warning' };
      case 'no_answer':
        return { icon: 'phone-missed', color: 'error' };
      case 'interested':
        return { icon: 'thumbs-up', color: 'success' };
      case 'not_interested':
        return { icon: 'thumbs-down', color: 'error' };
      case 'meeting_scheduled':
        return { icon: 'calendar', color: 'info' };
      case 'do_not_call':
        return { icon: 'slash', color: 'error' };
      default:
        return { icon: 'phone', color: 'gray' };
    }
  };

  // Format outcome text for display
  const formatOutcome = (outcome) => {
    if (!outcome) return 'Call Completed';
    return outcome.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const outcomeDetails = getOutcomeDetails(call.outcome);

  return (
    <Pressable onPress={onPress}>
      <Box
        bg="white"
        rounded="md"
        p={3}
        shadow={compact ? 0 : 1}
        borderWidth={compact ? 1 : 0}
        borderColor="gray.100"
      >
        <HStack space={3} alignItems="center">
          <Box
            p={2}
            bg={`${outcomeDetails.color}.100`}
            rounded="full"
          >
            <Icon as={Feather} name={outcomeDetails.icon} color={`${outcomeDetails.color}.500`} size={5} />
          </Box>
          
          <VStack flex={1}>
            <HStack alignItems="center" justifyContent="space-between">
              <Text fontWeight="medium">
                {formatOutcome(call.outcome)}
              </Text>
              {call.duration && !compact && (
                <Badge variant="subtle" colorScheme="blue" rounded="md">
                  {formatDuration(call.duration)}
                </Badge>
              )}
            </HStack>

            <Text fontSize="sm" color="gray.500">
              {formatDate(call.callDate)}
            </Text>
            
            {!compact && call.notes && (
              <Text mt={1} fontSize="sm" color="gray.600" numberOfLines={2}>
                {call.notes}
              </Text>
            )}

            {leadName && call.leadName && (
              <HStack alignItems="center" mt={1}>
                <Icon as={Feather} name="user" size={3} color="primary.500" mr={1} />
                <Text fontSize="xs" color="primary.500">
                  {call.leadName}
                </Text>
              </HStack>
            )}

            {!compact && call.reminderDate && new Date(call.reminderDate) > new Date() && (
              <HStack alignItems="center" mt={1}>
                <Icon as={Feather} name="clock" size={3} color="amber.500" mr={1} />
                <Text fontSize="xs" color="amber.500">
                  Reminder: {formatDate(call.reminderDate)}
                </Text>
              </HStack>
            )}
          </VStack>

          {onPress && (
            <Icon as={Feather} name="chevron-right" size={5} color="gray.400" />
          )}
        </HStack>
      </Box>
    </Pressable>
  );
};

export default CallItem;