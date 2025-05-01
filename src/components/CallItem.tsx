import React from 'react';
import { HStack, VStack, Box, Text, Badge, Icon, Pressable } from 'native-base';
import { Feather } from '@expo/vector-icons';
// Import Call type directly from Zod schema
import { Call } from '../../shared/db/zod-schema';

interface CallItemProps {
  call: Call;
  onPress?: (call: Call) => void;
  leadName?: boolean;
}

const CallItem: React.FC<CallItemProps> = ({ call, onPress, leadName }) => {
  const formatDate = (dateString: string | Date): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDuration = (seconds: number | null | undefined): string => {
    if (seconds === null || seconds === undefined) return '0m 0s';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getOutcomeColor = (outcome: string | null | undefined): string => {
    if (!outcome) return 'gray';
    
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

  const getOutcomeText = (outcome: string | null | undefined): string => {
    if (!outcome) return 'No outcome';
    
    return outcome.replace('_', ' ').split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const handlePress = () => {
    if (onPress) {
      onPress(call);
    }
  };

  return (
    <Pressable onPress={handlePress}>
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
