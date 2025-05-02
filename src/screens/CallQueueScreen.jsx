import React, { useState, useEffect } from 'react';
import {
  Box,
  FlatList,
  Heading,
  VStack,
  HStack,
  Text,
  Icon,
  Badge,
  Spinner,
  Center,
  Pressable,
  useToast,
  Button,
  Select,
  IconButton,
  Menu,
} from 'native-base';
import Feather from 'react-native-vector-icons/Feather';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useLeads } from '../hooks/useLeads';
import { makePhoneCall } from '../utils/permissions';
import LeadCard from '../components/LeadCard';
import Footer from '../components/Footer';
import MobileHeader from '../components/MobileHeader';

const CallQueueScreen = () => {
  const navigation = useNavigation();
  const toast = useToast();
  
  const { leads, isLoading, isError, refetch, updateLead } = useLeads();
  
  const [sortType, setSortType] = useState('priority'); // 'priority', 'lastContacted', 'reminder'
  const [filterReminders, setFilterReminders] = useState(false);

  // Filter and sort leads for the call queue
  const callQueue = React.useMemo(() => {
    if (!leads) return [];
    
    // Start with a copy of the leads array
    let queue = [...leads];
    
    // Filter by reminders if required
    if (filterReminders) {
      queue = queue.filter(lead => lead.reminderDate && new Date(lead.reminderDate) <= new Date());
    }
    
    // Sort the queue based on selected criteria
    if (sortType === 'priority') {
      queue.sort((a, b) => b.priority - a.priority);
    } else if (sortType === 'lastContacted') {
      queue.sort((a, b) => {
        // Leads never contacted come first
        if (!a.lastContactedAt && b.lastContactedAt) return -1;
        if (a.lastContactedAt && !b.lastContactedAt) return 1;
        if (!a.lastContactedAt && !b.lastContactedAt) return 0;
        
        // Then sort by last contacted date (oldest first)
        return new Date(a.lastContactedAt) - new Date(b.lastContactedAt);
      });
    } else if (sortType === 'reminder') {
      queue.sort((a, b) => {
        // Leads with reminders due now come first
        if (a.reminderDate && !b.reminderDate) return -1;
        if (!a.reminderDate && b.reminderDate) return 1;
        if (!a.reminderDate && !b.reminderDate) return 0;
        
        // Then sort by reminder date
        return new Date(a.reminderDate) - new Date(b.reminderDate);
      });
    }
    
    return queue;
  }, [leads, sortType, filterReminders]);

  // Handle making a call
  const handleCall = async (lead) => {
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

  // Mark a lead as contacted and update status
  const handleMarkContacted = async (lead, newStatus = 'contacted') => {
    try {
      await updateLead(lead.id, {
        status: newStatus,
        lastContactedAt: new Date().toISOString(),
      });
      
      toast.show({
        title: "Lead updated",
        description: "Lead marked as " + newStatus,
        status: "success",
        placement: "top",
      });
    } catch (error) {
      console.error('Error updating lead:', error);
      toast.show({
        title: "Update failed",
        description: error.message || "Please try again",
        status: "error",
        placement: "top",
      });
    }
  };

  // View lead details
  const handleViewLead = (lead) => {
    navigation.navigate('LeadDetail', { leadId: lead.id });
  };

  // Render the right element for lead cards
  const renderCallButton = (lead) => {
    return (
      <Button
        onPress={() => handleCall(lead)}
        leftIcon={<Icon as={Feather} name="phone" size={4} color="white" />}
        size="sm"
        colorScheme="success"
      >
        Call
      </Button>
    );
  };

  // Render actions menu
  const renderActionsMenu = (lead) => {
    return (
      <Menu
        trigger={(triggerProps) => {
          return (
            <IconButton
              {...triggerProps}
              icon={<Icon as={Feather} name="more-vertical" size={5} />}
              variant="ghost"
              _icon={{ color: "gray.500" }}
            />
          );
        }}
        placement="bottom right"
      >
        <Menu.Item onPress={() => handleViewLead(lead)}>
          <HStack alignItems="center" space={2}>
            <Icon as={Feather} name="eye" size={4} />
            <Text>View Details</Text>
          </HStack>
        </Menu.Item>
        <Menu.Item onPress={() => handleMarkContacted(lead, 'contacted')}>
          <HStack alignItems="center" space={2}>
            <Icon as={Feather} name="check" size={4} />
            <Text>Mark Contacted</Text>
          </HStack>
        </Menu.Item>
        <Menu.Item onPress={() => handleMarkContacted(lead, 'qualified')}>
          <HStack alignItems="center" space={2}>
            <Icon as={Feather} name="thumbs-up" size={4} />
            <Text>Mark Qualified</Text>
          </HStack>
        </Menu.Item>
        <Menu.Item onPress={() => handleMarkContacted(lead, 'unqualified')}>
          <HStack alignItems="center" space={2}>
            <Icon as={Feather} name="thumbs-down" size={4} />
            <Text>Mark Unqualified</Text>
          </HStack>
        </Menu.Item>
      </Menu>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <Box flex={1} bg="white" safeArea>
        <MobileHeader title="Call Queue" />
        <Center flex={1}>
          <Spinner size="lg" color="primary.500" />
          <Text mt={4} color="gray.500">Loading call queue...</Text>
        </Center>
        <Footer />
      </Box>
    );
  }

  // Error state
  if (isError) {
    return (
      <Box flex={1} bg="white" safeArea>
        <MobileHeader title="Call Queue" />
        <Center flex={1}>
          <Icon as={Feather} name="alert-circle" size={12} color="error.500" />
          <Text mt={4} color="error.500">Failed to load call queue</Text>
          <Button mt={4} onPress={refetch} leftIcon={<Icon as={Feather} name="refresh-cw" size={4} />}>
            Try Again
          </Button>
        </Center>
        <Footer />
      </Box>
    );
  }

  // Empty queue state
  if (callQueue.length === 0) {
    return (
      <Box flex={1} bg="white" safeArea>
        <MobileHeader title="Call Queue" />
        <VStack p={4} space={4} flex={1}>
          <Heading size="lg" display={{ base: 'none', md: 'flex' }}>Call Queue</Heading>
          
          <HStack space={4} justifyContent="space-between">
            <Select
              flex={1}
              selectedValue={sortType}
              onValueChange={setSortType}
              accessibilityLabel="Sort by"
            >
              <Select.Item label="Sort by Priority" value="priority" />
              <Select.Item label="Sort by Last Contact" value="lastContacted" />
              <Select.Item label="Sort by Reminder" value="reminder" />
            </Select>
            
            <Button.Group space={2}>
              <Button
                variant={filterReminders ? "solid" : "outline"}
                colorScheme={filterReminders ? "primary" : "gray"}
                leftIcon={<Icon as={Feather} name="clock" size={4} />}
                onPress={() => setFilterReminders(!filterReminders)}
              >
                Due Reminders
              </Button>
            </Button.Group>
          </HStack>
          
          <Center flex={1} p={10}>
            <Icon as={Feather} name="phone-off" size={20} color="gray.300" />
            <Heading mt={4} size="md" color="gray.500">
              No leads in call queue
            </Heading>
            <Text mt={2} textAlign="center" color="gray.400">
              {filterReminders 
                ? "No leads with due reminders found" 
                : "Add leads to your call queue by setting priorities"}
            </Text>
            <Button
              mt={6}
              leftIcon={<Icon as={Feather} name="plus" size={5} />}
              onPress={() => navigation.navigate('LeadForm')}
            >
              Add New Lead
            </Button>
          </Center>
        </VStack>
        <Footer />
      </Box>
    );
  }

  // Call queue list view
  return (
    <Box flex={1} bg="white" safeArea>
      <MobileHeader title="Call Queue" />
      <VStack p={4} space={4} flex={1}>
        <Heading size="lg" display={{ base: 'none', md: 'flex' }}>Call Queue ({callQueue.length})</Heading>
        <Text fontWeight="bold" fontSize="md" display={{ base: 'flex', md: 'none' }}>{callQueue.length} leads in queue</Text>
        
        <HStack space={4} justifyContent="space-between">
          <Select
            flex={1}
            selectedValue={sortType}
            onValueChange={setSortType}
            accessibilityLabel="Sort by"
          >
            <Select.Item label="Sort by Priority" value="priority" />
            <Select.Item label="Sort by Last Contact" value="lastContacted" />
            <Select.Item label="Sort by Reminder" value="reminder" />
          </Select>
          
          <Button.Group space={2}>
            <Button
              variant={filterReminders ? "solid" : "outline"}
              colorScheme={filterReminders ? "primary" : "gray"}
              leftIcon={<Icon as={Feather} name="clock" size={4} />}
              onPress={() => setFilterReminders(!filterReminders)}
            >
              Due
            </Button>
          </Button.Group>
        </HStack>
        
        <FlatList
          data={callQueue}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <Box mb={4}>
              <HStack justifyContent="space-between" alignItems="center" mb={2}>
                <HStack space={2}>
                  {item.reminderDate && new Date(item.reminderDate) <= new Date() && (
                    <Badge colorScheme="amber" variant="subtle">
                      <HStack space={1} alignItems="center">
                        <Icon as={Feather} name="clock" size={3} />
                        <Text fontSize="xs">Reminder Due</Text>
                      </HStack>
                    </Badge>
                  )}
                  
                  {!item.lastContactedAt && (
                    <Badge colorScheme="info" variant="subtle">
                      <HStack space={1} alignItems="center">
                        <Icon as={Feather} name="phone-missed" size={3} />
                        <Text fontSize="xs">Never Contacted</Text>
                      </HStack>
                    </Badge>
                  )}
                </HStack>
                
                {renderActionsMenu(item)}
              </HStack>
              
              <LeadCard 
                lead={item} 
                onPress={() => handleViewLead(item)} 
                rightElement={renderCallButton(item)}
                showStatus={true}
              />
            </Box>
          )}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      </VStack>
      <Footer />
    </Box>
  );
};

export default CallQueueScreen;