import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Icon,
  Pressable,
  Button,
  DateTimePicker,
  FormControl,
  Divider,
} from 'native-base';
import { Feather } from '@expo/vector-icons';
import { CallOutcome } from '../hooks/useCalls';

// Outcome definitions with icons and text
const OUTCOME_OPTIONS = [
  {
    value: 'no_answer',
    label: 'No Answer',
    icon: 'phone-missed',
    description: 'Contact could not be reached',
  },
  {
    value: 'call_back',
    label: 'Call Back',
    icon: 'phone-call',
    description: 'Need to call them back later',
  },
  {
    value: 'do_not_call',
    label: 'Do Not Call',
    icon: 'phone-off',
    description: 'Remove from call queue',
  },
  {
    value: 'interested',
    label: 'Interested',
    icon: 'thumbs-up',
    description: 'Showed positive interest',
  },
  {
    value: 'not_interested',
    label: 'Not Interested',
    icon: 'thumbs-down',
    description: 'Declined at this time',
  },
  {
    value: 'meeting_scheduled',
    label: 'Meeting Set',
    icon: 'calendar',
    description: 'Scheduled a meeting',
  },
  {
    value: 'other',
    label: 'Other',
    icon: 'more-horizontal',
    description: 'Other outcome',
  },
];

type CallActionsProps = {
  selectedOutcome: CallOutcome | null;
  onSelectOutcome: (outcome: CallOutcome) => void;
  reminderDate: Date | null;
  onSetReminderDate: (date: Date | null) => void;
};

const CallActions = ({
  selectedOutcome,
  onSelectOutcome,
  reminderDate,
  onSetReminderDate,
}: CallActionsProps) => {
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleSelectOutcome = (outcome: CallOutcome) => {
    onSelectOutcome(outcome);
    
    // Set default reminder for "call_back" outcome
    if (outcome === 'call_back' && !reminderDate) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);
      onSetReminderDate(tomorrow);
    }
  };

  return (
    <VStack width="100%" space={4}>
      {/* Outcome selection grid */}
      <Box>
        <FormControl.Label mb={2}>Call Outcome</FormControl.Label>
        <VStack space={2} divider={<Divider />}>
          {OUTCOME_OPTIONS.map(option => (
            <Pressable
              key={option.value}
              onPress={() => handleSelectOutcome(option.value as CallOutcome)}
            >
              <HStack
                space={3}
                alignItems="center"
                p={2}
                rounded="md"
                bg={selectedOutcome === option.value ? 'primary.50' : 'transparent'}
                borderWidth={selectedOutcome === option.value ? 1 : 0}
                borderColor="primary.200"
              >
                <Icon
                  as={Feather}
                  name={option.icon}
                  size="sm"
                  color={selectedOutcome === option.value ? 'primary.600' : 'gray.500'}
                />
                <VStack flex={1}>
                  <Text
                    fontWeight="medium"
                    color={selectedOutcome === option.value ? 'primary.600' : 'gray.700'}
                  >
                    {option.label}
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    {option.description}
                  </Text>
                </VStack>
                {selectedOutcome === option.value && (
                  <Icon as={Feather} name="check" size="sm" color="primary.600" />
                )}
              </HStack>
            </Pressable>
          ))}
        </VStack>
      </Box>

      {/* Reminder date selection */}
      <Box>
        <FormControl.Label>Set Reminder (Optional)</FormControl.Label>
        
        {!showDatePicker ? (
          <Button
            variant="outline"
            leftIcon={<Icon as={Feather} name="clock" size="sm" />}
            onPress={() => setShowDatePicker(true)}
          >
            {reminderDate
              ? reminderDate.toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'Set Reminder'}
          </Button>
        ) : (
          <VStack space={3}>
            <DateTimePicker
              value={reminderDate || new Date()}
              onChange={(_, date) => {
                if (date) onSetReminderDate(date);
              }}
              mode="datetime"
            />
            
            <HStack space={2}>
              <Button
                flex={1}
                variant="outline"
                colorScheme="gray"
                onPress={() => {
                  onSetReminderDate(null);
                  setShowDatePicker(false);
                }}
              >
                Clear
              </Button>
              
              <Button
                flex={1}
                onPress={() => setShowDatePicker(false)}
              >
                Confirm
              </Button>
            </HStack>
          </VStack>
        )}
      </Box>
    </VStack>
  );
};

export default CallActions;
