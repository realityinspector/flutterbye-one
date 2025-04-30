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
import { Feather } from '@expo/vector-icons';

// Outcome color mapping
const OUTCOME_COLORS = {
  no_answer: 'gray',
  call_back: 'info',
  do_not_call: 'error',
  interested: 'success',
  not_interested: 'warning',
  meeting_scheduled: 'primary',
  other: 'gray',
};

// Outcome user-friendly labels
const OUTCOME_LABELS = {
  no_answer: 'No Answer',
  call_back: 'Call Back',
  do_not_call: 'Do Not Call',
  interested: 'Interested',
  not_interested: 'Not Interested',
  meeting_scheduled: 'Meeting Scheduled',
  other: 'Other',
};

// Outcome icons
const OUTCOME_ICONS = {
  no_answer: 'phone-missed',
  call_back: 'phone-call',
  do_not_call: 'phone-off',
  interested: 'thumbs-up',
  not_interested: 'thumbs-down',
  meeting_scheduled: 'calendar',
  other: 'more-horizontal',
};

const CallItem = ({ 
  call, 
  onPress, 
  compact = false,
  leadName 
}) => {
  // Format the call date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    
    if (compact) {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Format the call duration
  const formatDuration = (seconds) => {
    if (!seconds) return 'N/A';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <Pressable onPress={onPress}>
      <Box
        bg="white"
        p={compact ? 2 : 3}
        rounded={compact ? "md" : "xl"}
        borderWidth={compact ? 0 : 1}
        borderColor="gray.200"
        shadow={compact ? 0 : 1}
      >
        <VStack space={compact ? 1 : 2}>
          <HStack justifyContent="space-between" alignItems="center">
            <HStack space={2} alignItems="center">
              <Icon 
                as={Feather} 
                name="phone" 
                size={compact ? "xs" : "sm"} 
                color="primary.500" 
              />
              
              <Text 
                fontSize={compact ? "xs" : "sm"} 
                fontWeight="medium"
                color="gray.700"
              >
                {formatDate(call.callDate)}
              </Text>
            </HStack>
            
            {call.duration && (
              <Text fontSize={compact ? "2xs" : "xs"} color="gray.500">
                {formatDuration(call.duration)}
              </Text>
            )}
          </HStack>
          
          {!compact && leadName && (
            <Text fontSize="md" fontWeight="semibold">
              {leadName}
            </Text>
          )}
          
          {call.outcome && (
            <HStack space={2} alignItems="center">
              <Badge 
                colorScheme={OUTCOME_COLORS[call.outcome]} 
                variant="subtle" 
                rounded="sm"
              >
                <HStack space={1} alignItems="center">
                  <Icon 
                    as={Feather} 
                    name={OUTCOME_ICONS[call.outcome]} 
                    size="2xs" 
                    color={`${OUTCOME_COLORS[call.outcome]}.700`} 
                  />
                  <Text fontSize="2xs">
                    {OUTCOME_LABELS[call.outcome]}
                  </Text>
                </HStack>
              </Badge>
            </HStack>
          )}
          
          {!compact && call.notes && (
            <Text fontSize="sm" color="gray.600" numberOfLines={2}>
              {call.notes}
            </Text>
          )}
          
          {call.reminderDate && (
            <HStack space={1} alignItems="center">
              <Icon 
                as={Feather} 
                name="clock" 
                size="2xs" 
                color="warning.500" 
              />
              <Text fontSize={compact ? "2xs" : "xs"} color="warning.500">
                Reminder: {formatDate(call.reminderDate)}
              </Text>
            </HStack>
          )}
        </VStack>
      </Box>
    </Pressable>
  );
};

export default CallItem;
