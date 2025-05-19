import React, { useState } from 'react';
import {
  Box,
  FlatList,
  Heading,
  HStack,
  VStack,
  Text,
  Spacer,
  Pressable,
  Icon,
  Spinner,
  Center,
  Select,
  IconButton,
  Input,
  InputGroup,
  InputLeftAddon,
  useToast,
  Divider,
  useBreakpointValue,
  Button,
} from 'native-base';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useLeads } from '../../hooks/useLeads';
import LeadCard from '../../components/LeadCard';
import NewCallFAB from '../../components/NewCallFAB';
import Footer from '../../components/Footer';
import MobileHeader from '../../components/MobileHeader';
import TeamLeadFilterToggle from '../../components/TeamLeadFilterToggle';

const LeadsListScreen = () => {
  const navigation = useNavigation();
  const toast = useToast();
  const { leads, isLoading, isError, refetch } = useLeads();
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('priority'); // 'priority', 'newest', 'oldest'
  const [teamFilter, setTeamFilter] = useState('all'); // 'all', 'team', 'personal'
  
  // Responsive layout for enhanced grid view on larger screens
  const numColumns = useBreakpointValue({
    base: 1,
    md: 2,
    lg: 3,
  });

  // Handle navigation to lead detail with visual feedback
  const handleLeadPress = (lead) => {
    // Show a brief toast notification when navigating to enhance the experience
    toast.show({
      title: "Opening lead details",
      status: "info",
      duration: 1000,
      placement: "top"
    });
    
    // Navigate to the lead detail screen with the lead ID
    navigation.navigate('LeadDetail', { leadId: lead.id });
  };

  // Handle view contact button press
  const handleViewContact = (lead) => {
    console.log("View contact details for lead", lead.id, lead.globalLead?.companyName);
    navigation.navigate('LeadDetail', { leadId: lead.id, viewContactCard: true });
  };

  // Handle call lead button press
  const handleCallLead = (lead) => {
    console.log("Call lead", lead.id, lead.globalLead?.phoneNumber);
    if (lead.globalLead?.phoneNumber) {
      // Navigate to Call screen with lead information
      navigation.navigate('Call', { 
        leadId: lead.id,
        phoneNumber: lead.globalLead?.phoneNumber,
        contactName: lead.globalLead?.contactName || lead.globalLead?.companyName
      });
    } else {
      toast.show({
        title: "No phone number available",
        status: "warning",
        duration: 3000
      });
    }
  };

  // Handle edit lead button press
  const handleEditLead = (lead) => {
    console.log("Edit lead", lead.id, lead.globalLead?.companyName);
    navigation.navigate('AddLead', { leadId: lead.id, isEditing: true });
  };

  // Handle delete lead button press
  const handleDeleteLead = (lead) => {
    console.log("Delete lead", lead.id, lead.globalLead?.companyName);
    
    // Show confirmation dialog
    toast.show({
      title: "Confirm Deletion",
      description: `Are you sure you want to delete ${lead.globalLead?.companyName || 'this lead'}?`,
      status: "warning",
      duration: 5000,
      isClosable: true,
      placement: "top",
      render: ({id}) => (
        <Box bg="warning.100" p={3} rounded="md">
          <HStack alignItems="center" space={2}>
            <Icon as={Feather} name="alert-triangle" size={5} color="warning.600" />
            <VStack flex={1}>
              <Text fontWeight="bold" color="warning.800">
                Confirm Delete
              </Text>
              <Text color="warning.700">
                Are you sure you want to delete {lead.globalLead?.companyName || 'this lead'}?
              </Text>
            </VStack>
          </HStack>
          <HStack mt={3} justifyContent="flex-end" space={2}>
            <Button 
              size="sm" 
              variant="ghost" 
              onPress={() => toast.close(id)}
            >
              Cancel
            </Button>
            <Button 
              size="sm" 
              colorScheme="error" 
              onPress={() => {
                // Here we would actually delete the lead
                deleteLead(lead.id);
                toast.close(id);
                toast.show({
                  title: "Lead deleted",
                  status: "success",
                  duration: 3000
                });
              }}
            >
              Delete
            </Button>
          </HStack>
        </Box>
      )
    });
  };

  // Handle navigation to lead form for creating new lead
  const handleAddLead = () => {
    navigation.navigate('AddLead');
  };

  // Filter and sort leads
  const filteredLeads = React.useMemo(() => {
    if (!leads) return [];
    
    let result = [...leads];
    
    // Apply status filter
    if (filterStatus) {
      result = result.filter(lead => lead.status === filterStatus);
    }
    
    // Apply team/personal filter
    if (teamFilter !== 'all') {
      if (teamFilter === 'team') {
        // Show only team leads (shared and have organization)
        result = result.filter(lead => lead.isShared && lead.organizationId);
      } else if (teamFilter === 'personal') {
        // Show only personal leads (not shared or no organization)
        result = result.filter(lead => !lead.isShared || !lead.organizationId);
      }
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(lead => {
        const companyName = lead.globalLead?.companyName?.toLowerCase() || '';
        const contactName = lead.globalLead?.contactName?.toLowerCase() || '';
        return companyName.includes(query) || contactName.includes(query);
      });
    }
    
    // Apply sorting
    result.sort((a, b) => {
      if (sortOrder === 'priority') {
        return b.priority - a.priority;
      } else if (sortOrder === 'newest') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      } else if (sortOrder === 'oldest') {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }
      return 0;
    });
    
    return result;
  }, [leads, filterStatus, searchQuery, sortOrder]);

  // Show loading state
  if (isLoading) {
    return (
      <Box flex={1}>
        <MobileHeader title="Leads" />
        <Center flex={1}>
          <Spinner size="lg" color="primary.500" />
          <Text mt={4} color="gray.500">Loading leads...</Text>
        </Center>
        <Footer />
      </Box>
    );
  }

  // Show error state
  if (isError) {
    return (
      <Box flex={1}>
        <MobileHeader title="Leads" />
        <Center flex={1}>
          <Icon as={Feather} name="alert-circle" size={12} color="error.500" />
          <Text mt={4} color="error.500">Failed to load leads</Text>
          <Pressable mt={4} onPress={refetch}>
            <HStack space={2} alignItems="center">
              <Icon as={Feather} name="refresh-cw" size={4} color="primary.500" />
              <Text color="primary.500">Try Again</Text>
            </HStack>
          </Pressable>
        </Center>
        <Footer />
      </Box>
    );
  }

  // Show empty state
  if (filteredLeads.length === 0) {
    return (
      <Box flex={1} bg="gray.50">
        <MobileHeader title="Leads" />
        <VStack flex={1}>
          <Box flex={1} p={4} safeArea>
            <HStack alignItems="center" justifyContent="space-between" mb={4}>
              <Heading size="lg" display={{ base: 'none', md: 'flex' }}>Leads</Heading>
              <IconButton
                icon={<Icon as={Feather} name="plus" size={6} />}
                borderRadius="full"
                bg="primary.500"
                _icon={{ color: 'white' }}
                onPress={handleAddLead}
              />
            </HStack>

            {/* Filters */}
            <HStack space={2} mb={6}>
              <Select
                flex={1}
                selectedValue={filterStatus}
                placeholder="All Statuses"
                onValueChange={value => setFilterStatus(value)}
                accessibilityLabel="Select Status"
              >
                <Select.Item label="All Statuses" value="" />
                <Select.Item label="New" value="new" />
                <Select.Item label="Contacted" value="contacted" />
                <Select.Item label="Qualified" value="qualified" />
                <Select.Item label="Unqualified" value="unqualified" />
                <Select.Item label="Converted" value="converted" />
              </Select>
              
              <Select
                flex={1}
                selectedValue={sortOrder}
                onValueChange={value => setSortOrder(value)}
                accessibilityLabel="Sort By"
              >
                <Select.Item label="Priority" value="priority" />
                <Select.Item label="Newest" value="newest" />
                <Select.Item label="Oldest" value="oldest" />
              </Select>
            </HStack>

            <InputGroup mb={4}>
              <InputLeftAddon
                children={<Icon as={Feather} name="search" size={5} color="gray.400" />}
                backgroundColor="transparent"
              />
              <Input
                placeholder="Search by name or company"
                value={searchQuery}
                onChangeText={setSearchQuery}
                flex={1}
              />
            </InputGroup>

            <Center flex={1}>
              <Icon as={Feather} name="users" size={16} color="gray.300" />
              <Text fontSize="lg" fontWeight="medium" mt={4} color="gray.500">
                No leads found
              </Text>
              <Text fontSize="sm" textAlign="center" mt={2} color="gray.400">
                {filterStatus || searchQuery 
                  ? "Try changing your filters"
                  : "Get started by adding your first lead"}
              </Text>
              {!filterStatus && !searchQuery && (
                <Pressable
                  mt={6}
                  bg="primary.500"
                  px={4}
                  py={3}
                  rounded="md"
                  onPress={handleAddLead}
                >
                  <HStack space={2} alignItems="center">
                    <Icon as={Feather} name="plus" size={5} color="white" />
                    <Text color="white" fontWeight="medium">Add Lead</Text>
                  </HStack>
                </Pressable>
              )}
            </Center>
          </Box>
          <Footer />
        </VStack>
      </Box>
    );
  }

  // Show leads list
  return (
    <Box flex={1} bg="gray.50">
      <MobileHeader title="Leads" />
      <VStack flex={1}>
        <Box flex={1} p={4} safeArea>
          <HStack alignItems="center" justifyContent="space-between" mb={4}>
            <Heading size="lg" display={{ base: 'none', md: 'flex' }}>Leads ({filteredLeads.length})</Heading>
            <Text fontWeight="bold" fontSize="md" display={{ base: 'flex', md: 'none' }}>{filteredLeads.length} leads found</Text>
            <IconButton
              icon={<Icon as={Feather} name="plus" size={6} />}
              borderRadius="full"
              bg="primary.500"
              _icon={{ color: 'white' }}
              onPress={handleAddLead}
            />
          </HStack>

          {/* Filters */}
          <HStack space={2} mb={4}>
            <Select
              flex={1}
              selectedValue={filterStatus}
              placeholder="All Statuses"
              onValueChange={value => setFilterStatus(value)}
              accessibilityLabel="Select Status"
            >
              <Select.Item label="All Statuses" value="" />
              <Select.Item label="New" value="new" />
              <Select.Item label="Contacted" value="contacted" />
              <Select.Item label="Qualified" value="qualified" />
              <Select.Item label="Unqualified" value="unqualified" />
              <Select.Item label="Converted" value="converted" />
            </Select>
            
            <Select
              flex={1}
              selectedValue={sortOrder}
              onValueChange={value => setSortOrder(value)}
              accessibilityLabel="Sort By"
            >
              <Select.Item label="Priority" value="priority" />
              <Select.Item label="Newest" value="newest" />
              <Select.Item label="Oldest" value="oldest" />
            </Select>
          </HStack>

          <InputGroup mb={2}>
            <InputLeftAddon
              children={<Icon as={Feather} name="search" size={5} color="gray.400" />}
              backgroundColor="transparent"
            />
            <Input
              placeholder="Search by name or company"
              value={searchQuery}
              onChangeText={setSearchQuery}
              flex={1}
            />
          </InputGroup>
          
          {/* Team lead filter toggle */}
          <TeamLeadFilterToggle 
            value={teamFilter}
            onChange={setTeamFilter}
          />
          
          <Divider my={2} />

          <FlatList
            data={filteredLeads}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <Box 
                mb={3} 
                mx={numColumns > 1 ? 1 : 0}
                borderWidth={1}
                borderColor="gray.200"
                rounded="lg"
                overflow="hidden"
                bg="white"
                shadow={1}
              >
                {/* Status pill row */}
                <HStack 
                  space={2} 
                  bg="gray.50" 
                  p={2} 
                  borderBottomWidth={1} 
                  borderBottomColor="gray.100"
                  flexWrap="wrap"
                >
                  <Badge 
                    colorScheme={item.status === 'new' ? 'info' : 
                      item.status === 'contacted' ? 'warning' : 
                      item.status === 'qualified' ? 'success' : 
                      item.status === 'unqualified' ? 'error' : 
                      item.status === 'converted' ? 'purple' : 'gray'} 
                    rounded="md"
                    variant="solid"
                    px={2}
                  >
                    <Text fontSize="xs" color="white">
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </Text>
                  </Badge>
                  
                  {/* Priority badge */}
                  <Badge 
                    colorScheme={item.priority >= 8 ? 'error' : 
                      item.priority >= 4 ? 'warning' : 'success'} 
                    variant="subtle" 
                    rounded="md"
                    px={2}
                  >
                    <HStack space={1} alignItems="center">
                      <Icon 
                        as={Feather} 
                        name="flag" 
                        size="2xs" 
                        color={item.priority >= 8 ? 'error.600' : 
                          item.priority >= 4 ? 'warning.600' : 'success.600'} 
                      />
                      <Text fontSize="xs">
                        {item.priority >= 8 ? 'High' : 
                          item.priority >= 4 ? 'Medium' : 'Low'} Priority
                      </Text>
                    </HStack>
                  </Badge>
                  
                  {/* Team/shared badge */}
                  {item.isShared && item.organizationId && (
                    <Badge colorScheme="blue" variant="subtle" rounded="md" px={2}>
                      <HStack space={1} alignItems="center">
                        <Icon as={Feather} name="users" size="2xs" color="blue.600" />
                        <Text fontSize="xs">
                          {item.organization?.name || 'Team'}
                        </Text>
                      </HStack>
                    </Badge>
                  )}
                  
                  {/* Reminder badge */}
                  {item.reminderDate && new Date(item.reminderDate) > new Date() && (
                    <Badge colorScheme="amber" variant="subtle" rounded="md" px={2}>
                      <HStack space={1} alignItems="center">
                        <Icon as={Feather} name="clock" size="2xs" color="amber.600" />
                        <Text fontSize="xs">
                          Reminder: {new Date(item.reminderDate).toLocaleDateString()}
                        </Text>
                      </HStack>
                    </Badge>
                  )}
                </HStack>
                
                {/* Lead content */}
                <Box p={4}>
                  <HStack justifyContent="space-between" alignItems="center" mb={2}>
                    <Heading size="sm" numberOfLines={1} maxW="70%">
                      {item.globalLead?.companyName || item.globalLead?.contactName || 'Unknown'}
                    </Heading>
                    <Text fontSize="xs" color="gray.500">
                      Last updated: {new Date(item.updatedAt).toLocaleDateString()}
                    </Text>
                  </HStack>
                  
                  {/* Contact info section */}
                  <VStack space={1} mb={3}>
                    {item.globalLead?.contactName && (
                      <HStack alignItems="center" space={1}>
                        <Icon as={Feather} name="user" size={3} color="gray.500" />
                        <Text color="gray.600" fontSize="sm">
                          {item.globalLead?.contactName}
                        </Text>
                      </HStack>
                    )}
                    
                    {item.globalLead?.phoneNumber && (
                      <HStack alignItems="center" space={1}>
                        <Icon as={Feather} name="phone" size={3} color="gray.500" />
                        <Text color="gray.600" fontSize="sm">
                          {item.globalLead?.phoneNumber}
                        </Text>
                      </HStack>
                    )}
                    
                    {item.globalLead?.email && (
                      <HStack alignItems="center" space={1}>
                        <Icon as={Feather} name="mail" size={3} color="gray.500" />
                        <Text color="gray.600" fontSize="sm" numberOfLines={1}>
                          {item.globalLead?.email}
                        </Text>
                      </HStack>
                    )}
                    
                    {item.globalLead?.industry && (
                      <HStack alignItems="center" space={1}>
                        <Icon as={Feather} name="briefcase" size={3} color="gray.500" />
                        <Text color="gray.600" fontSize="sm">
                          {item.globalLead?.industry}
                        </Text>
                      </HStack>
                    )}
                  </VStack>
                  
                  {/* Notes preview */}
                  {item.notes && (
                    <Box bg="gray.50" p={2} rounded="md" mb={3}>
                      <Text fontSize="xs" color="gray.500" mb={1}>Notes:</Text>
                      <Text fontSize="sm" numberOfLines={2}>
                        {item.notes}
                      </Text>
                    </Box>
                  )}
                  
                  {/* Last contacted info */}
                  {item.lastContactedAt && (
                    <HStack alignItems="center" space={1} mb={3}>
                      <Icon as={Feather} name="clock" size={3} color="gray.500" />
                      <Text fontSize="xs" color="gray.500">
                        Last contacted: {new Date(item.lastContactedAt).toLocaleDateString()}
                      </Text>
                    </HStack>
                  )}
                </Box>
                
                {/* Action buttons */}
                <HStack 
                  space={1} 
                  p={2} 
                  borderTopWidth={1} 
                  borderTopColor="gray.100"
                  bg="gray.50"
                  justifyContent="space-between"
                >
                  <Pressable 
                    flex={1} 
                    py={2} 
                    justifyContent="center" 
                    alignItems="center"
                    _pressed={{ bg: 'gray.200' }}
                    onPress={() => handleViewContact(item)}
                  >
                    <HStack space={1} alignItems="center">
                      <Icon as={Feather} name="eye" size="sm" color="gray.600" />
                      <Text fontSize="xs" color="gray.600">View</Text>
                    </HStack>
                  </Pressable>
                  
                  <Pressable 
                    flex={1} 
                    py={2} 
                    justifyContent="center" 
                    alignItems="center"
                    _pressed={{ bg: 'gray.200' }}
                    onPress={() => handleCallLead(item)}
                  >
                    <HStack space={1} alignItems="center">
                      <Icon as={Feather} name="phone" size="sm" color="green.600" />
                      <Text fontSize="xs" color="green.600">Call</Text>
                    </HStack>
                  </Pressable>
                  
                  <Pressable 
                    flex={1} 
                    py={2} 
                    justifyContent="center" 
                    alignItems="center"
                    _pressed={{ bg: 'gray.200' }}
                    onPress={() => handleEditLead(item)}
                  >
                    <HStack space={1} alignItems="center">
                      <Icon as={Feather} name="edit-2" size="sm" color="blue.600" />
                      <Text fontSize="xs" color="blue.600">Edit</Text>
                    </HStack>
                  </Pressable>
                  
                  <Pressable 
                    flex={1} 
                    py={2} 
                    justifyContent="center" 
                    alignItems="center"
                    _pressed={{ bg: 'gray.200' }}
                    onPress={() => handleDeleteLead(item)}
                  >
                    <HStack space={1} alignItems="center">
                      <Icon as={Feather} name="trash-2" size="sm" color="red.600" />
                      <Text fontSize="xs" color="red.600">Delete</Text>
                    </HStack>
                  </Pressable>
                </HStack>
              </Box>
            )}
            numColumns={numColumns}
            key={numColumns} // Force re-render when layout changes
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 80 }} /* Add padding for the FAB */
          />
          <NewCallFAB />
        </Box>
        <Footer />
      </VStack>
    </Box>
  );
};

export default LeadsListScreen;
