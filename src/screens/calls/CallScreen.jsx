import React, { useState, useEffect } from 'react';
import {
  Box,
  Center,
  Heading,
  Text,
  Icon,
  HStack,
  VStack,
  IconButton,
  Pressable,
  useToast,
  ScrollView,
  TextArea,
  Button,
  useDisclose,
} from 'native-base';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useCalls } from '../../hooks/useCalls';
import { useLeads } from '../../hooks/useLeads';
import CallActions from '../../components/CallActions';

const CallScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclose();
  
  const { leadId, phoneNumber, contactName } = route.params || {};
  const { createCall } = useCalls();
  const { getLead } = useLeads();
  
  const [callStartTime, setCallStartTime] = useState(null);
  const [callEndTime, setCallEndTime] = useState(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isCallActive, setIsCallActive] = useState(true);
  const [leadData, setLeadData] = useState(null);
  const [notes, setNotes] = useState('');
  const [callOutcome, setCallOutcome] = useState(null);
  const [reminderDate, setReminderDate] = useState(null);
  const [durationInterval, setDurationInterval] = useState(null);

  // Load lead data
  useEffect(() => {
    const fetchLead = async () => {
      if (leadId) {
        try {
          const lead = await getLead(leadId);
          setLeadData(lead);
          // Pre-populate notes with previous notes if they exist
          if (lead.notes) {
            setNotes(lead.notes);
          }
        } catch (error) {
          console.error('Error fetching lead:', error);
        }
      }
    };
    
    fetchLead();
  }, [leadId]);

  // Start call timer on component mount
  useEffect(() => {
    const now = new Date();
    setCallStartTime(now);
    
    // Set up interval for call duration
    const interval = setInterval(() => {
      const currentTime = new Date();
      const durationInSeconds = Math.floor((currentTime - now) / 1000);
      setCallDuration(durationInSeconds);
    }, 1000);
    
    setDurationInterval(interval);
    
    // Clean up interval on unmount
    return () => {
      clearInterval(interval);
    };
  }, []);

  // Format duration as MM:SS
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle ending the call
  const handleEndCall = () => {
    // Stop the timer
    clearInterval(durationInterval);
    setCallEndTime(new Date());
    setIsCallActive(false);
    onOpen(); // Show call actions
  };

  // Handle saving the call record
  const handleSaveCall = async () => {
    if (!leadId) {
      navigation.goBack();
      return;
    }

    try {
      const callData = {
        userLeadId: leadId,
        callDate: callStartTime.toISOString(),
        duration: callDuration,
        outcome: callOutcome,
        notes: notes,
        reminderDate: reminderDate?.toISOString(),
      };
      
      await createCall(callData);
      
      toast.show({
        title: "Call saved successfully",
        status: "success",
        placement: "top",
      });
      
      navigation.goBack();
    } catch (error) {
      console.error('Error saving call:', error);
      toast.show({
        title: "Failed to save call",
        status: "error",
        placement: "top",
      });
    }
  };

  return (
    <Box flex={1} bg="white" safeArea>
      {/* Call header */}
      <Box p={4}>
        <IconButton
          position="absolute"
          top={4}
          left={4}
          zIndex={1}
          icon={<Icon as={Feather} name="chevron-down" size={6} />}
          onPress={() => {
            if (isCallActive) {
              // Show confirmation before navigating away from active call
              toast.show({
                title: "End call before leaving",
                status: "warning",
                placement: "top",
              });
            } else {
              navigation.goBack();
            }
          }}
          variant="ghost"
          borderRadius="full"
        />
      </Box>

      {/* Call content */}
      <ScrollView flex={1} px={4}>
        <Center mt={isCallActive ? 10 : 4}>
          <Box 
            w={32} 
            h={32} 
            bg="primary.100"
            rounded="full"
            justifyContent="center"
            alignItems="center"
          >
            <Icon as={Feather} name="user" size={16} color="primary.500" />
          </Box>
          
          <Heading mt={4} size="xl">{contactName || 'Unknown Contact'}</Heading>
          
          <Text mt={2} fontSize="md" color="gray.500">
            {phoneNumber || ''}
          </Text>
          
          {leadData && (
            <Text mt={1} fontSize="md" color="gray.500">
              {leadData.globalLead.companyName || ''}
            </Text>
          )}
          
          {isCallActive ? (
            <HStack mt={6} alignItems="center" space={3}>
              <Text fontSize="xl" fontWeight="bold" color="gray.700">
                {formatDuration(callDuration)}
              </Text>
              <Box w={3} h={3} bg="success.500" rounded="full" />
            </HStack>
          ) : (
            <Text mt={4} fontSize="md" color="gray.500">
              Call ended · {formatDuration(callDuration)}
            </Text>
          )}
        </Center>

        {!isCallActive && (
          <VStack mt={8} space={5}>
            <Box>
              <Text fontSize="lg" fontWeight="bold" mb={2}>Call Notes</Text>
              <TextArea
                h={40}
                placeholder="Enter notes about the call"
                value={notes}
                onChangeText={setNotes}
                autoCompleteType="off"
              />
            </Box>

            <CallActions
              selectedOutcome={callOutcome}
              onSelectOutcome={setCallOutcome}
              reminderDate={reminderDate}
              onSetReminderDate={setReminderDate}
            />
          </VStack>
        )}

        <Box h={32} /> {/* Space at bottom for the floating buttons */}
      </ScrollView>

      {/* Call action buttons */}
      <HStack 
        position="absolute" 
        bottom={8} 
        width="100%" 
        justifyContent="center"
        space={4}
        px={4}
      >
        {isCallActive ? (
          <Pressable 
            onPress={handleEndCall}
            w={16} 
            h={16} 
            bg="error.500" 
            rounded="full"
            justifyContent="center"
            alignItems="center"
          >
            <Icon as={Feather} name="phone-off" size={8} color="white" />
          </Pressable>
        ) : (
          <Button
            size="lg"
            rounded="full"
            colorScheme="primary"
            width="90%"
            onPress={handleSaveCall}
          >
            Save Call Details
          </Button>
        )}
      </HStack>
    </Box>
  );
};

export default CallScreen;
