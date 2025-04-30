import React from 'react';
import { Box, Center, Image, ScrollView } from 'native-base';
import AdminSetupForm from '../components/AdminSetupForm';
import { useNavigation } from '@react-navigation/native';

const AdminSetupScreen = () => {
  const navigation = useNavigation();

  const handleSetupComplete = () => {
    // Navigate to main app after setup
    navigation.navigate('Main');
  };

  return (
    <Box flex={1} bg="gray.100" safeArea>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <Center flex={1} px={4} py={10}>
          {/* App logo could go here */}
          <Box mb={8} alignItems="center">
            <Box w={24} h={24} bg="primary.100" rounded="full" mb={4} />
            {/* Replace with your app logo */}
          </Box>
          
          <AdminSetupForm onComplete={handleSetupComplete} />
        </Center>
      </ScrollView>
    </Box>
  );
};

export default AdminSetupScreen;