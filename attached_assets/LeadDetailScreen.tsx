import React, { useState, useEffect } from 'react';
import {
  Box,
  ScrollView,
  VStack,
  HStack,
  Heading,
  Text,
  Icon,
  Button,
  Divider,
  Spinner,
  Center,
  Badge,
  TextArea,
  useDisclose,
  Actionsheet,
  Menu,
  Pressable,
  useToast,
} from 'native-base';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useLeads } from '../hooks/useLeads';
import { useCalls } from '../hooks/useCalls';
import CallItem from '../components/CallItem';
import CallActions from '../components/CallActions';
import { makePhoneCall, sendTextMessage, sendEmail, saveContact, addCalendarEvent } from '../utils/permissions';

// Status color mapping
const STATUS_COLORS = {
  new: 'info',
  contacted: 'warning',
  qualified: 'success',
  unqualified: 'error',
  converted: 'primary',
};

// Status user-friendly labels
const STATUS_LABELS = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  unqualified: 'Do Not Call',
  converted: 'Converted',
};

const LeadDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclose();
  
  const { leadId, focusCall } = route.params || {};
  const { getLead, updateLead, isUpdatingLead } = useLeads();
  const { getLeadCalls, createCall, isCreatingCall } = useCalls();
  
  const { data: lead, isLoading: isLoadingLead, refetch: refetchLead } = getLead(leadId);
  const { data: calls = [], isLoading: isLoadingCalls, refetch: refetchCalls } = getLeadCalls(leadId);
  
  const [notes, setNotes] = useState('');
  const [reminderDate, setReminderDate] = useState<Date | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  
  // Update local state when lead data changes
  useEffect(() => {
    if (lead) {
      setNotes(lead.notes || '');
      setSelectedStatus(lead.status);
      if (lead.reminderDate) {
        setReminderDate(new Date(lead.reminderDate));
      }
    }
  }, [lead]);
  
  // If there's a call to focus on, scroll to it
  useEffect(() => {
    if (focusCall) {
      // Implement scroll functionality if needed
    }
  }, [focusCall, calls]);
  
  const handleSaveNotes = async () => {
    if (!lead) return;
    
    try {
      await updateLead(lead.id, { notes });
      
      toast.show({
        title: "Notes saved",
        status: "success",
      });
      
      refetchLead();
    } catch (error) {
      console.error("Error saving notes:", error);
      
      toast.show({
        title: "Failed to save notes",
        status: "error",
      });
    }
  };
  
  const handleUpdateStatus = async (status: string) => {
    if (!lead) return;
    
    try {
      await updateLead(lead.id, { status });
      
      toast.show({
        title: "Status updated",
        status: "success",
      });
      
      refetchLead();
      setSelectedStatus(status);
    } catch (error) {
      console.error("Error updating status:", error);
      
      toast.show({
        title: "Failed to update status",
        status: "error",
      });
    }
  };
  
  const handleSetReminder = async () => {
    if (!lead || !reminderDate) return;
    
    try {
      await updateLead(lead.id, { reminderDate: reminderDate.toISOString() });
      
      toast.show({
        title: "Reminder set",
        status: "success",
      });
      
      refetchLead();
    } catch (error) {
      console.error("Error setting reminder:", error);
      
      toast.show({
        title: "Failed to set reminder",
        status: "error",
      });
    }
  };
  
  const handleSaveContact = async () => {
    if (!lead || !lead.contactName || !lead.phoneNumber) return;
    
    const success = await saveContact({
      name: lead.contactName,
      phoneNumber: lead.phoneNumber,
      email: lead.email,
      company: lead.companyName,
    });
    
    if (success) {
      toast.show({
        title: "Contact saved",
        description: "Added to your device contacts",
        status: "success",
      });
    }
  };
  
  const handleAddCalendarEvent = async () => {
    if (!lead) return;
    
    // Create a meeting for tomorrow at 10 AM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    
    const endTime = new Date(tomorrow);
    endTime.setMinutes(endTime.getMinutes() + 30);
    
    const success = await addCalendarEvent({
      title: `Meeting with ${lead.contactName} (${lead.companyName})`,
      startDate: tomorrow,
      endDate: endTime,
      notes: lead.notes,
      location: lead.address ? `${lead.address}, ${lead.city}, ${lead.state} ${lead.zipCode}` : undefined,
    });
    
    if (success) {
      toast.show({
        title: "Event added",
        description: "Meeting added to your calendar",
        status: "success",
      });
    }
  };
  
  // Handle quick call logging
  const handleQuickCall = async (outcome) => {
    if (!lead) return;
    
    try {
      await createCall({
        userLeadId: lead.id,
        outcome,
        notes: `Quick ${STATUS_LABELS[outcome] || outcome} call`,
      });
      
      toast.show({
        title: "Call logged",
        status: "success",
      });
      
      refetchCalls();
      refetchLead();
    } catch (error) {
      console.error("Error logging call:", error);
      
      toast.show({
        title: "Failed to log call",
        status: "error",
      });
    }
  };
  
  // Render loading state
  if (isLoadingLead) {
    return (
      <Center flex={1} bg="white" safeArea>
        <Spinner size="lg" color="primary.500" />
        <Text color="gray.500" mt={2}>Loading lead details...</Text>
      </Center>
    );
  }
  
  // Render error state
  if (!lead) {
    return (
      <Center flex={1} bg="white" safeArea>
        <Icon as={Feather} name="alert-triangle" size="4xl" color="warning.500" />
        <Heading mt={4} size="md">Lead not found</Heading>
        <Button mt={6} onPress={() => navigation.goBack()}>
          Go Back
        </Button>
      </Center>
    );
  }
  
  return (
    <Box flex={1} bg="white" safeArea>
      {/* Header */}
      <HStack px={4} pt={4} pb={2} alignItems="center" justifyContent="space-between">
        <IconButton
          icon={<Icon as={Feather} name="arrow-left" size="sm" />}
          variant="ghost"
          rounded="full"
          onPress={() => navigation.goBack()}
        />
        
        <Menu
          trigger={triggerProps => (
            <IconButton
              {...triggerProps}
              icon={<Icon as={Feather} name="more-vertical" size="sm" />}
              variant="ghost"
              rounded="full"
            />
          )}
        >
          <Menu.Item
            onPress={handleSaveContact}
            leftIcon={<Icon as={Feather} name="user-plus" size="xs" color="gray.600" />}
          >
            Save to Contacts
          </Menu.Item>
          
          <Menu.Item
            onPress={handleAddCalendarEvent}
            leftIcon={<Icon as={Feather} name="calendar" size="xs" color="gray.600" />}
          >
            Add Calendar Event
          </Menu.Item>
        </Menu>
      </HStack>
      
      <ScrollView flex={1}>
        {/* Lead header */}
        <VStack space={2} alignItems="center" px={4} py={4}>
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
              {lead.contactName?.charAt(0) || '?'}
            </Text>
          </Box>
          
          <Heading size="lg">{lead.contactName}</Heading>
          <Text fontSize="md" color="gray.500">{lead.companyName}</Text>
          
          <Badge colorScheme={STATUS_COLORS[lead.status]} mt={1}>
            {STATUS_LABELS[lead.status]}
          </Badge>
          
          {lead.reminderDate && (
            <HStack space={1} alignItems="center" mt={1}>
              <Icon as={Feather} name="clock" size="xs" color="warning.500" />
              <Text fontSize="xs" color="warning.500">
                Reminder: {new Date(lead.reminderDate).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </HStack>
          )}
          
          {/* Quick action buttons */}
          <HStack space={4} mt={4}>
            <Pressable onPress={() => makePhoneCall(lead.phoneNumber)} alignItems="center">
              <Box
                w={12}
                h={12}
                bg="primary.500"
                rounded="full"
                alignItems="center"
                justifyContent="center"
                mb={1}
              >
                <Icon as={Feather} name="phone" size="md" color="white" />
              </Box>
              <Text fontSize="xs">Call</Text>
            </Pressable>
            
            <Pressable onPress={() => sendTextMessage(lead.phoneNumber)} alignItems="center">
              <Box
                w={12}
                h={12}
                bg="secondary.500"
                rounded="full"
                alignItems="center"
                justifyContent="center"
                mb={1}
              >
                <Icon as={Feather} name="message-square" size="md" color="white" />
              </Box>
              <Text fontSize="xs">Text</Text>
            </Pressable>
            
            {lead.email && (
              <Pressable onPress={() => sendEmail(lead.email)} alignItems="center">
                <Box
                  w={12}
                  h={12}
                  bg="warning.500"
                  rounded="full"
                  alignItems="center"
                  justifyContent="center"
                  mb={1}
                >
                  <Icon as={Feather} name="mail" size="md" color="white" />
                </Box>
                <Text fontSize="xs">Email</Text>
              </Pressable>
            )}
            
            <Pressable onPress={() => navigation.navigate('Call' as never, { leadId: lead.id } as never)} alignItems="center">
              <Box
                w={12}
                h={12}
                bg="success.500"
                rounded="full"
                alignItems="center"
                justifyContent="center"
                mb={1}
              >
                <Icon as={Feather} name="phone-outgoing" size="md" color="white" />
              </Box>
              <Text fontSize="xs">Start Call</Text>
            </Pressable>
          </HStack>
        </VStack>
        
        <Divider />
        
        {/* Lead details */}
        <VStack space={4} px={4} py={4}>
          <Heading size="md">Lead Details</Heading>
          
          <VStack space={3}>
            {lead.phoneNumber && (
              <HStack space={3} alignItems="center">
                <Icon as={Feather} name="phone" size="sm" color="gray.500" />
                <VStack>
                  <Text fontSize="sm" color="gray.500">Phone</Text>
                  <Text>{lead.phoneNumber}</Text>
                </VStack>
              </HStack>
            )}
            
            {lead.email && (
              <HStack space={3} alignItems="center">
                <Icon as={Feather} name="mail" size="sm" color="gray.500" />
                <VStack>
                  <Text fontSize="sm" color="gray.500">Email</Text>
                  <Text>{lead.email}</Text>
                </VStack>
              </HStack>
            )}
            
            {(lead.address || lead.city || lead.state) && (
              <HStack space={3} alignItems="flex-start">
                <Icon as={Feather} name="map-pin" size="sm" color="gray.500" mt={1} />
                <VStack>
                  <Text fontSize="sm" color="gray.500">Address</Text>
                  <Text>{lead.address}</Text>
                  {(lead.city || lead.state) && (
                    <Text>
                      {lead.city}{lead.city && lead.state ? ', ' : ''}{lead.state} {lead.zipCode}
                    </Text>
                  )}
                </VStack>
              </HStack>
            )}
            
            {lead.website && (
              <HStack space={3} alignItems="center">
                <Icon as={Feather} name="globe" size="sm" color="gray.500" />
                <VStack>
                  <Text fontSize="sm" color="gray.500">Website</Text>
                  <Text>{lead.website}</Text>
                </VStack>
              </HStack>
            )}
            
            {lead.industry && (
              <HStack space={3} alignItems="center">
                <Icon as={Feather} name="tag" size="sm" color="gray.500" />
                <VStack>
                  <Text fontSize="sm" color="gray.500">Industry</Text>
                  <Text>{lead.industry}</Text>
                </VStack>
              </HStack>
            )}
          </VStack>
          
          <Divider mt={2} />
          
          {/* Status and actions section */}
          <VStack space={4}>
            <Heading size="md">Status & Actions</Heading>
            
            <VStack space={2}>
              <Text fontSize="sm" color="gray.500">Current Status</Text>
              <HStack space={2} flexWrap="wrap">
                {Object.keys(STATUS_LABELS).map(status => (
                  <Pressable key={status} onPress={() => handleUpdateStatus(status)}>
                    <Badge
                      colorScheme={STATUS_COLORS[status]}
                      opacity={selectedStatus === status ? 1 : 0.5}
                      px={3}
                      py={1}
                      rounded="md"
                      mb={2}
                    >
                      {STATUS_LABELS[status]}
                    </Badge>
                  </Pressable>
                ))}
              </HStack>
            </VStack>
            
            <HStack space={2} mt={2}>
              <Button
                flex={1}
                leftIcon={<Icon as={Feather} name="calendar" size="sm" />}
                variant="outline"
                onPress={() => {
                  if (!reminderDate) {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    tomorrow.setHours(10, 0, 0, 0);
                    setReminderDate(tomorrow);
                  }
                  handleSetReminder();
                }}
              >
                Set Reminder
              </Button>
              
              <Button
                flex={1}
                leftIcon={<Icon as={Feather} name="phone-outgoing" size="sm" />}
                colorScheme="primary"
                onPress={() => navigation.navigate('Call' as never, { leadId: lead.id } as never)}
              >
                Call Now
              </Button>
            </HStack>
            
            <HStack space={2} mt={1}>
              <Button
                flex={1}
                leftIcon={<Icon as={Feather} name="check-circle" size="sm" />}
                variant="ghost"
                colorScheme="success"
                onPress={() => handleQuickCall('interested')}
              >
                Interested
              </Button>
              
              <Button
                flex={1}
                leftIcon={<Icon as={Feather} name="x-circle" size="sm" />}
                variant="ghost"
                colorScheme="error"
                onPress={() => handleQuickCall('do_not_call')}
              >
                Do Not Call
              </Button>
            </HStack>
          </VStack>
          
          <Divider mt={2} />
          
          {/* Notes section */}
          <VStack space={3}>
            <Heading size="md">Notes</Heading>
            
            <TextArea
              h={32}
              value={notes}
              onChangeText={setNotes}
              placeholder="Enter your notes about this lead..."
              autoCompleteType={undefined}
            />
            
            <Button
              onPress={handleSaveNotes}
              isLoading={isUpdatingLead}
              leftIcon={<Icon as={Feather} name="save" size="sm" />}
              variant="outline"
            >
              Save Notes
            </Button>
          </VStack>
          
          <Divider mt={2} />
          
          {/* Call history section */}
          <VStack space={3}>
            <HStack justifyContent="space-between" alignItems="center">
              <Heading size="md">Call History</Heading>
              <Button
                size="sm"
                variant="ghost"
                leftIcon={<Icon as={Feather} name="plus" size="xs" />}
                onPress={onOpen}
              >
                Log Call
              </Button>
            </HStack>
            
            {isLoadingCalls ? (
              <Center py={4}>
                <Spinner color="primary.500" />
                <Text color="gray.500" mt={2}>Loading calls...</Text>
              </Center>
            ) : calls.length > 0 ? (
              <VStack space={3} pb={4}>
                {calls.map(call => (
                  <CallItem 
                    key={call.id} 
                    call={call}
                    leadName={lead.contactName}
                  />
                ))}
              </VStack>
            ) : (
              <Box
                bg="gray.50"
                p={4}
                rounded="md"
                alignItems="center"
                justifyContent="center"
              >
                <Text color="gray.500">No calls logged yet</Text>
              </Box>
            )}
          </VStack>
        </VStack>
      </ScrollView>
      
      {/* Quick call log actionsheet */}
      <Actionsheet isOpen={isOpen} onClose={onClose}>
        <Actionsheet.Content>
          <Heading size="md" mb={4}>Log a Call</Heading>
          
          <VStack width="100%" space={4}>
            <TextArea
              placeholder="Notes about the call..."
              autoCompleteType={undefined}
              h={32}
              value={notes}
              onChangeText={setNotes}
            />
            
            <CallActions
              selectedOutcome={null}
              onSelectOutcome={() => {}}
              reminderDate={null}
              onSetReminderDate={() => {}}
            />
            
            <Button
              w="full"
              mt={2}
              isLoading={isCreatingCall}
              onPress={() => {
                // Handle saving call log
                onClose();
              }}
            >
              Save Call Log
            </Button>
            
            <Button
              w="full"
              variant="ghost"
              onPress={onClose}
            >
              Cancel
            </Button>
          </VStack>
        </Actionsheet.Content>
      </Actionsheet>
    </Box>
  );
};

export default LeadDetailScreen;
