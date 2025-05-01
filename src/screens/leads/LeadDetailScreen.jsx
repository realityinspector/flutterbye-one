import React, { useEffect, useState } from 'react';
import {
  Box,
  ScrollView,
  Heading,
  Text,
  VStack,
  HStack,
  Icon,
  Button,
  Spinner,
  Center,
  Pressable,
  Divider,
  Badge,
  IconButton,
  Menu,
  useDisclose,
  AlertDialog,
  useToast,
} from 'native-base';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useLeads } from '../../hooks/useLeads';
import { useCalls } from '../../hooks/useCalls';
import { makePhoneCall } from '../../utils/permissions';
import CallItem from '../../components/CallItem';
import NewCallFAB from '../../components/NewCallFAB';

const LeadDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclose();
  const { leadId } = route.params || {};
  
  const { getLead, updateLead, deleteLead, isLoading } = useLeads();
  const { getCallsByLead, isLoading: callsLoading } = useCalls();
  
  const [lead, setLead] = useState(null);
  const [calls, setCalls] = useState([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Fetch lead details and call history
  useEffect(() => {
    const fetchData = async () => {
      try {
        const leadData = await getLead(leadId);
        setLead(leadData);
        
        const callData = await getCallsByLead(leadId);
        setCalls(callData);
      } catch (error) {
        console.error('Error fetching lead details:', error);
        toast.show({
          title: "Failed to load lead details",
          status: "error",
          placement: "top",
        });
      }
    };
    
    if (leadId) {
      fetchData();
    }
  }, [leadId]);

  // Handle edit lead
  const handleEditLead = () => {
    navigation.navigate('LeadForm', { leadId: lead.id });
  };

  // Handle delete lead
  const handleDeleteLead = async () => {
    try {
      await deleteLead(lead.id);
      toast.show({
        title: "Lead deleted successfully",
        status: "success",
        placement: "top",
      });
      navigation.goBack();
    } catch (error) {
      console.error('Error deleting lead:', error);
      toast.show({
        title: "Failed to delete lead",
        status: "error",
        placement: "top",
      });
    } finally {
      setDeleteConfirmOpen(false);
    }
  };

  // Handle making a phone call
  const handleCall = async () => {
    if (lead?.globalLead?.phoneNumber) {
      try {
        await makePhoneCall(lead.globalLead.phoneNumber);
        navigation.navigate('Call', { 
          leadId: lead.id,
          phoneNumber: lead.globalLead.phoneNumber,
          contactName: lead.globalLead.contactName,
        });
      } catch (error) {
        console.error('Error making phone call:', error);
        toast.show({
          title: "Couldn't place call",
          description: error.message || "Please try again",
          status: "error",
          placement: "top",
        });
      }
    }
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'new': return 'info';
      case 'contacted': return 'warning';
      case 'qualified': return 'success';
      case 'unqualified': return 'error';
      case 'converted': return 'purple';
      default: return 'gray';
    }
  };

  // Format priority level
  const getPriorityText = (priority) => {
    if (priority >= 8) return 'High';
    if (priority >= 4) return 'Medium';
    return 'Low';
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (isLoading || !lead) {
    return (
      <Center flex={1}>
        <Spinner size="lg" color="primary.500" />
        <Text mt={4} color="gray.500">Loading lead details...</Text>
      </Center>
    );
  }

  return (
    <Box flex={1} safeArea>
      <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
        {/* Header */}
        <Box px={4} pt={4} pb={2}>
          <HStack alignItems="center" space={2}>
            <IconButton
              icon={<Icon as={Feather} name="arrow-left" size={6} />}
              onPress={() => navigation.goBack()}
              variant="ghost"
              borderRadius="full"
            />
            <Heading flex={1} numberOfLines={1}>{lead.globalLead.contactName}</Heading>
            <Menu
              trigger={(triggerProps) => {
                return (
                  <IconButton
                    {...triggerProps}
                    icon={<Icon as={Feather} name="more-vertical" size={6} />}
                    variant="ghost"
                    borderRadius="full"
                  />
                );
              }}
            >
              <Menu.Item onPress={handleEditLead} leftIcon={<Icon as={Feather} name="edit" size={5} />}>
                Edit Lead
              </Menu.Item>
              <Menu.Item 
                onPress={() => setDeleteConfirmOpen(true)} 
                leftIcon={<Icon as={Feather} name="trash" size={5} />}
                _text={{ color: 'error.500' }}
              >
                Delete Lead
              </Menu.Item>
            </Menu>
          </HStack>

          <HStack mt={2} space={2}>
            <Badge colorScheme={getStatusColor(lead.status)} variant="subtle" rounded="md">
              {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
            </Badge>
            <Badge colorScheme={lead.priority >= 8 ? "error" : lead.priority >= 4 ? "warning" : "success"} rounded="md">
              {getPriorityText(lead.priority)} Priority
            </Badge>
          </HStack>
        </Box>

        {/* Contact Info Section */}
        <Box px={4} py={4} bg="white">
          <Heading size="md" mb={4}>Contact Information</Heading>
          
          <VStack space={3}>
            <HStack space={3} alignItems="center">
              <Icon as={Feather} name="briefcase" size={5} color="gray.500" />
              <VStack>
                <Text fontWeight="medium">Company</Text>
                <Text color="gray.600">{lead.globalLead.companyName || 'N/A'}</Text>
              </VStack>
            </HStack>

            <Pressable onPress={handleCall}>
              <HStack space={3} alignItems="center">
                <Icon as={Feather} name="phone" size={5} color="primary.500" />
                <VStack>
                  <Text fontWeight="medium">Phone</Text>
                  <Text color="primary.500" underline>
                    {lead.globalLead.phoneNumber || 'N/A'}
                  </Text>
                </VStack>
              </HStack>
            </Pressable>

            <HStack space={3} alignItems="center">
              <Icon as={Feather} name="mail" size={5} color="gray.500" />
              <VStack>
                <Text fontWeight="medium">Email</Text>
                <Text color="gray.600">{lead.globalLead.email || 'N/A'}</Text>
              </VStack>
            </HStack>

            {lead.globalLead.address && (
              <HStack space={3} alignItems="center">
                <Icon as={Feather} name="map-pin" size={5} color="gray.500" />
                <VStack>
                  <Text fontWeight="medium">Address</Text>
                  <Text color="gray.600">
                    {lead.globalLead.address}{lead.globalLead.city && `, ${lead.globalLead.city}`}
                    {lead.globalLead.state && `, ${lead.globalLead.state}`} {lead.globalLead.zipCode}
                  </Text>
                </VStack>
              </HStack>
            )}

            {lead.globalLead.website && (
              <HStack space={3} alignItems="center">
                <Icon as={Feather} name="globe" size={5} color="gray.500" />
                <VStack>
                  <Text fontWeight="medium">Website</Text>
                  <Text color="gray.600">{lead.globalLead.website}</Text>
                </VStack>
              </HStack>
            )}

            {lead.globalLead.industry && (
              <HStack space={3} alignItems="center">
                <Icon as={Feather} name="tag" size={5} color="gray.500" />
                <VStack>
                  <Text fontWeight="medium">Industry</Text>
                  <Text color="gray.600">{lead.globalLead.industry}</Text>
                </VStack>
              </HStack>
            )}
          </VStack>
        </Box>

        <Divider my={1} bg="gray.200" />

        {/* Notes Section */}
        <Box px={4} py={4} bg="white">
          <Heading size="md" mb={4}>Notes</Heading>
          <Text color="gray.600">{lead.notes || 'No notes added yet.'}</Text>
        </Box>

        <Divider my={1} bg="gray.200" />

        {/* Call History Section */}
        <Box px={4} py={4} bg="white">
          <HStack alignItems="center" justifyContent="space-between" mb={4}>
            <Heading size="md">Call History</Heading>
            <Badge colorScheme="gray">{calls.length}</Badge>
          </HStack>

          {callsLoading ? (
            <Center py={4}>
              <Spinner size="sm" color="primary.500" />
              <Text mt={2} color="gray.500">Loading calls...</Text>
            </Center>
          ) : calls.length === 0 ? (
            <Center py={4}>
              <Icon as={Feather} name="phone-missed" size={12} color="gray.300" />
              <Text mt={2} color="gray.500">No call history yet</Text>
            </Center>
          ) : (
            <VStack space={3}>
              {calls.slice(0, 5).map((call) => (
                <CallItem key={call.id} call={call} compact={true} />
              ))}
              
              {calls.length > 5 && (
                <Pressable 
                  onPress={() => navigation.navigate('CallLog', { leadId: lead.id })}
                  py={2}
                >
                  <HStack justifyContent="center" space={1}>
                    <Text color="primary.500" fontWeight="medium">View all calls</Text>
                    <Icon as={Feather} name="chevron-right" size={4} color="primary.500" />
                  </HStack>
                </Pressable>
              )}
            </VStack>
          )}
        </Box>

        <Divider my={1} bg="gray.200" />

        {/* Activity Timeline Section */}
        <Box px={4} py={4} bg="white">
          <Heading size="md" mb={4}>Timeline</Heading>
          <VStack space={4}>
            <HStack space={3}>
              <Center size={10} bg="primary.100" rounded="full">
                <Icon as={Feather} name="user-plus" size={5} color="primary.500" />
              </Center>
              <VStack flex={1}>
                <Text fontWeight="medium">Lead created</Text>
                <Text color="gray.500" fontSize="sm">{formatDate(lead.createdAt)}</Text>
              </VStack>
            </HStack>

            {lead.lastContactedAt && (
              <HStack space={3}>
                <Center size={10} bg="blue.100" rounded="full">
                  <Icon as={Feather} name="phone-outgoing" size={5} color="blue.500" />
                </Center>
                <VStack flex={1}>
                  <Text fontWeight="medium">Last contacted</Text>
                  <Text color="gray.500" fontSize="sm">{formatDate(lead.lastContactedAt)}</Text>
                </VStack>
              </HStack>
            )}

            {lead.reminderDate && new Date(lead.reminderDate) > new Date() && (
              <HStack space={3}>
                <Center size={10} bg="amber.100" rounded="full">
                  <Icon as={Feather} name="clock" size={5} color="amber.500" />
                </Center>
                <VStack flex={1}>
                  <Text fontWeight="medium">Follow-up reminder</Text>
                  <Text color="gray.500" fontSize="sm">{formatDate(lead.reminderDate)}</Text>
                </VStack>
              </HStack>
            )}
          </VStack>
        </Box>

        <Box height={20} /> {/* Extra space at bottom */}
      </ScrollView>

      {/* NewCallFAB will handle calls now */}
      <NewCallFAB leadId={lead.id} />

      {/* Delete confirmation dialog */}
      <AlertDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <AlertDialog.Content>
          <AlertDialog.CloseButton />
          <AlertDialog.Header>Delete Lead</AlertDialog.Header>
          <AlertDialog.Body>
            Are you sure you want to delete this lead? This action cannot be undone.
          </AlertDialog.Body>
          <AlertDialog.Footer>
            <Button.Group space={2}>
              <Button
                variant="unstyled"
                colorScheme="coolGray"
                onPress={() => setDeleteConfirmOpen(false)}
              >
                Cancel
              </Button>
              <Button colorScheme="danger" onPress={handleDeleteLead}>
                Delete
              </Button>
            </Button.Group>
          </AlertDialog.Footer>
        </AlertDialog.Content>
      </AlertDialog>
    </Box>
  );
};

export default LeadDetailScreen;
