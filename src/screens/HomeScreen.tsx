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
  Fab,
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

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const theme = useTheme();
  const toast = useToast();
  const { user } = useAuth();
  const { leads, isLoading: leadsLoading } = useLeads();
  const { calls, isLoading: callsLoading } = useCalls();

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

  // Get all leads sorted by most recent update
  const recentLeads = React.useMemo(() => {
    if (!leads) return [];
    return [...leads]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 8);
  }, [leads]);

  // Create a reference for navigation paths
  type NavScreens = 'Leads' | 'CallLog' | 'FindNewLeads' | 'LeadDetail' | 'AddLead' | 'Call';

  // Type-safe navigation function
  const navigateTo = (screen: NavScreens, params?: any) => {
    navigation.navigate(screen, params);
  };

  return (
    <Box flex={1} bg="gray.50">
      <VStack flex={1}>
        <Box flex={1} safeArea>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header section */}
            <Box px={4} pt={4} pb={3}>
              <Heading size="md" color="gray.600">Welcome back,</Heading>
              <Heading size="xl">{user?.fullName?.split(' ')[0] || 'User'}</Heading>
              <Text fontSize="md" color="gray.500" mt={1}>
                {formatDate()}
              </Text>
            </Box>

            {/* AI Lead Generation - Prominent Button */}
            <Box px={4} mb={6}>
              <Pressable 
                onPress={() => navigateTo('FindNewLeads')}
                bg="primary.500"
                py={4}
                px={5}
                rounded="lg"
                shadow={2}
                mb={2}
              >
                <HStack alignItems="center" justifyContent="space-between">
                  <HStack alignItems="center">
                    <Center size={12} bg="primary.400" rounded="full">
                      <Text color="white" fontSize="2xl">
                        <Feather name="search" />
                      </Text>
                    </Center>
                    <VStack ml={3}>
                      <Heading size="md" color="white">Find New Leads</Heading>
                      <Text color="primary.100" fontSize="xs">AI-powered lead generation</Text>
                    </VStack>
                  </HStack>
                  <Text color="white" fontSize="xl">
                    <Feather name="chevron-right" />
                  </Text>
                </HStack>
              </Pressable>
            </Box>

            {/* Recent Leads section */}
            <Box bg="white" py={4} px={4} mb={6}>
              <HStack justifyContent="space-between" alignItems="center" mb={3}>
                <Heading size="md">Recent Leads</Heading>
                <Pressable onPress={() => navigateTo('Leads')}>
                  <Text color="primary.500" fontWeight="medium">View All</Text>
                </Pressable>
              </HStack>

              {recentLeads.length === 0 ? (
                <Center py={6}>
                  <Text fontSize="4xl" color="gray.300"><Feather name="users" /></Text>
                  <Text mt={2} color="gray.500">No leads yet</Text>
                  <Button mt={4} onPress={() => navigateTo('AddLead')} variant="solid" colorScheme="primary">
                    Add Your First Lead
                  </Button>
                </Center>
              ) : (
                <VStack space={3}>
                  {recentLeads.map(lead => (
                    <Pressable 
                      key={lead.id} 
                      onPress={() => navigateTo('LeadDetail', { leadId: lead.id })}
                    >
                      <LeadCard lead={lead} showStatus={true} />
                    </Pressable>
                  ))}
                </VStack>
              )}
            </Box>

            {/* Recent calls section - Smaller version */}
            <Box bg="white" py={4} px={4} mb={6}>
              <HStack justifyContent="space-between" alignItems="center" mb={3}>
                <Heading size="md">Recent Calls</Heading>
                <Pressable onPress={() => navigateTo('CallLog')}>
                  <Text color="primary.500" fontWeight="medium">View All</Text>
                </Pressable>
              </HStack>

              {recentCalls.length === 0 ? (
                <Center py={6}>
                  <Text fontSize="4xl" color="gray.300"><Feather name="phone-missed" /></Text>
                  <Text mt={2} color="gray.500">No call history yet</Text>
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

            {/* Quick actions section - Simplified */}
            <Box bg="white" py={4} px={4} mb={6}>
              <Heading size="md" mb={3}>Quick Actions</Heading>
              <HStack space={3} justifyContent="space-between">
                <Pressable 
                  flex={1}
                  onPress={() => navigateTo('AddLead')}
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
                  onPress={() => navigateTo('Call', { mode: 'queue' })}
                  bg="green.50"
                  py={4}
                  rounded="md"
                  alignItems="center"
                >
                  <Text fontSize="2xl" color="green.500" mb={2}><Feather name="phone-outgoing" /></Text>
                  <Text fontWeight="medium">Call Queue</Text>
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
