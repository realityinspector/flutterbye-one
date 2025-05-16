import React from 'react';
import { 
  HStack, 
  VStack, 
  Text, 
  Switch, 
  Pressable, 
  Icon,
  Box,
} from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';

interface TeamLeadFilterToggleProps {
  value: 'all' | 'team' | 'personal';
  onChange: (value: 'all' | 'team' | 'personal') => void;
}

/**
 * Component for filtering leads by team/personal status
 */
const TeamLeadFilterToggle: React.FC<TeamLeadFilterToggleProps> = ({ value, onChange }) => {
  return (
    <HStack space={2} my={2} justifyContent="space-between" px={2}>
      <Text fontSize="sm" fontWeight="medium" color="gray.600">
        Filter by:
      </Text>
      <HStack space={1}>
        <Pressable 
          onPress={() => onChange('all')}
          opacity={value === 'all' ? 1 : 0.6}
        >
          <HStack 
            space={1} 
            alignItems="center" 
            bg={value === 'all' ? "blue.100" : "gray.100"} 
            px={2} 
            py={1} 
            rounded="md"
          >
            <Icon 
              as={MaterialIcons} 
              name="filter-list" 
              size={4} 
              color={value === 'all' ? "blue.500" : "gray.500"} 
            />
            <Text 
              fontSize="xs" 
              fontWeight="medium"
              color={value === 'all' ? "blue.500" : "gray.500"}
            >
              All
            </Text>
          </HStack>
        </Pressable>
        
        <Pressable 
          onPress={() => onChange('team')}
          opacity={value === 'team' ? 1 : 0.6}
        >
          <HStack 
            space={1} 
            alignItems="center" 
            bg={value === 'team' ? "blue.100" : "gray.100"} 
            px={2} 
            py={1} 
            rounded="md"
          >
            <Icon 
              as={MaterialIcons} 
              name="people" 
              size={4} 
              color={value === 'team' ? "blue.500" : "gray.500"} 
            />
            <Text 
              fontSize="xs" 
              fontWeight="medium"
              color={value === 'team' ? "blue.500" : "gray.500"}
            >
              Team
            </Text>
          </HStack>
        </Pressable>
        
        <Pressable 
          onPress={() => onChange('personal')}
          opacity={value === 'personal' ? 1 : 0.6}
        >
          <HStack 
            space={1} 
            alignItems="center" 
            bg={value === 'personal' ? "blue.100" : "gray.100"} 
            px={2} 
            py={1} 
            rounded="md"
          >
            <Icon 
              as={MaterialIcons} 
              name="person" 
              size={4} 
              color={value === 'personal' ? "blue.500" : "gray.500"} 
            />
            <Text 
              fontSize="xs" 
              fontWeight="medium"
              color={value === 'personal' ? "blue.500" : "gray.500"}
            >
              Personal
            </Text>
          </HStack>
        </Pressable>
      </HStack>
    </HStack>
  );
};

export default TeamLeadFilterToggle;