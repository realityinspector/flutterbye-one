import React, { useState, useCallback } from 'react';
import {
  Box,
  FlatList,
  VStack,
  Heading,
  Text,
  HStack,
  Input,
  Icon,
  IconButton,
  Menu,
  Pressable,
  Spinner,
  Center,
  Divider,
  Fab,
  useDisclose,
  Actionsheet,
} from 'native-base';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useLeads, UserLead } from '../hooks/useLeads';
import LeadCard from '../components/LeadCard';

// Sort options
const SORT_OPTIONS = [
  { label: 'Company Name', value: 'companyName' },
  { label: 'Recent First', value: 'recent' },
  { label: 'Status', value: 'status' },
  { label: 'Priority (High to Low)', value: 'priority' },
];

// Filter options for lead status
const STATUS_FILTERS = [
  { label: 'All Leads', value: 'all' },
  { label: 'New', value: 'new' },
  { label: 'Contacted', value: 'contacted' },
  { label: 'Qualified', value: 'qualified' },
  { label: 'Unqualified', value: 'unqualified' },
  { label: 'Converted', value: 'converted' },
];

const LeadScreen = () => {
  const navigation = useNavigation();
  const { leads, isLoading, refetchLeads } = useLeads();
  const { isOpen, onOpen, onClose } = useDisclose();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('companyName');
  const [statusFilter, setStatusFilter] = useState('all');
  const [filteredLeads, setFilteredLeads] = useState<UserLead[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  
  // Apply filtering and sorting to leads
  useFocusEffect(
    useCallback(() => {
      if (!leads) return;
      
      let filtered = [...leads];
      
      // Apply search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(lead => 
          lead.globalLead?.companyName?.toLowerCase().includes(query) ||
          lead.globalLead?.contactName?.toLowerCase().includes(query) ||
          lead.globalLead?.phoneNumber?.includes(query) ||
          lead.globalLead?.email?.toLowerCase().includes(query)
        );
      }
      
      // Apply status filter
      if (statusFilter !== 'all') {
        filtered = filtered.filter(lead => lead.status === statusFilter);
      }
      
      // Apply sorting
      switch (sortOption) {
        case 'companyName':
          filtered.sort((a, b) => {
            const aName = a.globalLead?.companyName?.toLowerCase() || '';
            const bName = b.globalLead?.companyName?.toLowerCase() || '';
            return aName.localeCompare(bName);
          });
          break;
        case 'recent':
          filtered.sort((a, b) => 
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
          break;
        case 'status':
          filtered.sort((a, b) => {
            const STATUS_PRIORITY = {
              'new': 0,
              'contacted': 1,
              'qualified': 2,
              'unqualified': 3,
              'converted': 4,
            };
            return STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status];
          });
          break;
        case 'priority':
          filtered.sort((a, b) => b.priority - a.priority);
          break;
      }
      
      setFilteredLeads(filtered);
    }, [leads, searchQuery, sortOption, statusFilter])
  );
  
  const handleRefresh = async () => {
    setRefreshing(true);
    await refetchLeads();
    setRefreshing(false);
  };
  
  const handleLeadPress = (leadId: number) => {
    navigation.navigate('LeadDetail' as never, { leadId } as never);
  };
  
  // Render empty state
  const renderEmptyState = () => (
    <Center flex={1} p={10}>
      <Icon as={Feather} name="users" size="4xl" color="gray.300" mb={4} />
      <Heading size="md" color="gray.500" textAlign="center">
        No leads found
      </Heading>
      
      {searchQuery || statusFilter !== 'all' ? (
        <Text color="gray.400" textAlign="center" mt={2}>
          Try adjusting your search or filters
        </Text>
      ) : (
        <Text color="gray.400" textAlign="center" mt={2}>
          Add new leads to get started
        </Text>
      )}
      
      <Button
        mt={6}
        leftIcon={<Icon as={Feather} name="user-plus" size="sm" />}
        onPress={() => navigation.navigate('LeadForm' as never)}
      >
        Add New Lead
      </Button>
    </Center>
  );
  
  return (
    <Box flex={1} bg="gray.50" safeArea>
      {/* Header */}
      <VStack px={4} pt={4} pb={2} space={1}>
        <Heading size="lg" color="primary.600">Leads</Heading>
        <Text color="gray.500" fontSize="sm">
          {filteredLeads.length} {filteredLeads.length === 1 ? 'lead' : 'leads'} total
        </Text>
      </VStack>
      
      {/* Search and filter bar */}
      <HStack space={2} px={4} py={2} alignItems="center">
        <Input
          placeholder="Search leads..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          flex={1}
          rounded="full"
          bg="white"
          borderColor="gray.200"
          fontSize="sm"
          InputLeftElement={
            <Icon as={Feather} name="search" size="sm" color="gray.400" ml={3} />
          }
          InputRightElement={
            searchQuery ? (
              <IconButton
                icon={<Icon as={Feather} name="x" size="xs" color="gray.400" />}
                onPress={() => setSearchQuery('')}
                mr={1}
                borderRadius="full"
              />
            ) : null
          }
        />
        
        <Menu
          trigger={triggerProps => (
            <IconButton
              {...triggerProps}
              icon={<Icon as={Feather} name="filter" />}
              borderRadius="full"
              variant="ghost"
            />
          )}
        >
          <Menu.OptionGroup
            title="Filter by Status"
            type="radio"
            defaultValue={statusFilter}
            onChange={value => setStatusFilter(value as string)}
          >
            {STATUS_FILTERS.map(filter => (
              <Menu.ItemOption key={filter.value} value={filter.value}>
                {filter.label}
              </Menu.ItemOption>
            ))}
          </Menu.OptionGroup>
        </Menu>
        
        <Menu
          trigger={triggerProps => (
            <IconButton
              {...triggerProps}
              icon={<Icon as={Feather} name="arrow-up-down" />}
              borderRadius="full"
              variant="ghost"
            />
          )}
        >
          <Menu.OptionGroup
            title="Sort by"
            type="radio"
            defaultValue={sortOption}
            onChange={value => setSortOption(value as string)}
          >
            {SORT_OPTIONS.map(option => (
              <Menu.ItemOption key={option.value} value={option.value}>
                {option.label}
              </Menu.ItemOption>
            ))}
          </Menu.OptionGroup>
        </Menu>
      </HStack>
      
      <Divider />
      
      {/* Lead list */}
      {isLoading ? (
        <Center flex={1}>
          <Spinner size="lg" color="primary.500" />
          <Text color="gray.500" mt={2}>Loading leads...</Text>
        </Center>
      ) : (
        <FlatList
          data={filteredLeads}
          renderItem={({ item }) => (
            <Box px={4} py={2}>
              <LeadCard
                lead={item}
                onPress={() => handleLeadPress(item.id)}
                showStatus
              />
            </Box>
          )}
          keyExtractor={item => item.id.toString()}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={{ flexGrow: 1 }}
          onRefresh={handleRefresh}
          refreshing={refreshing}
        />
      )}
      
      {/* Fab button for adding leads */}
      <Fab
        renderInPortal={false}
        shadow={2}
        size="lg"
        icon={<Icon as={Feather} name="plus" size="lg" color="white" />}
        onPress={onOpen}
        bottom={6}
        right={6}
      />
      
      {/* Action sheet for adding new leads */}
      <Actionsheet isOpen={isOpen} onClose={onClose}>
        <Actionsheet.Content>
          <Heading size="md" my={2}>Add New Leads</Heading>
          
          <Actionsheet.Item
            startIcon={<Icon as={Feather} name="user-plus" size="sm" color="primary.600" />}
            onPress={() => {
              onClose();
              navigation.navigate('LeadForm' as never);
            }}
          >
            <Text fontSize="md">Add Lead Manually</Text>
          </Actionsheet.Item>
          
          <Actionsheet.Item
            startIcon={<Icon as={Feather} name="cpu" size="sm" color="primary.600" />}
            onPress={() => {
              onClose();
              navigation.navigate('GenerateLeads' as never);
            }}
          >
            <Text fontSize="md">Generate Leads with AI</Text>
          </Actionsheet.Item>
          
          <Actionsheet.Item
            startIcon={<Icon as={Feather} name="x" size="sm" color="gray.500" />}
            onPress={onClose}
          >
            <Text fontSize="md">Cancel</Text>
          </Actionsheet.Item>
        </Actionsheet.Content>
      </Actionsheet>
    </Box>
  );
};

export default LeadScreen;
