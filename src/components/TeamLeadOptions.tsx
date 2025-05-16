import React, { useState, useEffect } from 'react';
import { 
  Box, 
  FormControl, 
  Switch, 
  Select, 
  VStack, 
  HStack, 
  Text,
  Icon,
  Divider
} from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import { useOrganizations, OrganizationWithMembers } from '../hooks/useOrganizations';

interface TeamLeadOptionsProps {
  organizationId?: number | null;
  isShared?: boolean;
  onOrganizationChange: (id: number | null) => void;
  onIsSharedChange: (isShared: boolean) => void;
}

/**
 * Component for team lead sharing options in the lead form
 */
const TeamLeadOptions: React.FC<TeamLeadOptionsProps> = ({
  organizationId,
  isShared = false,
  onOrganizationChange,
  onIsSharedChange
}) => {
  const { organizations, fetchOrganizations, isLoading } = useOrganizations();
  const [saveToTeam, setSaveToTeam] = useState(!!organizationId);
  
  // Fetch organizations when component mounts
  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);
  
  // Update parent component when save to team toggled
  useEffect(() => {
    if (!saveToTeam) {
      onOrganizationChange(null);
      onIsSharedChange(false);
    }
  }, [saveToTeam, onOrganizationChange, onIsSharedChange]);
  
  // Handle save to team toggle
  const handleSaveToTeamToggle = (value: boolean) => {
    setSaveToTeam(value);
    if (!value) {
      // When toggling off, reset values
      onOrganizationChange(null);
      onIsSharedChange(false);
    } else if (organizations.length === 1) {
      // If only one organization, select it automatically
      onOrganizationChange(organizations[0].id);
    }
  };
  
  return (
    <Box mt={4}>
      <Divider mb={4} />
      
      <HStack space={2} alignItems="center" mb={2}>
        <Icon as={MaterialIcons} name="groups" size="sm" color="coolGray.500" />
        <Text fontSize="md" fontWeight="medium">Team Lead Options</Text>
      </HStack>
      
      <VStack space={4}>
        <FormControl>
          <HStack justifyContent="space-between" alignItems="center">
            <FormControl.Label>Save to Team</FormControl.Label>
            <Switch 
              value={saveToTeam} 
              onToggle={handleSaveToTeamToggle}
              isDisabled={organizations.length === 0}
            />
          </HStack>
          <FormControl.HelperText>
            {organizations.length === 0 
              ? "You're not part of any team yet" 
              : "Toggle on to share this lead with your team"}
          </FormControl.HelperText>
        </FormControl>
        
        {saveToTeam && (
          <VStack space={4}>
            <FormControl isRequired={saveToTeam}>
              <FormControl.Label>Select Organization</FormControl.Label>
              <Select
                selectedValue={organizationId?.toString() || ''}
                onValueChange={value => onOrganizationChange(parseInt(value))}
                placeholder="Select organization"
                isDisabled={isLoading || organizations.length === 0}
              >
                {organizations.map(org => (
                  <Select.Item key={org.id} label={org.name} value={org.id.toString()} />
                ))}
              </Select>
            </FormControl>
            
            <FormControl>
              <HStack justifyContent="space-between" alignItems="center">
                <FormControl.Label>Make visible to team members</FormControl.Label>
                <Switch 
                  value={isShared} 
                  onToggle={onIsSharedChange}
                  isDisabled={!organizationId}
                />
              </HStack>
              <FormControl.HelperText>
                Toggle on to share with all organization members
              </FormControl.HelperText>
            </FormControl>
          </VStack>
        )}
      </VStack>
    </Box>
  );
};

export default TeamLeadOptions;