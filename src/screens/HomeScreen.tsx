import React, { useEffect, useState } from 'react';
import {
  Box,
  ScrollView,
  Heading,
  Text,
  HStack,
  VStack,
  Icon,
  Pressable,
  Divider,
  Stack,
  Button,
  Center,
  Spinner,
  useTheme,
  useToast,
  Badge,
} from 'native-base';
import { Feather } from '@expo/vector-icons';
import NewCallFAB from '../components/NewCallFAB';
import { useNavigation } from '@react-navigation/native';
// Import from TypeScript hooks
import { useLeads } from '../hooks/useLeads';
import { useCalls } from '../hooks/useCalls';
import { useAuth } from '../hooks/useAuth';
// Import types directly from Zod schemas
import { Call, UserLead } from '../../shared/db/zod-schema';
import LeadCard from '../components/LeadCard';
import CallItem from '../components/CallItem';
import Footer from '../components/Footer';

// Define type for stats
interface DashboardStats {
  totalLeads: number;
  newLeads: number;
  qualifiedLeads: number;
  callsToday: number;
  remindersDue: number;
}

const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const theme = useTheme();
  const toast = useToast();
  const { user } = useAuth();
  const { leads, isLoading: leadsLoading } = useLeads();
  const { calls, isLoading: callsLoading } = useCalls();
  
  const [stats, setStats] = useState<DashboardStats>({
    totalLeads: 0,
    newLeads: 0,
    qualifiedLeads: 0,
    callsToday: 0,
    remindersDue: 0,
  });

  // Calculate stats when data is loaded
  useEffect(() => {
    if (leads && calls) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const newLeads = leads.filter(lead => lead.status === 'new');
      const qualifiedLeads = leads.filter(lead => lead.status === 'qualified');
      const callsToday = calls.filter(call => {
        const callDate = new Date(call.callDate);
        callDate.setHours(0, 0, 0, 0);
        return callDate.getTime() === today.getTime();
      });
      
      const remindersDue = leads.filter(lead => {
        if (!lead.reminderDate) return false;
        const reminderDate = new Date(lead.reminderDate);
        return reminderDate <= new Date();
      });
      
      setStats({
        totalLeads: leads.length,
        newLeads: newLeads.length,
        qualifiedLeads: qualifiedLeads.length,
        callsToday: callsToday.length,
        remindersDue: remindersDue.length,
      });
    }
  }, [leads, calls]);

  // Format date for display
  const formatDate = (date = new Date()) => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' };
    return date.toLocaleDateString(undefined, options);
  };

  // Get high priority leads
  const highPriorityLeads = React.useMemo(() => {
    if (!leads) return [];
    return [...leads]
      .filter(lead => lead.priority >= 8)
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 3);
  }, [leads]);

  // Get recent calls
  const recentCalls = React.useMemo(() => {
    if (!calls) return [];
    return [...calls]
      .sort((a, b) => new Date(b.callDate).getTime() - new Date(a.callDate).getTime())
      .slice(0, 3);
  }, [calls]);

  // If data is still loading, show loading state
  if (leadsLoading || callsLoading) {
    return (
      <Box flex={1} bg="gray.50">
        <VStack flex={1}>
          <Center flex={1}>
            <Spinner size="lg" color="primary.500" />
            <Text mt={4} color="gray.500">Loading your dashboard...</Text>
          </Center>
          <Footer />
        </VStack>
      </Box>
    );
  }

  return (
    <Box flex={1} bg="gray.50">
      <VStack flex={1}>
        <Box flex={1} safeArea>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header section */}
            <Box px={4} pt={4} pb={6}>
              <Heading size="md" color="gray.600">Welcome back,</Heading>
              <Heading size="xl">{user?.fullName?.split(' ')[0] || 'User'}</Heading>
              <Text fontSize="md" color="gray.500" mt={1}>
                {formatDate()}
              </Text>
            </Box>

            {/* Stats section */}
            <Box px={4} mb={6}>
              <Heading size="md" mb={3}>Your Activity</Heading>
              <HStack space={4}>
                <Pressable 
                  onPress={() => navigation.navigate('Leads')}
                  flex={1} 
                  bg="white" 
                  p={4} 
                  rounded="lg"
                  shadow={1}
                >
                  <HStack alignItems="flex-start">
                    <Center size={10} bg="primary.100" rounded="lg">
                      <Text color="primary.500" fontSize="xl">
                        <Feather name="users" />
                      </Text>
                    </Center>
                    <VStack ml={2}>
                      <Text color="gray.500" fontSize="sm">Total Leads</Text>
                      <Heading size="lg">{stats.totalLeads}</Heading>
                    </VStack>
                  </HStack>
                </Pressable>

                <Pressable 
                  onPress={() => navigation.navigate('CallLog')}
                  flex={1} 
                  bg="white" 
                  p={4} 
                  rounded="lg"
                  shadow={1}
                >
                  <HStack alignItems="flex-start">
                    <Center size={10} bg="green.100" rounded="lg">
                      <Text color="green.500" fontSize="xl">
                        <Feather name="phone-outgoing" />
                      </Text>
                    </Center>
                    <VStack ml={2}>
                      <Text color="gray.500" fontSize="sm">Calls Today</Text>
                      <Heading size="lg">{stats.callsToday}</Heading>
                    </VStack>
                  </HStack>
                </Pressable>
              </HStack>

              <HStack space={4} mt={4}>
                <Pressable 
                  onPress={() => navigation.navigate('Leads', { filter: 'new' })}
                  flex={1} 
                  bg="white" 
                  p={4} 
                  rounded="lg"
                  shadow={1}
                >
                  <HStack alignItems="flex-start">
                    <Center size={10} bg="blue.100" rounded="lg">
                      <Text color="blue.500" fontSize="xl">
                        <Feather name="user-plus" />
                      </Text>
                    </Center>
                    <VStack ml={2}>
                      <Text color="gray.500" fontSize="sm">New Leads</Text>
                      <Heading size="lg">{stats.newLeads}</Heading>
                    </VStack>
                  </HStack>
                </Pressable>

                <Pressable 
                  onPress={() => navigation.navigate('Reminders')}
                  flex={1} 
                  bg="white" 
                  p={4} 
                  rounded="lg"
                  shadow={1}
                >
                  <HStack alignItems="flex-start">
                    <Center size={10} bg="amber.100" rounded="lg">
                      <Text color="amber.500" fontSize="xl">
                        <Feather name="clock" />
                      </Text>
                    </Center>
                    <VStack ml={2}>
                      <Text color="gray.500" fontSize="sm">Due Reminders</Text>
                      <Heading size="lg">{stats.remindersDue}</Heading>
                    </VStack>
                  </HStack>
                </Pressable>
              </HStack>
            </Box>

            {/* High priority leads section */}
            <Box bg="white" py={4} px={4} mb={6}>
              <HStack justifyContent="space-between" alignItems="center" mb={3}>
                <Heading size="md">High Priority Leads</Heading>
                <Pressable onPress={() => navigation.navigate('Leads')}>
                  <Text color="primary.500" fontWeight="medium">View All</Text>
                </Pressable>
              </HStack>

              {highPriorityLeads.length === 0 ? (
                <Center py={6}>
                  <Text fontSize="4xl" color="gray.300"><Feather name="thumbs-up" /></Text>
                  <Text mt={2} color="gray.500">No high priority leads</Text>
                </Center>
              ) : (
                <VStack space={3}>
                  {highPriorityLeads.map(lead => (
                    <Pressable 
                      key={lead.id} 
                      onPress={() => navigation.navigate('LeadDetail', { leadId: lead.id })}
                    >
                      <LeadCard lead={lead} showStatus={true} />
                    </Pressable>
                  ))}
                </VStack>
              )}
            </Box>

            {/* Recent calls section */}
            <Box bg="white" py={4} px={4} mb={6}>
              <HStack justifyContent="space-between" alignItems="center" mb={3}>
                <Heading size="md">Recent Calls</Heading>
                <Pressable onPress={() => navigation.navigate('CallLog')}>
                  <Text color="primary.500" fontWeight="medium">View All</Text>
                </Pressable>
              </HStack>

              {recentCalls.length === 0 ? (
                <Center py={6}>
                  <Text fontSize="4xl" color="gray.300"><Feather name="phone-missed" /></Text>
                  <Text mt={2} color="gray.500">No recent calls</Text>
                </Center>
              ) : (
                <VStack space={3} divider={<Divider bg="gray.100" />}>
                  {recentCalls.map(call => (
                    <CallItem 
                      key={call.id} 
                      call={call} 
                      leadName={true}
                    />
                  ))}
                </VStack>
              )}
            </Box>

            {/* Quick actions section */}
            <Box bg="white" py={4} px={4} mb={6}>
              <Heading size="md" mb={3}>Quick Actions</Heading>
              <HStack space={3} justifyContent="space-between">
                <Pressable 
                  flex={1}
                  onPress={() => navigation.navigate('AddLead')}
                  bg="primary.50"
                  py={4}
                  rounded="md"
                  alignItems="center"
                >
                  <Text fontSize="2xl" color="primary.500" mb={2}><Feather name="user-plus" /></Text>
                  <Text fontWeight="medium">Add Lead</Text>
                </Pressable>

                <Pressable 
                  flex={1}
                  onPress={() => navigation.navigate('Call', { mode: 'queue' })}
                  bg="green.50"
                  py={4}
                  rounded="md"
                  alignItems="center"
                >
                  <Text fontSize="2xl" color="green.500" mb={2}><Feather name="phone-outgoing" /></Text>
                  <Text fontWeight="medium">Call Queue</Text>
                </Pressable>

                <Pressable 
                  flex={1}
                  onPress={() => toast.show({
                    title: "Coming Soon",
                    description: "Lead generation will be available in a future update."
                  })}
                  bg="gray.100"
                  py={4}
                  rounded="md"
                  alignItems="center"
                >
                  <Text fontSize="2xl" color="gray.500" mb={2}><Feather name="search" /></Text>
                  <Text fontWeight="medium" color="gray.500">Find Leads</Text>
                  <Box mt={1} bg="info.100" px={2} py={0.5} rounded="full">
                    <Text fontSize="2xs" color="info.800">SOON</Text>
                  </Box>
                </Pressable>
              </HStack>
            </Box>

            <Box h={20} /> {/* Extra bottom spacing for FAB */}
          </ScrollView>
          <NewCallFAB />
        </Box>
        <Footer />
      </VStack>
    </Box>
  );
};

export default HomeScreen;
