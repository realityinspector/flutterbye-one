import React, { useState, useEffect } from 'react';
import { 
  Box, VStack, HStack, Text, Heading, Divider, Badge, Icon, 
  Spinner, useToast, Center, IconButton 
} from 'native-base';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useCalls } from '../../hooks/useCalls';
import { useLeads } from '../../hooks/useLeads';
import NewCallFAB from '../../components/NewCallFAB';

const CallHistoryScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const toast = useToast();
  const { callId } = route.params || {};
  const { getCall, isLoading: isLoadingCall } = useCalls();
  const { getLead, isLoading: isLoadingLead } = useLeads();
  
  const [call, setCall] = useState(null);
  const [lead, setLead] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCallAndLead = async () => {
      try {
        setIsLoading(true);
        
        if (!callId) {
          toast.show({
            title: "Missing call ID",
            status: "error",
            placement: "top"
          });
          navigation.goBack();
          return;
        }
        
        // Fetch call details
        const callResponse = await getCall(callId);
        if (!callResponse.success || !callResponse.data) {
          toast.show({
            title: "Call not found",
            status: "error",
            placement: "top"
          });
          navigation.goBack();
          return;
        }
        
        setCall(callResponse.data);
        
        // Fetch associated lead
        const leadResponse = await getLead(callResponse.data.userLeadId);
        if (leadResponse.success && leadResponse.data) {
          setLead(leadResponse.data);
        }
      } catch (error) {
        console.error('Error fetching call details:', error);
        toast.show({
          title: "Error loading call details",
          status: "error",
          placement: "top"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCallAndLead();
  }, [callId, getCall, getLead]);

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

  if (isLoading || isLoadingCall || isLoadingLead) {
    return (
      <Center flex={1} bg="white">
        <Spinner size="lg" color="primary.500" />
        <Text mt={4} color="gray.500">Loading call details...</Text>
      </Center>
    );
  }

  return (
    <Box flex={1} bg="white" safeArea>
      <VStack px={4} pt={5} space={4} pb={20}>
        <HStack alignItems="center" space={3}>
          <IconButton
            icon={<Icon as={Feather} name="arrow-left" size="md" />}
            variant="ghost"
            onPress={() => navigation.goBack()}
          />
          <Heading size="lg">Call Details</Heading>
        </HStack>
        
        <Divider />
        
        {lead && (
          <VStack space={2} bg="gray.50" p={4} rounded="md">
            <Heading size="md">{lead.globalLead.companyName}</Heading>
            <HStack alignItems="center" space={1}>
              <Icon as={Feather} name="user" size="sm" color="gray.500" />
              <Text>{lead.globalLead.contactName}</Text>
            </HStack>
            <HStack alignItems="center" space={1}>
              <Icon as={Feather} name="phone" size="sm" color="gray.500" />
              <Text>{lead.globalLead.phoneNumber}</Text>
            </HStack>
            {lead.globalLead.email && (
              <HStack alignItems="center" space={1}>
                <Icon as={Feather} name="mail" size="sm" color="gray.500" />
                <Text>{lead.globalLead.email}</Text>
              </HStack>
            )}
            <HStack alignItems="center" mt={2}>
              <Badge colorScheme={lead.status === 'new' ? 'info' : 'success'} mr={2}>
                {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
              </Badge>
              <Text fontSize="sm">Priority: {lead.priority}</Text>
            </HStack>
          </VStack>
        )}
        
        <Divider />
        
        <VStack space={3}>
          <Heading size="md">Call Information</Heading>
          
          <HStack justifyContent="space-between" alignItems="center">
            <Text fontWeight="bold">Date & Time:</Text>
            <Text>{formatDate(call.callDate)}</Text>
          </HStack>
          
          <HStack justifyContent="space-between" alignItems="center">
            <Text fontWeight="bold">Duration:</Text>
            <Text>{formatDuration(call.duration)}</Text>
          </HStack>
          
          <HStack justifyContent="space-between" alignItems="center">
            <Text fontWeight="bold">Outcome:</Text>
            <Badge colorScheme={getOutcomeColor(call.outcome)}>
              {getOutcomeText(call.outcome)}
            </Badge>
          </HStack>
          
          {call.reminderDate && (
            <HStack justifyContent="space-between" alignItems="center">
              <Text fontWeight="bold">Follow-up Reminder:</Text>
              <Text>{formatDate(call.reminderDate)}</Text>
            </HStack>
          )}
          
          <Divider my={2} />
          
          <Heading size="sm">Notes</Heading>
          <Box p={3} bg="gray.50" rounded="md">
            <Text>
              {call.notes || 'No notes recorded for this call.'}
            </Text>
          </Box>
        </VStack>
        
        {/* NewCallFAB will handle calls now */}
      </VStack>
      {lead && <NewCallFAB leadId={lead.id} />}
    </Box>
  );
};

export default CallHistoryScreen;
