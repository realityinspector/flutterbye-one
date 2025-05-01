import React from 'react';
import { NativeBaseProvider, Box, Text, Center, Heading, VStack, Icon, HStack } from 'native-base';
import { theme } from './src/utils/theme';
import Footer from './src/components/Footer';
import { Feather } from '@expo/vector-icons';

const App = () => {
  return (
    <NativeBaseProvider theme={theme}>
      <Box flex={1} bg="white">
        <VStack flex={1} space={5}>
          <Center flex={1} p={4}>
            <VStack space={5} alignItems="center">
              <HStack space={2} alignItems="center">
                <Icon as={Feather} name="wind" size="lg" color="primary.600" />
                <Heading size="xl" color="primary.600">FLUTTERBYE</Heading>
              </HStack>
              <Box bg="primary.100" p={5} rounded="lg" width="100%" maxWidth="400px">
                <VStack space={3}>
                  <Heading size="md" color="primary.600">Welcome to your CRM</Heading>
                  <Text>Your sales acceleration platform is ready to use.</Text>
                  <Text>Manage leads, track calls, and boost your sales performance!</Text>
                </VStack>
              </Box>
            </VStack>
          </Center>
          <Footer />
        </VStack>
      </Box>
    </NativeBaseProvider>
  );
};

export default App;
