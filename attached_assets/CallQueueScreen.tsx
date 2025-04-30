import React, { useState, useEffect } from 'react';
import {
  Box,
  FlatList,
  Heading,
  Text,
  VStack,
  HStack,
  IconButton,
  Icon,
  Button,
  Spinner,
  Center,
  Divider,
  Menu,
  Pressable,
  Badge,
} from 'native-base';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useLeads } from '../hooks/useLeads';
import LeadCard from '../components/LeadCard';
import { makePhoneCall } from '../utils/permissions';

// Sort options for the call queue
const SORT_OPTIONS = [
  { label: 'Priority (High to Low)', value: 'priority' },
  { label: 'Last Contact (Oldest First)', value: 'lastContacted' },
  { label: 'Company Name (A-Z)', value: 'companyName' },
  { label: 'Status', value: 'status' },
];

// Status priority order for sorting
const STATUS_PRIORITY = {
  'new': 0,
  'contacted': 1,
  'qualified': 2,
  'unqualified': 3,
  'converted': 4,
};

const CallQueueScreen = () => {
  const navigation = useNavigation();
  const { leads, isLoading, refetchLeads } = useLeads();
  const [sortOption, setSortOption] = useState('priority');
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  
  // Apply sorting and filtering to leads
  useEffect(() => {
    if (!leads) return;
    
    let sorted = [...leads];
    
    // Apply sorting
    switch (sortOption) {
      case 'priority':
        sorted.sort((a, b) => b.priority - a.priority);
        break;
      case 'lastContacted':
        sorted.sort((a, b) => {
          if (!a.lastContactedAt) return -1;
          if (!b.lastContactedAt) return 1;
          return new Date(a.lastContactedAt).getTime() - new Date(b.lastContactedAt).getTime();
        });
        break;
      case 'companyName':
        sorted.sort((a, b) => {
          const aName = a.globalLead?.companyName || '';
          const bName = b.globalLead?.companyName || '';
          return aName.localeCompare(bName);
        });
        break;
      case 'status':
        sorted.sort((a, b) => {
          return STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status];
        });
        break;
    }
    
    // Filter out "do not call" leads
    sorted = sorted.filter(lead => lead.status !== 'unqualified');
    
    setFilteredLeads(sorted);
  }, [leads, sortOption]);
  
  const handleRefresh = async () => {
    setRefreshing(true);
    await refetchLeads();
    setRefreshing(false);
  };
  
  const handleStartCall = (lead) => {
    navigation.navigate('Call' as never, { leadId: lead.id } as never);
  };
  
  // Render empty state
  const renderEmptyState = () => (
    <Center flex={1} p={10}>
      <Icon as={Feather} name="phone-off" size="4xl" color="gray.300" mb={4} />
      <Heading size="md" color="gray.500" textAlign="center">
        No leads in your call queue
      </Heading>
      <Text color="gray.400" textAlign="center" mt={2}>
        Add new leads or generate some with AI to get started
      </Text>
      <Button
        mt={6}
        leftIcon={<Icon as={Feather} name="user-plus" size="sm" />}
        onPress={() => navigation.navigate('LeadForm' as never)}
      >
        Add New Lead
      </Button>
    </Center>
  );
  
  // Render a lead item in the queue
  const renderLeadItem = ({ item }) => (
    <Box mb={3}>
      <LeadCard
        lead={item}
        onPress={() => navigation.navigate('LeadDetail' as never, { leadId: item.id } as never)}
        rightElement={
          <IconButton
            icon={<Icon as={Feather} name="phone-outgoing" size="sm" color="white" />}
            onPress={() => handleStartCall(item)}
            rounded="full"
            bg="primary.500"
            _pressed={{ bg: 'primary.600' }}
            mr={1}
          />
        }
        showStatus
      />
    </Box>
  );
  
  return (
    <Box flex={1} bg="gray.50" safeArea>
      <VStack px={4} pt={4} pb={2} space={1}>
        <HStack alignItems="center" justifyContent="space-between">
          <Heading size="lg" color="primary.600">Call Queue</Heading>
          
          <Menu
            w="190"
            trigger={triggerProps => (
              <Pressable {...triggerProps}>
                <HStack alignItems="center" space={1}>
                  <Text color="primary.500" fontWeight="medium">Sort</Text>
                  <Icon as={Feather} name="chevron-down" size="sm" color="primary.500" />
                </HStack>
              </Pressable>
            )}
          >
            {SORT_OPTIONS.map((option) => (
              <Menu.Item 
                key={option.value} 
                onPress={() => setSortOption(option.value)}
              >
                <HStack alignItems="center" space={2}>
                  {sortOption === option.value && (
                    <Icon as={Feather} name="check" size="xs" color="primary.500" />
                  )}
                  <Text>{option.label}</Text>
                </HStack>
              </Menu.Item>
            ))}
          </Menu>
        </HStack>
        
        <Text color="gray.500" fontSize="sm">
          {filteredLeads.length} {filteredLeads.length === 1 ? 'lead' : 'leads'} ready to call
        </Text>
      </VStack>
      
      <Divider />
      
      {isLoading ? (
        <Center flex={1}>
          <Spinner size="lg" color="primary.500" />
          <Text color="gray.500" mt={2}>Loading your call queue...</Text>
        </Center>
      ) : (
        <FlatList
          data={filteredLeads}
          renderItem={renderLeadItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={{ 
            flexGrow: 1,
            padding: 16,
            paddingBottom: 24
          }}
          ListEmptyComponent={renderEmptyState}
          onRefresh={handleRefresh}
          refreshing={refreshing}
        />
      )}
      
      {filteredLeads.length > 0 && (
        <Box position="absolute" bottom={4} right={0} left={0} alignItems="center">
          <Button
            size="lg"
            rounded="full"
            px={6}
            leftIcon={<Icon as={Feather} name="phone" size="sm" />}
            onPress={() => handleStartCall(filteredLeads[0])}
            shadow={3}
          >
            Start Calling
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default CallQueueScreen;
