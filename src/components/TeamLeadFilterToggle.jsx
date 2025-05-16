import React from 'react';
import {
  HStack,
  Text,
  Pressable,
  Icon,
  Badge,
} from 'native-base';
import { Feather } from '@expo/vector-icons';

/**
 * TeamLeadFilterToggle component for filtering between team and personal leads
 * 
 * @param {Object} props Component props
 * @param {string} props.value Current filter value ('all', 'team', 'personal')
 * @param {Function} props.onChange Callback when filter changes
 */
const TeamLeadFilterToggle = ({ value, onChange }) => {
  return (
    <HStack space={2} mt={1} mb={2}>
      <Text fontSize="sm" color="gray.500">Show:</Text>
      
      <Pressable 
        onPress={() => onChange('all')}
        flexDirection="row"
        alignItems="center"
      >
        <Badge 
          colorScheme={value === 'all' ? 'primary' : 'gray'} 
          rounded="full"
          variant={value === 'all' ? 'solid' : 'outline'}
          px={3}
        >
          <HStack space={1} alignItems="center">
            <Icon 
              as={Feather} 
              name="list" 
              size="2xs" 
              color={value === 'all' ? 'white' : 'gray.500'} 
            />
            <Text 
              fontSize="xs" 
              color={value === 'all' ? 'white' : 'gray.500'}
            >
              All Leads
            </Text>
          </HStack>
        </Badge>
      </Pressable>
      
      <Pressable 
        onPress={() => onChange('team')}
        flexDirection="row"
        alignItems="center"
      >
        <Badge 
          colorScheme={value === 'team' ? 'blue' : 'gray'} 
          rounded="full"
          variant={value === 'team' ? 'solid' : 'outline'}
          px={3}
        >
          <HStack space={1} alignItems="center">
            <Icon 
              as={Feather} 
              name="users" 
              size="2xs" 
              color={value === 'team' ? 'white' : 'gray.500'} 
            />
            <Text 
              fontSize="xs" 
              color={value === 'team' ? 'white' : 'gray.500'}
            >
              Team Shared
            </Text>
          </HStack>
        </Badge>
      </Pressable>
      
      <Pressable 
        onPress={() => onChange('personal')}
        flexDirection="row"
        alignItems="center"
      >
        <Badge 
          colorScheme={value === 'personal' ? 'purple' : 'gray'} 
          rounded="full"
          variant={value === 'personal' ? 'solid' : 'outline'}
          px={3}
        >
          <HStack space={1} alignItems="center">
            <Icon 
              as={Feather} 
              name="user" 
              size="2xs" 
              color={value === 'personal' ? 'white' : 'gray.500'} 
            />
            <Text 
              fontSize="xs" 
              color={value === 'personal' ? 'white' : 'gray.500'}
            >
              Personal
            </Text>
          </HStack>
        </Badge>
      </Pressable>
    </HStack>
  );
};

export default TeamLeadFilterToggle;