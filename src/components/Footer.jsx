import React from 'react';
import { Box, HStack, VStack, Text, Heading, Divider, Link, Center, Icon, Pressable } from 'native-base';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const Footer = () => {
  const navigation = useNavigation();
  
  const navigateTo = (screen) => {
    navigation.navigate(screen);
  };
  
  return (
    <Box bg="dark.800" px={4} py={6} width="100%">
      <VStack space={4}>
        <HStack justifyContent="space-between" flexWrap="wrap">
          <VStack space={2} mb={4} minW="180px">
            <HStack alignItems="center" space={2}>
              <Icon as={FontAwesome5} name="wind" size="sm" color="primary.500" />
              <Heading size="sm" color="white">FLUTTERBYE CRM</Heading>
            </HStack>
            <Text color="gray.300" fontSize="xs">
              Empowering sales professionals with intelligent lead management and call tracking to optimize workflows and build stronger client relationships.
            </Text>
          </VStack>
          
          <VStack space={2} mb={4} minW="120px">
            <Heading size="sm" color="white">Quick Links</Heading>
            <Pressable onPress={() => navigateTo('Home')}>
              <Text color="gray.300" fontSize="xs">Dashboard</Text>
            </Pressable>
            <Pressable onPress={() => navigateTo('LeadsList')}>
              <Text color="gray.300" fontSize="xs">Leads</Text>
            </Pressable>
            <Pressable onPress={() => navigateTo('CallsList')}>
              <Text color="gray.300" fontSize="xs">Calls</Text>
            </Pressable>
            <Pressable onPress={() => navigateTo('Analytics')}>
              <Text color="gray.300" fontSize="xs">Analytics</Text>
            </Pressable>
          </VStack>
          
          <VStack space={2} mb={4} minW="120px">
            <Heading size="sm" color="white">Support</Heading>
            <Pressable>
              <Text color="gray.300" fontSize="xs">Help Center</Text>
            </Pressable>
            <Pressable>
              <Text color="gray.300" fontSize="xs">Documentation</Text>
            </Pressable>
            <Pressable>
              <Text color="gray.300" fontSize="xs">Contact Support</Text>
            </Pressable>
          </VStack>
        </HStack>
        
        <Divider bg="gray.700" />
        
        <Center>
          <Text color="gray.500" fontSize="xs">&copy; 2025 FLUTTERBYE CRM. All rights reserved.</Text>
        </Center>
      </VStack>
    </Box>
  );
};

export default Footer;
