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
      // Could implement actual call functionality here
      toast.show({
        title: "Calling " + (lead.globalLead?.contactName || lead.globalLead?.companyName),
        description: lead.globalLead?.phoneNumber,
        status: "info",
        duration: 3000
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
    navigation.navigate('EditLead', { leadId: lead.id });
  };

  // Handle delete lead button press
  const handleDeleteLead = (lead) => {
    console.log("Delete lead", lead.id, lead.globalLead?.companyName);
    // Could implement confirmation dialog here
    toast.show({
      title: "Delete functionality",
      description: "Delete functionality would be implemented here",
      status: "info",
      duration: 3000
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
              <Box mb={3} mx={numColumns > 1 ? 1 : 0}>
                <LeadCard 
                  lead={item} 
                  showStatus={true} 
                  onPress={() => handleLeadPress(item)}
                  onViewContact={(lead) => handleViewContact(lead)}
                  onCallLead={(lead) => handleCallLead(lead)}
                  onEditLead={(lead) => handleEditLead(lead)}
                  onDeleteLead={(lead) => handleDeleteLead(lead)}
                />
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
