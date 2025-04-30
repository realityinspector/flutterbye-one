import React, { useEffect, useState } from 'react';
import {
  Box,
  FlatList,
  Heading,
  HStack,
  Icon,
  Text,
  VStack,
  Pressable,
  Fab,
  useDisclose,
  Button,
  Actionsheet,
  ScrollView,
  Divider,
  Badge,
  Spinner,
  Center,
} from 'native-base';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { useLeads } from '../hooks/useLeads';
import { useCalls } from '../hooks/useCalls';
import LeadCard from '../components/LeadCard';
import CallItem from '../components/CallItem';

const HomeScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { leads, isLoading: isLeadsLoading, refetchLeads } = useLeads();
  const { calls, isLoading: isCallsLoading, refetchCalls } = useCalls();
  const { isOpen, onOpen, onClose } = useDisclose();
  const [refreshing, setRefreshing] = useState(false);

  // Settings for lead generation actionsheet
  const [criteria, setCriteria] = useState({
    industry: '',
    location: '',
    companySize: '',
    other: '',
  });

  useEffect(() => {
    // Check if user has completed setup
    if (user && !user.hasCompletedSetup) {
      if (user.role === 'admin') {
        navigation.navigate('AdminSetup' as never);
      } else {
        navigation.navigate('UserSetup' as never);
      }
    }
  }, [user, navigation]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchLeads(), refetchCalls()]);
    setRefreshing(false);
  };

  // Get leads with upcoming reminders
  const reminderLeads = leads
    .filter(lead => lead.reminderDate && new Date(lead.reminderDate) > new Date())
    .sort((a, b) => new Date(a.reminderDate!).getTime() - new Date(b.reminderDate!).getTime())
    .slice(0, 3);

  // Get most recent calls
  const recentCalls = calls
    .sort((a, b) => new Date(b.callDate).getTime() - new Date(a.callDate).getTime())
    .slice(0, 3);

  return (
    <Box flex={1} bg="gray.50" safeArea>
      {/* Header with welcome message */}
      <Box px={4} pt={4} pb={2}>
        <Heading size="lg" color="primary.600">
          Hello, {user?.fullName?.split(' ')[0] || 'there'}!
        </Heading>
        <Text color="gray.500" fontSize="md">
          Ready to make some calls today?
        </Text>
      </Box>

      <ScrollView 
        flex={1} 
        px={4} 
        refreshing={refreshing} 
        onRefresh={handleRefresh}
      >
        {/* Call queue summary */}
        <Pressable
          onPress={() => navigation.navigate('CallQueue' as never)}
          mt={4}
          bg="white"
          p={4}
          rounded="xl"
          shadow={2}
        >
          <HStack alignItems="center" justifyContent="space-between">
            <VStack>
              <Heading size="md" color="gray.800">
                Your Call Queue
              </Heading>
              <Text color="gray.500" fontSize="sm">
                {leads.length} leads waiting for your call
              </Text>
            </VStack>
            <Icon as={Feather} name="phone-call" size={6} color="primary.500" />
          </HStack>
          
          <Button 
            mt={3}
            leftIcon={<Icon as={Feather} name="phone" size="sm" />}
            onPress={() => navigation.navigate('CallQueue' as never)}
          >
            Start Calling
          </Button>
        </Pressable>

        {/* Upcoming reminders */}
        <Box mt={6}>
          <HStack alignItems="center" justifyContent="space-between" mb={2}>
            <Heading size="md" color="gray.800">
              Upcoming Reminders
            </Heading>
            <Pressable onPress={() => navigation.navigate('Leads' as never)}>
              <Text color="primary.500" fontSize="sm">
                See All
              </Text>
            </Pressable>
          </HStack>

          {isLeadsLoading ? (
            <Center my={4}>
              <Spinner color="primary.500" />
              <Text color="gray.500" mt={2}>Loading reminders...</Text>
            </Center>
          ) : reminderLeads.length > 0 ? (
            <VStack space={3}>
              {reminderLeads.map((lead) => (
                <LeadCard 
                  key={lead.id} 
                  lead={lead} 
                  onPress={() => 
                    navigation.navigate('LeadDetail' as never, { leadId: lead.id } as never)
                  }
                />
              ))}
            </VStack>
          ) : (
            <Box bg="white" p={4} rounded="xl" shadow={1}>
              <Text color="gray.500" textAlign="center">
                No upcoming reminders
              </Text>
            </Box>
          )}
        </Box>

        {/* Recent calls */}
        <Box mt={6} mb={8}>
          <HStack alignItems="center" justifyContent="space-between" mb={2}>
            <Heading size="md" color="gray.800">
              Recent Calls
            </Heading>
            <Pressable onPress={() => navigation.navigate('Calls' as never)}>
              <Text color="primary.500" fontSize="sm">
                See All
              </Text>
            </Pressable>
          </HStack>

          {isCallsLoading ? (
            <Center my={4}>
              <Spinner color="primary.500" />
              <Text color="gray.500" mt={2}>Loading calls...</Text>
            </Center>
          ) : recentCalls.length > 0 ? (
            <VStack space={2} divider={<Divider />} bg="white" p={2} rounded="xl" shadow={1}>
              {recentCalls.map((call) => (
                <CallItem
                  key={call.id}
                  call={call}
                  compact
                  onPress={() => 
                    navigation.navigate(
                      'LeadDetail' as never, 
                      { leadId: call.userLeadId, focusCall: call.id } as never
                    )
                  }
                />
              ))}
            </VStack>
          ) : (
            <Box bg="white" p={4} rounded="xl" shadow={1}>
              <Text color="gray.500" textAlign="center">
                No recent calls
              </Text>
            </Box>
          )}
        </Box>
      </ScrollView>

      {/* Fab button for adding leads or generating leads */}
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

export default HomeScreen;
