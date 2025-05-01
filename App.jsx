import React from 'react';
import { NativeBaseProvider, Box, Text, Center, Heading, VStack } from 'native-base';
import { theme } from './src/utils/theme';

const App = () => {
  return (
    <NativeBaseProvider theme={theme}>
      <Center flex={1} bg="white" p={4}>
        <VStack space={5} alignItems="center">
          <Heading size="xl" color="primary.600">Walk N Talk CRM</Heading>
          <Box bg="primary.100" p={5} rounded="lg" width="100%" maxWidth="400px">
            <VStack space={3}>
              <Heading size="md" color="primary.600">Welcome to your CRM</Heading>
              <Text>Your sales acceleration platform is ready to use.</Text>
              <Text>Manage leads, track calls, and boost your sales performance!</Text>
            </VStack>
          </Box>
        </VStack>
      </Center>
    </NativeBaseProvider>
  );
};

export default App;
