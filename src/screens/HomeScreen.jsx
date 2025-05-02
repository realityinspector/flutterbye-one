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
} from 'native-base';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useLeads } from '../hooks/useLeads';
import { useCalls } from '../hooks/useCalls';
import { useAuth } from '../hooks/useAuth';
import LeadCard from '../components/LeadCard';
import CallItem from '../components/CallItem';
import MobileHeader from '../components/MobileHeader';
import Footer from '../components/Footer';

const HomeScreen = () => {
  const navigation = useNavigation();
  const theme = useTheme();
  const toast = useToast();
  const { user } = useAuth();
  const { leads, isLoading: leadsLoading } = useLeads();
  const { calls, isLoading: callsLoading } = useCalls();
  
  const [stats, setStats] = useState({
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
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
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
      .sort((a, b) => new Date(b.callDate) - new Date(a.callDate))
      .slice(0, 3);
  }, [calls]);

  // If data is still loading, show loading state
  if (leadsLoading || callsLoading) {
    return (
      <Center flex={1}>
        <Spinner size="lg" color="primary.500" />
        <Text mt={4} color="gray.500">Loading your dashboard...</Text>
      </Center>
    );
  }

  return (
    <Box flex={1} bg="gray.50" safeArea>
      <MobileHeader title="Dashboard" />
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
                  <Icon as={Feather} name="users" size={5} color="primary.500" />
                </Center>
                <VStack ml={2}>
                  <Text color="gray.500" fontSize="sm">Total Leads</Text>
                  <Heading size="lg">{stats.totalLeads}</Heading>
                </VStack>
              </HStack>
            </Pressable>

            <Pressable 
              onPress={() => navigation.navigate('CallHistory')}
              flex={1} 
              bg="white" 
              p={4} 
              rounded="lg"
              shadow={1}
            >
              <HStack alignItems="flex-start">
                <Center size={10} bg="green.100" rounded="lg">
                  <Icon as={Feather} name="phone-outgoing" size={5} color="green.500" />
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
                  <Icon as={Feather} name="user-plus" size={5} color="blue.500" />
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
                  <Icon as={Feather} name="clock" size={5} color="amber.500" />
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
              <Icon as={Feather} name="thumbs-up" size={12} color="gray.300" />
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
            <Pressable onPress={() => navigation.navigate('CallHistory')}>
              <Text color="primary.500" fontWeight="medium">View All</Text>
            </Pressable>
          </HStack>

          {recentCalls.length === 0 ? (
            <Center py={6}>
              <Icon as={Feather} name="phone-missed" size={12} color="gray.300" />
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
              onPress={() => navigation.navigate('LeadForm')}
              bg="primary.50"
              py={4}
              rounded="md"
              alignItems="center"
            >
              <Icon as={Feather} name="user-plus" size={6} color="primary.500" mb={2} />
              <Text fontWeight="medium">Add Lead</Text>
            </Pressable>

            <Pressable 
              flex={1}
              onPress={() => navigation.navigate('CallQueue')}
              bg="green.50"
              py={4}
              rounded="md"
              alignItems="center"
            >
              <Icon as={Feather} name="phone-outgoing" size={6} color="green.500" mb={2} />
              <Text fontWeight="medium">Call Queue</Text>
            </Pressable>

            <Pressable 
              flex={1}
              onPress={() => navigation.navigate('GenerateLeads')}
              bg="blue.50"
              py={4}
              rounded="md"
              alignItems="center"
            >
              <Icon as={Feather} name="search" size={6} color="blue.500" mb={2} />
              <Text fontWeight="medium">Find Leads</Text>
            </Pressable>
          </HStack>
        </Box>

        <Box h={4} /> {/* Bottom spacing */}
      </ScrollView>
      <Footer />
    </Box>
  );
};

export default HomeScreen;
