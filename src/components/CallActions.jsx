import React, { useState } from 'react';
import {
  Box,
  Text,
  VStack,
  HStack,
  Pressable,
  Icon,
  Button,
  FormControl,
  Center,
  Modal,
} from 'native-base';
import { Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

/**
 * CallActions component for selecting call outcome and setting reminders
 * 
 * @param {Object} props Component props
 * @param {string|null} props.selectedOutcome Currently selected call outcome
 * @param {Function} props.onSelectOutcome Callback when outcome is selected
 * @param {Date|null} props.reminderDate Currently set reminder date
 * @param {Function} props.onSetReminderDate Callback when reminder date is set
 */
const CallActions = ({
  selectedOutcome,
  onSelectOutcome,
  reminderDate,
  onSetReminderDate,
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Call outcome options
  const outcomeOptions = [
    { id: 'completed', label: 'Completed', icon: 'check', color: 'success.500' },
    { id: 'left_message', label: 'Left Message', icon: 'voicemail', color: 'warning.500' },
    { id: 'no_answer', label: 'No Answer', icon: 'phone-missed', color: 'error.500' },
    { id: 'interested', label: 'Interested', icon: 'thumbs-up', color: 'success.500' },
    { id: 'not_interested', label: 'Not Interested', icon: 'thumbs-down', color: 'error.500' },
    { id: 'meeting_scheduled', label: 'Meeting Scheduled', icon: 'calendar', color: 'info.500' },
    { id: 'do_not_call', label: 'Do Not Call', icon: 'slash', color: 'error.500' },
  ];

  // Handle outcome selection
  const handleSelectOutcome = (outcome) => {
    onSelectOutcome(outcome);
  };

  // Show or hide date picker
  const toggleDatePicker = () => {
    setShowDatePicker(!showDatePicker);
  };

  // Handle date change
  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    
    if (selectedDate) {
      onSetReminderDate(selectedDate);
    }
  };

  // Clear reminder date
  const handleClearReminder = () => {
    onSetReminderDate(null);
  };

  // Format date for display
  const formatDate = (date) => {
    if (!date) return '';
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Box>
      <FormControl mb={4}>
        <FormControl.Label>Call Outcome</FormControl.Label>
        <VStack space={2}>
          <HStack flexWrap="wrap">
            {outcomeOptions.map((option) => (
              <Pressable
                key={option.id}
                onPress={() => handleSelectOutcome(option.id)}
                mb={2}
                mr={2}
              >
                <HStack 
                  space={2} 
                  alignItems="center"
                  bg={selectedOutcome === option.id ? `${option.color.split('.')[0]}.100` : 'gray.100'}
                  px={3}
                  py={2}
                  rounded="md"
                  borderWidth={1}
                  borderColor={selectedOutcome === option.id ? option.color : 'gray.200'}
                >
                  <Icon 
                    as={Feather} 
                    name={option.icon} 
                    size={4} 
                    color={option.color} 
                  />
                  <Text color={selectedOutcome === option.id ? option.color : 'gray.700'}>
                    {option.label}
                  </Text>
                </HStack>
              </Pressable>
            ))}
          </HStack>
        </VStack>
      </FormControl>

      <FormControl>
        <FormControl.Label>Reminder</FormControl.Label>
        <Box>
          {reminderDate ? (
            <HStack space={2} alignItems="center" justifyContent="space-between">
              <HStack space={2} alignItems="center">
                <Icon as={Feather} name="clock" size={5} color="amber.500" />
                <Text>{formatDate(reminderDate)}</Text>
              </HStack>
              <HStack space={2}>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  leftIcon={<Icon as={Feather} name="edit-2" size={4} />}
                  onPress={toggleDatePicker}
                >
                  Edit
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  leftIcon={<Icon as={Feather} name="x" size={4} />}
                  colorScheme="error"
                  onPress={handleClearReminder}
                >
                  Clear
                </Button>
              </HStack>
            </HStack>
          ) : (
            <Button 
              leftIcon={<Icon as={Feather} name="clock" size={5} />}
              variant="outline"
              onPress={toggleDatePicker}
            >
              Set Reminder
            </Button>
          )}
        </Box>
      </FormControl>

      {/* Date Picker Modal */}
      <Modal isOpen={showDatePicker} onClose={() => setShowDatePicker(false)}>
        <Modal.Content maxWidth="400px">
          <Modal.CloseButton />
          <Modal.Header>Set Reminder</Modal.Header>
          <Modal.Body>
            <Center p={4}>
              <DateTimePicker
                value={reminderDate || new Date()}
                mode="datetime"
                is24Hour={true}
                onChange={handleDateChange}
              />
            </Center>
          </Modal.Body>
        </Modal.Content>
      </Modal>
    </Box>
  );
};

export default CallActions;