import React, { useState, useEffect } from 'react';
import {
  Box,
  FormControl,
  Switch,
  Select,
  HStack,
  Text,
  VStack,
  Icon,
  Heading,
  Divider,
  useToast,
} from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';

/**
 * TeamLeadOptions component for controlling team sharing settings
 * Allows users to select whether a lead is shared with a team
 * and which organization it belongs to
 */
const TeamLeadOptions = ({ value, onChange }) => {
  const toast = useToast();
  const [organizations, setOrganizations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formState, setFormState] = useState({
    isShared: value?.isShared || false,
    organizationId: value?.organizationId || null,
  });

  // Fetch organizations the user is a member of
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get('/api/organizations');
        setOrganizations(response.data);
      } catch (error) {
        console.error('Error fetching organizations:', error);
        toast.show({
          title: "Couldn't load organizations",
          description: "Please check your connection",
          status: "error",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrganizations();
  }, []);

  // Update local state and call parent onChange when values change
  const handleChange = (field, val) => {
    // If toggling sharing off, clear organization
    const newState = { ...formState };
    
    if (field === 'isShared') {
      newState.isShared = val;
      // If turning off sharing, reset organizationId
      if (!val) {
        newState.organizationId = null;
      }
    } else {
      newState[field] = val;
    }
    
    setFormState(newState);
    
    // Notify parent component
    if (onChange) {
      onChange(newState);
    }
  };

  return (
    <Box mt={4}>
      <VStack space={4}>
        <Heading size="sm" color="gray.700">Team Sharing Options</Heading>
        <Divider />
        
        {/* Team lead toggle */}
        <HStack alignItems="center" justifyContent="space-between">
          <HStack space={2} alignItems="center">
            <Icon as={MaterialIcons} name="people" size={5} color="primary.500" />
            <VStack>
              <Text fontWeight="medium">Share with Team</Text>
              <Text fontSize="xs" color="gray.500">
                Make this lead visible to members of your organization
              </Text>
            </VStack>
          </HStack>
          <Switch
            isChecked={formState.isShared}
            onToggle={(val) => handleChange('isShared', val)}
            colorScheme="primary"
          />
        </HStack>
        
        {/* Organization select (only visible if sharing is enabled) */}
        {formState.isShared && (
          <FormControl isDisabled={isLoading || organizations.length === 0}>
            <FormControl.Label>Select Organization</FormControl.Label>
            <Select
              selectedValue={formState.organizationId ? formState.organizationId.toString() : ''}
              onValueChange={(val) => handleChange('organizationId', val ? parseInt(val, 10) : null)}
              placeholder="Select an organization"
              isDisabled={isLoading || organizations.length === 0}
            >
              {organizations.map((org) => (
                <Select.Item key={org.id} label={org.name} value={org.id.toString()} />
              ))}
            </Select>
            {organizations.length === 0 && !isLoading && (
              <FormControl.HelperText>
                You don't belong to any organizations. Create or join one first.
              </FormControl.HelperText>
            )}
          </FormControl>
        )}
      </VStack>
    </Box>
  );
};

export default TeamLeadOptions;