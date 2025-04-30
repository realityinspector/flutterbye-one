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
} from 'native-base';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useLeads } from '../../hooks/useLeads';
import LeadCard from '../../components/LeadCard';

const LeadsListScreen = () => {
  const navigation = useNavigation();
  const toast = useToast();
  const { leads, isLoading, isError, refetch } = useLeads();
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('priority'); // 'priority', 'newest', 'oldest'

  // Handle navigation to lead detail
  const handleLeadPress = (lead) => {
    navigation.navigate('LeadDetail', { leadId: lead.id });
  };

  // Handle navigation to lead form for creating new lead
  const handleAddLead = () => {
    navigation.navigate('LeadForm');
  };

  // Filter and sort leads
  const filteredLeads = React.useMemo(() => {
    if (!leads) return [];
    
    let result = [...leads];
    
    // Apply status filter
    if (filterStatus) {
      result = result.filter(lead => lead.status === filterStatus);
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
      <Center flex={1}>
        <Spinner size="lg" color="primary.500" />
        <Text mt={4} color="gray.500">Loading leads...</Text>
      </Center>
    );
  }

  // Show error state
  if (isError) {
    return (
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
    );
  }

  // Show empty state
  if (filteredLeads.length === 0) {
    return (
      <Box flex={1} p={4} safeArea>
        <HStack alignItems="center" justifyContent="space-between" mb={4}>
          <Heading size="lg">Leads</Heading>
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
    );
  }

  // Show leads list
  return (
    <Box flex={1} p={4} safeArea>
      <HStack alignItems="center" justifyContent="space-between" mb={4}>
        <Heading size="lg">Leads ({filteredLeads.length})</Heading>
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

      <FlatList
        data={filteredLeads}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <Pressable onPress={() => handleLeadPress(item)} mb={3}>
            <LeadCard lead={item} showStatus={true} />
          </Pressable>
        )}
        showsVerticalScrollIndicator={false}
      />
    </Box>
  );
};

export default LeadsListScreen;
