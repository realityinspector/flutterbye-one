import React from 'react';
import { Box, HStack, Text, Icon, Heading, IconButton } from 'native-base';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const MobileHeader = ({ title, showBackButton = false, onBack }) => {
  const navigation = useNavigation();
  
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigation.goBack();
    }
  };
  
  return (
    <Box 
      bg="primary.600" 
      px={4} 
      py={3} 
      width="100%" 
      display={{ base: 'flex', md: 'none' }} // Show on mobile, hide on larger screens
    >
      <HStack alignItems="center" justifyContent="space-between">
        <HStack space={2} alignItems="center">
          {showBackButton && (
            <IconButton
              icon={<Icon as={FontAwesome5} name="arrow-left" size="sm" color="white" />}
              onPress={handleBack}
              variant="ghost"
              _pressed={{ bg: 'primary.700' }}
              _icon={{ color: 'white' }}
            />
          )}
          
          <HStack alignItems="center" space={2}>
            <Icon as={FontAwesome5} name="wind" size="sm" color="white" />
            <Heading color="white" size="sm">FLUTTERBYE</Heading>
          </HStack>
        </HStack>
        
        {title && title !== 'FLUTTERBYE' && (
          <Text color="white" fontWeight="medium">{title}</Text>
        )}
      </HStack>
    </Box>
  );
};

export default MobileHeader;
