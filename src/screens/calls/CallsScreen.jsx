import React, { useState, useEffect } from 'react';
import {
  Box, VStack, FlatList, Heading, Text, Divider, Spinner,
  Center, Button, Icon, HStack, Input, IconButton, Pressable
} from 'native-base';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useCalls } from '../../hooks/useCalls';
import CallItem from '../../components/CallItem';
import Footer from '../../components/Footer';
import MobileHeader from '../../components/MobileHeader';

const CallsScreen = () => {
  const navigation = useNavigation();
  const { calls, isLoading, isError, refetch } = useCalls();
  const [searchText, setSearchText] = useState('');
  const [filteredCalls, setFilteredCalls] = useState([]);

  useEffect(() => {
    if (calls) {
      if (searchText.trim() === '') {
        setFilteredCalls(calls);
      } else {
        const filtered = calls.filter(call => {
          const searchLower = searchText.toLowerCase();
          // Search by lead ID, outcome, or notes
          return (
            call.userLeadId.toString().includes(searchLower) ||
            call.outcome.toLowerCase().includes(searchLower) ||
            (call.notes && call.notes.toLowerCase().includes(searchLower))
          );
        });
        setFilteredCalls(filtered);
      }
    }
  }, [calls, searchText]);

  const handleCallPress = (call) => {
    navigation.navigate('CallHistory', { callId: call.id });
  };

  const renderEmpty = () => (
    <Center flex={1} p={10}>
      <Icon as={Feather} name="phone-off" size="4xl" color="gray.300" mb={4} />
      <Text fontSize="lg" color="gray.500" textAlign="center">
        No call records found
      </Text>
      <Button
        leftIcon={<Icon as={Feather} name="refresh-cw" size="sm" />}
        mt={4}
        onPress={refetch}
        variant="subtle"
      >
        Refresh
      </Button>
    </Center>
  );

  if (isLoading) {
    return (
      <Box flex={1} bg="gray.50">
        <MobileHeader title="Call History" />
        <VStack flex={1}>
          <Center flex={1}>
            <Spinner size="lg" color="primary.500" />
            <Text mt={4} color="gray.500">Loading calls...</Text>
          </Center>
          <Footer />
        </VStack>
      </Box>
    );
  }

  if (isError) {
    return (
      <Box flex={1} bg="gray.50">
        <MobileHeader title="Call History" />
        <VStack flex={1}>
          <Center flex={1}>
            <Icon as={Feather} name="alert-circle" size="4xl" color="red.500" mb={4} />
            <Text fontSize="lg" color="gray.700" textAlign="center">
              Error loading calls
            </Text>
            <Button
              leftIcon={<Icon as={Feather} name="refresh-cw" size="sm" />}
              mt={4}
              onPress={refetch}
              colorScheme="red"
              variant="subtle"
            >
              Try Again
            </Button>
          </Center>
          <Footer />
        </VStack>
      </Box>
    );
  }

  return (
    <Box flex={1} bg="gray.50">
      <MobileHeader title="Call History" />
      <VStack flex={1}>
        <Box flex={1} bg="white" safeArea>
          <VStack px={4} pt={5} pb={2}>
            <HStack alignItems="center" justifyContent="space-between" mb={4}>
              <Heading size="lg" display={{ base: 'none', md: 'flex' }}>Call History</Heading>
              <Text flex={1} display={{ base: 'flex', md: 'none' }} fontSize="md" fontWeight="bold">
                {filteredCalls.length > 0 ? `${filteredCalls.length} calls` : 'No calls'}
              </Text>
              <IconButton
                icon={<Icon as={Feather} name="phone-outgoing" size="md" color="primary.500" />}
                variant="ghost"
                onPress={() => navigation.navigate('LeadList')}
                _pressed={{ bg: 'primary.100' }}
              />
            </HStack>

            <Input
              placeholder="Search calls"
              width="100%"
              borderRadius="lg"
              py={2}
              px={3}
              mb={3}
              InputLeftElement={
                <Icon
                  as={Feather}
                  name="search"
                  size="sm"
                  color="gray.400"
                  ml={3}
                />
              }
              InputRightElement={
                searchText ? (
                  <Pressable onPress={() => setSearchText('')}>
                    <Icon
                      as={Feather}
                      name="x"
                      size="sm"
                      color="gray.400"
                      mr={3}
                    />
                  </Pressable>
                ) : null
              }
              value={searchText}
              onChangeText={setSearchText}
            />
            <Divider />
          </VStack>

          <FlatList
            data={filteredCalls}
            renderItem={({ item }) => (
              <Box px={4} py={2}>
                <CallItem call={item} onPress={handleCallPress} />
              </Box>
            )}
            keyExtractor={item => item.id.toString()}
            ListEmptyComponent={renderEmpty}
            contentContainerStyle={{ flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <Divider mt={1} mb={1} />}
            refreshing={isLoading}
            onRefresh={refetch}
          />
        </Box>
        <Footer />
      </VStack>
    </Box>
  );
};

export default CallsScreen;
