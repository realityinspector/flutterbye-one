import React from 'react';
import { HStack, VStack, Box, Text, Badge, Icon, Pressable } from 'native-base';
import Feather from 'react-native-vector-icons/Feather';

const CallItem = ({ call, onPress }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getOutcomeColor = (outcome) => {
    switch (outcome) {
      case 'completed':
        return 'success';
      case 'no_answer':
        return 'warning';
      case 'left_message':
        return 'info';
      case 'interested':
        return 'primary';
      case 'not_interested':
        return 'danger';
      default:
        return 'gray';
    }
  };

  const getOutcomeText = (outcome) => {
    return outcome.replace('_', ' ').split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <Pressable onPress={() => onPress(call)}>
      {({ isHovered, isPressed }) => {
        return (
          <Box
            bg={isPressed ? "gray.100" : isHovered ? "gray.50" : "white"}
            rounded="md"
            overflow="hidden"
            p={3}
          >
            <HStack space={3} alignItems="center">
              <Box
                bg={`${getOutcomeColor(call.outcome)}.100`}
                p={2}
                rounded="full"
              >
                <Icon 
                  as={Feather} 
                  name="phone" 
                  color={`${getOutcomeColor(call.outcome)}.600`} 
                  size="md" 
                />
              </Box>

              <VStack flex={1}>
                <Text fontWeight="bold">
                  Lead #{call.userLeadId}
                </Text>
                <Text fontSize="sm" color="gray.500">
                  {formatDate(call.callDate)}
                </Text>
              </VStack>

              <VStack alignItems="flex-end">
                <Badge colorScheme={getOutcomeColor(call.outcome)} rounded="md" mb={1}>
                  {getOutcomeText(call.outcome)}
                </Badge>
                <Text fontSize="xs" color="gray.500">
                  {formatDuration(call.duration)}
                </Text>
              </VStack>
            </HStack>
          </Box>
        );
      }}
    </Pressable>
  );
};

export default CallItem;
