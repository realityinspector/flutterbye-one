import React from 'react';
import { Pressable } from 'react-native';
import { Box, Text } from 'native-base';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

interface NewCallFABProps {
  leadId?: number;
}

/**
 * Floating Action Button for creating a new call
 * Present on all main screens per flattened navigation requirements
 */
const NewCallFAB: React.FC<NewCallFABProps> = ({ leadId }) => {
  const navigation = useNavigation();

  const handlePress = () => {
    navigation.navigate('Call', leadId ? { leadId } : undefined);
  };

  return (
    <Pressable onPress={handlePress}>
      <Box
        position="absolute"
        bottom={6}
        right={6}
        bg="primary.500"
        rounded="full"
        width={16}
        height={16}
        shadow={4}
        justifyContent="center"
        alignItems="center"
        zIndex={100}
      >
        <Text color="white" fontSize="2xl">
          <Feather name="phone-outgoing" />
        </Text>
      </Box>
    </Pressable>
  );
};

export default NewCallFAB;
