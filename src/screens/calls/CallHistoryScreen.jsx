import React, { useEffect, useState } from 'react';
import {
  Box,
  FlatList,
  Heading,
  HStack,
  Icon,
  IconButton,
  Spinner,
  Center,
  Text,
  useToast,
  Select,
} from 'native-base';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useCalls } from '../../hooks/useCalls';
import { useLeads } from '../../hooks/useLeads';
import CallItem from '../../components/CallItem';

const CallHistoryScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const toast = useToast();
  const { leadId } = route.params || {};
  
  const { getCalls, getCallsByLead, isLoading } = useCalls();
  const { getLead } = useLeads();
  
  const [calls, setCalls] = useState([]);
  const [lead, setLead] = useState(null);
  const [filterOutcome, setFilterOutcome] = useState('');

  // Load calls - either all calls or calls for a specific lead
  useEffect(() => {
    const fetchData = async () => {
      try {
        let callData;
        
        if (leadId) {
          // Get calls for specific lead
          callData = await getCallsByLead(leadId);
          // Also get lead details for the header
          const leadData = await getLead(leadId);
          setLead(leadData);
        } else {
          // Get all calls
          callData = await getCalls();
        }
        
        setCalls(callData);
      } catch (error) {
        console.error('Error fetching calls:', error);
        toast.show({
          title: "Failed to load calls",
          status: "error",
          placement: "top",
        });
      }
    };
    
    fetchData();
  }, [leadId]);

  // Filter calls by outcome
  const filteredCalls = React.useMemo(() => {
    if (!calls) return [];
    
    if (filterOutcome) {
      return calls.filter(call => call.outcome === filterOutcome);
    }
    
    return calls;
  }, [calls, filterOutcome]);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <Center flex={1}>
        <Spinner size="lg" color="primary.500" />
        <Text mt={4} color="gray.500">Loading calls...</Text>
      </Center>
    );
  }

  return (
    <Box flex={1} safeArea bg="white">
      {/* Header */}
      <Box px={4} pt={4} pb={2}>
        <HStack alignItems="center" space={2}>
          <IconButton
            icon={<Icon as={Feather} name="arrow-left" size={6} />}
            onPress={() => navigation.goBack()}
            variant="ghost"
            borderRadius="full"
          />
          <Heading flex={1}>
            {leadId && lead 
              ? `Calls with ${lead.globalLead.contactName}` 
              : 'Call History'}
          </Heading>
        </HStack>
      </Box>
      
      {/* Filter */}
      <Box px={4} py={2}>
        <Select
          selectedValue={filterOutcome}
          onValueChange={value => setFilterOutcome(value)}
          placeholder="Filter by outcome"
          accessibilityLabel="Filter calls by outcome"
        >
          <Select.Item label="All Outcomes" value="" />
          <Select.Item label="Completed" value="completed" />
          <Select.Item label="Left Message" value="left_message" />
          <Select.Item label="No Answer" value="no_answer" />
          <Select.Item label="Interested" value="interested" />
          <Select.Item label="Not Interested" value="not_interested" />
          <Select.Item label="Meeting Scheduled" value="meeting_scheduled" />
          <Select.Item label="Do Not Call" value="do_not_call" />
        </Select>
      </Box>

      {/* Calls list */}
      {filteredCalls.length === 0 ? (
        <Center flex={1}>
          <Icon as={Feather} name="phone-off" size={16} color="gray.300" />
          <Text fontSize="lg" fontWeight="medium" mt={4} color="gray.500">
            No calls found
          </Text>
          <Text fontSize="sm" textAlign="center" mt={2} color="gray.400">
            {filterOutcome ? "Try changing your filter" : "No call history available"}
          </Text>
        </Center>
      ) : (
        <FlatList
          data={filteredCalls}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <Box px={4} py={2}>
              <CallItem 
                call={item} 
                leadName={!leadId} // Show lead name only when viewing all calls
              />
            </Box>
          )}
          ItemSeparatorComponent={() => <Box h="1px" bg="gray.100" />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </Box>
  );
};

export default CallHistoryScreen;
