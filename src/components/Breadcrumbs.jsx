import React from 'react';
import { HStack, Text, Pressable, Icon } from 'native-base';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const Breadcrumbs = ({ items }) => {
  const navigation = useNavigation();
  
  const handlePress = (screen, params) => {
    if (screen) {
      navigation.navigate(screen, params);
    }
  };
  
  return (
    <HStack 
      space={1} 
      alignItems="center" 
      flexWrap="wrap"
      px={4}
      py={2}
      bg="coolGray.100"
      width="100%"
    >
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <Icon
              as={FontAwesome5}
              name="chevron-right"
              size="xs"
              color="gray.400"
              mx={1}
            />
          )}
          <Pressable 
            onPress={() => handlePress(item.screen, item.params)}
            disabled={!item.screen || index === items.length - 1}
          >
            <Text 
              fontSize="sm"
              color={index === items.length - 1 ? "gray.500" : "primary.600"}
              fontWeight={index === items.length - 1 ? "medium" : "normal"}
              textDecorationLine={!item.screen || index === items.length - 1 ? "none" : "underline"}
            >
              {item.label}
            </Text>
          </Pressable>
        </React.Fragment>
      ))}
    </HStack>
  );
};

export default Breadcrumbs;
