import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Text,
  Heading,
  VStack,
  HStack,
  Icon,
  Button,
  TextArea,
  ScrollView,
  Spinner,
  Center,
  useToast,
  IconButton,
  Actionsheet,
  useDisclose,
  Divider,
  Badge,
  Pressable,
} from 'native-base';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useLeads } from '../hooks/useLeads';
import { useCalls, CallOutcome } from '../hooks/useCalls';
import CallActions from '../components/CallActions';
import { makePhoneCall, sendTextMessage } from '../utils/permissions';
import { Keyboard, BackHandler } from 'react-native';

// Timer component to track call duration
const Timer = ({ isRunning, onElapsed }) => {
  const [seconds, setSeconds] = useState(0);
  
  useEffect(() => {
    let interval = null;
    
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds(prev => {
          const newValue = prev + 1;
          onElapsed(newValue);
          return newValue;
        });
      }, 1000);
    } else if (interval) {
      clearInterval(interval);
    }
    
    return () => clearInterval(interval);
  }, [isRunning, onElapsed]);
  
  const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  return (
    <Badge 
      variant="outline" 
      rounded="full" 
      px={3} 
      py={1} 
      colorScheme={isRunning ? "success" : "gray"}
    >
      <HStack space={1} alignItems="center">
        {isRunning && <Box w={2} h={2} rounded="full" bg="success.500" />}
        <Text fontSize="xs" fontWeight="medium">
          {formatTime(seconds)}
        </Text>
      </HStack>
    </Badge>
  );
};

const CallScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclose();
  
  const { leadId } = route.params || {};
  const { getLead } = useLeads();
  const { createCall, isCreatingCall } = useCalls();
  
  const { data: lead, isLoading, isError } = getLead(leadId);
  const { data: callSuggestions, isLoading: isLoadingSuggestions } = useLeads().getCallSuggestions(leadId);
  
  const [isCallActive, setIsCallActive] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [notes, setNotes] = useState('');
  const [selectedOutcome, setSelectedOutcome] = useState<CallOutcome | null>(null);
  const [reminderDate, setReminderDate] = useState<Date | null>(null);
  
  // Handle back button during active call
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isCallActive) {
        // Prevent back if call is active, show confirmation instead
        onOpen();
        return true;
      }
      return false;
    });
    
    return () => backHandler.remove();
  }, [isCallActive]);
  
  const handleStartCall = () => {
    if (!lead) return;
    
    // Start the call
    setIsCallActive(true);
    makePhoneCall(lead.phoneNumber);
    
    toast.show({
      title: "Call started",
      description: `Calling ${lead.contactName}`,
      placement: "top",
    });
  };
  
  const handleEndCall = async () => {
    if (!isCallActive) return;
    
    setIsCallActive(false);
    onOpen(); // Open outcome selection dialog
  };
  
  const handleSaveCall = async () => {
    if (!lead) return;
    
    try {
      await createCall({
        userLeadId: lead.id,
        notes,
        outcome: selectedOutcome || undefined,
        duration: callDuration,
        reminderDate: reminderDate ? reminderDate.toISOString() : undefined,
      });
      
      toast.show({
        title: "Call logged successfully",
        status: "success",
        placement: "top",
      });
      
      // Navigate back to lead detail or call queue
      navigation.goBack();
    } catch (error) {
      console.error("Error saving call:", error);
      toast.show({
        title: "Failed to log call",
        status: "error",
        placement: "top",
      });
    }
  };
  
  const handleCancel = () => {
    navigation.goBack();
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <Center flex={1} bg="white">
        <Spinner size="lg" color="primary.500" />
        <Text color="gray.500" mt={2}>Loading lead information...</Text>
      </Center>
    );
  }
  
  // Render error state
  if (isError || !lead) {
    return (
      <Center flex={1} bg="white">
        <Icon as={Feather} name="alert-triangle" size="4xl" color="warning.500" />
        <Heading mt={4} size="md">Failed to load lead</Heading>
        <Button mt={6} onPress={() => navigation.goBack()}>
          Go Back
        </Button>
      </Center>
    );
  }
  
  return (
    <Box flex={1} bg="white" safeArea>
      {/* Header */}
      <HStack px={4} pt={4} pb={2} justifyContent="space-between" alignItems="center">
        <IconButton
          icon={<Icon as={Feather} name="x" size="sm" />}
          variant="ghost"
          rounded="full"
          onPress={isCallActive ? onOpen : handleCancel}
        />
        
        <Timer 
          isRunning={isCallActive} 
          onElapsed={setCallDuration} 
        />
        
        <Box w={8} /> {/* Empty box for alignment */}
      </HStack>
      
      <Divider />
      
      <ScrollView flex={1} p={6}>
        {/* Lead information */}
        <VStack space={4} alignItems="center" mb={6}>
          <Box
            w={20}
            h={20}
            bg="primary.100"
            rounded="full"
            alignItems="center"
            justifyContent="center"
            borderWidth={2}
            borderColor="primary.200"
          >
            <Text fontSize="3xl" fontWeight="bold" color="primary.600">
              {lead.contactName.charAt(0)}
            </Text>
          </Box>
          
          <Heading size="lg">{lead.contactName}</Heading>
          <Text fontSize="md" color="gray.500">{lead.companyName}</Text>
          
          <HStack space={4} mt={2}>
            <Pressable
              onPress={() => makePhoneCall(lead.phoneNumber)}
              flexDirection="column"
              alignItems="center"
            >
              <Box
                rounded="full"
                bg="primary.500"
                p={3}
                mb={1}
              >
                <Icon as={Feather} name="phone" color="white" size="md" />
              </Box>
              <Text fontSize="xs" color="gray.600">Call</Text>
            </Pressable>
            
            <Pressable
              onPress={() => sendTextMessage(lead.phoneNumber)}
              flexDirection="column"
              alignItems="center"
            >
              <Box
                rounded="full"
                bg="secondary.500"
                p={3}
                mb={1}
              >
                <Icon as={Feather} name="message-square" color="white" size="md" />
              </Box>
              <Text fontSize="xs" color="gray.600">Text</Text>
            </Pressable>
          </HStack>
        </VStack>
        
        {/* Call suggestions */}
        {callSuggestions && !isLoadingSuggestions && (
          <Box bg="primary.50" p={4} rounded="lg" mb={6}>
            <Heading size="sm" mb={2} color="primary.700">
              Call Suggestions
            </Heading>
            
            {callSuggestions.greeting && (
              <VStack space={2} mb={3}>
                <Text fontWeight="medium" color="primary.800">Greeting:</Text>
                <Text color="gray.700">{callSuggestions.greeting}</Text>
              </VStack>
            )}
            
            {callSuggestions.talkingPoints && (
              <VStack space={2} mb={3}>
                <Text fontWeight="medium" color="primary.800">Key Points:</Text>
                {callSuggestions.talkingPoints.map((point, index) => (
                  <HStack key={index} space={2} alignItems="flex-start">
                    <Icon as={Feather} name="check" size="xs" color="primary.600" mt={1} />
                    <Text color="gray.700" flex={1}>{point}</Text>
                  </HStack>
                ))}
              </VStack>
            )}
            
            {callSuggestions.closing && (
              <VStack space={2}>
                <Text fontWeight="medium" color="primary.800">Closing:</Text>
                <Text color="gray.700">{callSuggestions.closing}</Text>
              </VStack>
            )}
          </Box>
        )}
        
        {/* Notes */}
        <VStack space={2} mb={6}>
          <Heading size="sm">Call Notes</Heading>
          <TextArea
            h={32}
            placeholder="Enter your notes about the call here..."
            value={notes}
            onChangeText={setNotes}
            autoCompleteType={undefined}
          />
        </VStack>
        
        {/* Call control buttons */}
        <VStack space={4}>
          {isCallActive ? (
            <Button
              colorScheme="error"
              size="lg"
              onPress={handleEndCall}
              leftIcon={<Icon as={Feather} name="phone-off" size="sm" />}
            >
              End Call
            </Button>
          ) : (
            <HStack space={3}>
              <Button
                flex={1}
                colorScheme="primary"
                size="lg"
                leftIcon={<Icon as={Feather} name="phone-outgoing" size="sm" />}
                onPress={handleStartCall}
              >
                Start Call
              </Button>
              
              {notes.length > 0 && (
                <Button
                  flex={1}
                  variant="outline"
                  colorScheme="primary"
                  size="lg"
                  isLoading={isCreatingCall}
                  onPress={handleSaveCall}
                >
                  Save Notes
                </Button>
              )}
            </HStack>
          )}
        </VStack>
      </ScrollView>
      
      {/* Call outcome actionsheet */}
      <Actionsheet isOpen={isOpen} onClose={onClose}>
        <Actionsheet.Content>
          <Heading size="md" mb={4}>Call Outcome</Heading>
          
          <CallActions
            selectedOutcome={selectedOutcome}
            onSelectOutcome={setSelectedOutcome}
            reminderDate={reminderDate}
            onSetReminderDate={setReminderDate}
          />
          
          <Button
            w="full"
            mt={6}
            isLoading={isCreatingCall}
            isDisabled={!selectedOutcome}
            onPress={handleSaveCall}
          >
            Save and Finish
          </Button>
          
          <Button
            w="full"
            mt={2}
            variant="ghost"
            onPress={() => {
              if (isCallActive) {
                setIsCallActive(false);
              }
              onClose();
            }}
          >
            {isCallActive ? "Continue Call" : "Cancel"}
          </Button>
        </Actionsheet.Content>
      </Actionsheet>
    </Box>
  );
};

export default CallScreen;
