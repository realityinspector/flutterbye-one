import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Icon,
  Pressable,
  Button,
  FormControl,
  Divider,
} from 'native-base';
import { Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';

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

const CallActions = ({
  selectedOutcome,
  onSelectOutcome,
  reminderDate,
  onSetReminderDate,
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState('date');

  const handleSelectOutcome = (outcome) => {
    onSelectOutcome(outcome);
    
    // Set default reminder for "call_back" outcome
    if (outcome === 'call_back' && !reminderDate) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);
      onSetReminderDate(tomorrow);
    }
  };

  const showDateTimePicker = () => {
    setDatePickerMode('date');
    setShowDatePicker(true);
  };

  const handleDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || reminderDate || new Date();
    
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
      
      // If we just selected a date, now show time picker
      if (datePickerMode === 'date') {
        setTimeout(() => {
          setDatePickerMode('time');
          setShowDatePicker(true);
        }, 100);
      } else {
        onSetReminderDate(currentDate);
      }
    } else {
      // iOS has a combined date & time picker
      onSetReminderDate(currentDate);
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
              onPress={() => handleSelectOutcome(option.value)}
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
        
        <Button
          variant="outline"
          leftIcon={<Icon as={Feather} name="clock" size="sm" />}
          onPress={showDateTimePicker}
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
        
        {showDatePicker && (
          <DateTimePicker
            value={reminderDate || new Date()}
            mode={datePickerMode}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
          />
        )}
        
        {reminderDate && (
          <Button
            mt={2}
            variant="ghost"
            colorScheme="gray"
            onPress={() => onSetReminderDate(null)}
            leftIcon={<Icon as={Feather} name="x" size="sm" />}
          >
            Clear Reminder
          </Button>
        )}
      </Box>
    </VStack>
  );
};

export default CallActions;
