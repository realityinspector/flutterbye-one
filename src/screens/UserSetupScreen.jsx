import React from 'react';
import { Box, Center, Image, ScrollView, Icon, Heading } from 'native-base';
import { FontAwesome5 } from '@expo/vector-icons';
import UserSetupForm from '../components/UserSetupForm';
import { useNavigation } from '@react-navigation/native';
import Footer from '../components/Footer';

const UserSetupScreen = () => {
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
            <Icon as={FontAwesome5} name="wind" size={16} color="primary.500" mb={4} />
            <Heading size="xl" color="primary.600" mb={2}>FLUTTERBYE</Heading>
            {/* App logo */}
          </Box>
          
          <UserSetupForm onComplete={handleSetupComplete} />
        </Center>
      </ScrollView>
      <Box position="absolute" bottom={0} left={0} right={0} bg="white">
        <Footer />
      </Box>
    </Box>
  );
};

export default UserSetupScreen;