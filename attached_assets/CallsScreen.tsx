import React, { useState } from 'react';
import {
  Box,
  FlatList,
  Heading,
  Text,
  VStack,
  HStack,
  Divider,
  Icon,
  Menu,
  Pressable,
  Center,
  Spinner,
  IconButton,
  Input,
} from 'native-base';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useCalls } from '../hooks/useCalls';
import CallItem from '../components/CallItem';
import { useLeads } from '../hooks/useLeads';

// Filter options
const FILTER_OPTIONS = [
  { label: 'All Calls', value: 'all' },
  { label: 'No Answer', value: 'no_answer' },
  { label: 'Call Back', value: 'call_back' },
  { label: 'Do Not Call', value: 'do_not_call' },
  { label: 'Interested', value: 'interested' },
  { label: 'Not Interested', value: 'not_interested' },
  { label: 'Meeting Scheduled', value: 'meeting_scheduled' },
];

// Sort options
const SORT_OPTIONS = [
  { label: 'Recent First', value: 'recent' },
  { label: 'Oldest First', value: 'oldest' },
  { label: 'Duration (Longest)', value: 'duration_desc' },
  { label: 'Duration (Shortest)', value: 'duration_asc' },
];

const CallsScreen = () => {
  const navigation = useNavigation();
  const { calls, isLoading, refetchCalls } = useCalls();
  const { leads } = useLeads();
  
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  
  // Get lead information for calls
  const getLeadForCall = (userLeadId: number) => {
    return leads.find(lead => lead.id === userLeadId);
  };
  
  // Apply filtering and sorting
  const getFilteredCalls = () => {
    if (!calls) return [];
    
    let filtered = [...calls];
    
    // Apply outcome filter
    if (filter !== 'all') {
      filtered = filtered.filter(call => call.outcome === filter);
    }
    
    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(call => {
        const lead = getLeadForCall(call.userLeadId);
        if (!lead) return false;
        
        return (
          lead.globalLead?.companyName?.toLowerCase().includes(query) ||
          lead.globalLead?.contactName?.toLowerCase().includes(query) ||
          call.notes?.toLowerCase().includes(query)
        );
      });
    }
    
    // Apply sorting
    switch (sortBy) {
      case 'recent':
        filtered.sort((a, b) => new Date(b.callDate).getTime() - new Date(a.callDate).getTime());
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.callDate).getTime() - new Date(b.callDate).getTime());
        break;
      case 'duration_desc':
        filtered.sort((a, b) => (b.duration || 0) - (a.duration || 0));
        break;
      case 'duration_asc':
        filtered.sort((a, b) => (a.duration || 0) - (b.duration || 0));
        break;
    }
    
    return filtered;
  };
  
  const handleRefresh = async () => {
    setRefreshing(true);
    await refetchCalls();
    setRefreshing(false);
  };
  
  const handleCallPress = (call) => {
    // Navigate to lead detail with the call highlighted
    navigation.navigate(
      'LeadDetail' as never, 
      { leadId: call.userLeadId, focusCall: call.id } as never
    );
  };
  
  const renderEmptyState = () => (
    <Center flex={1} p={10}>
      <Icon as={Feather} name="phone-off" size="4xl" color="gray.300" mb={4} />
      <Heading size="md" color="gray.500" textAlign="center">
        No calls found
      </Heading>
      
      {filter !== 'all' || searchQuery ? (
        <Text color="gray.400" textAlign="center" mt={2}>
          Try adjusting your search or filters
        </Text>
      ) : (
        <Text color="gray.400" textAlign="center" mt={2}>
          Start making calls to build your history
        </Text>
      )}
    </Center>
  );
  
  const filteredCalls = getFilteredCalls();
  
  return (
    <Box flex={1} bg="gray.50" safeArea>
      {/* Header */}
      <VStack px={4} pt={4} pb={2} space={1}>
        <HStack alignItems="center">
          <IconButton
            icon={<Icon as={Feather} name="arrow-left" size="sm" />}
            variant="ghost"
            rounded="full"
            onPress={() => navigation.goBack()}
            mr={2}
          />
          
          <Heading size="lg" color="primary.600">Call History</Heading>
        </HStack>
        
        <Text color="gray.500" fontSize="sm" ml={10}>
          {filteredCalls.length} {filteredCalls.length === 1 ? 'call' : 'calls'} recorded
        </Text>
      </VStack>
      
      {/* Search and filter bar */}
      <HStack space={2} px={4} py={2} alignItems="center">
        <Input
          placeholder="Search calls..."
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
            title="Filter by Outcome"
            type="radio"
            defaultValue={filter}
            onChange={value => setFilter(value as string)}
          >
            {FILTER_OPTIONS.map(option => (
              <Menu.ItemOption key={option.value} value={option.value}>
                {option.label}
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
            defaultValue={sortBy}
            onChange={value => setSortBy(value as string)}
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
      
      {/* Call list */}
      {isLoading ? (
        <Center flex={1}>
          <Spinner size="lg" color="primary.500" />
          <Text color="gray.500" mt={2}>Loading calls...</Text>
        </Center>
      ) : (
        <FlatList
          data={filteredCalls}
          renderItem={({ item }) => {
            const lead = getLeadForCall(item.userLeadId);
            const leadName = lead?.globalLead?.contactName;
            const companyName = lead?.globalLead?.companyName;
            
            return (
              <Box px={4} py={2}>
                <CallItem
                  call={item}
                  onPress={() => handleCallPress(item)}
                  leadName={leadName ? `${leadName} - ${companyName}` : 'Unknown Lead'}
                />
              </Box>
            );
          }}
          keyExtractor={item => item.id.toString()}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={{ flexGrow: 1 }}
          onRefresh={handleRefresh}
          refreshing={refreshing}
        />
      )}
    </Box>
  );
};

export default CallsScreen;
