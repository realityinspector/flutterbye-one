import React from 'react';
import { 
  Box, 
  HStack, 
  Text, 
  Icon, 
  Pressable, 
  Badge
} from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';

interface TeamLeadFilterToggleProps {
  showTeamLeads: boolean;
  showPersonalLeads: boolean;
  onToggleTeamLeads: () => void;
  onTogglePersonalLeads: () => void;
  teamLeadCount?: number;
  personalLeadCount?: number;
}

/**
 * Component for filtering between personal and team leads
 */
const TeamLeadFilterToggle: React.FC<TeamLeadFilterToggleProps> = ({
  showTeamLeads,
  showPersonalLeads,
  onToggleTeamLeads,
  onTogglePersonalLeads,
  teamLeadCount = 0,
  personalLeadCount = 0
}) => {
  return (
    <Box mb={4}>
      <HStack space={2}>
        <Pressable 
          flex={1} 
          onPress={onTogglePersonalLeads}
          bg={showPersonalLeads ? "primary.600" : "coolGray.100"}
          p={2} 
          rounded="md"
          _pressed={{ opacity: 0.8 }}
        >
          <HStack alignItems="center" justifyContent="center" space={2}>
            <Icon 
              as={MaterialIcons} 
              name="person" 
              color={showPersonalLeads ? "white" : "coolGray.600"} 
              size="sm"
            />
            <Text 
              fontWeight="medium" 
              color={showPersonalLeads ? "white" : "coolGray.600"}
            >
              Personal
            </Text>
            {personalLeadCount > 0 && (
              <Badge rounded="full" variant="solid" colorScheme={showPersonalLeads ? "info" : "coolGray"}>
                {personalLeadCount}
              </Badge>
            )}
          </HStack>
        </Pressable>
        
        <Pressable 
          flex={1} 
          onPress={onToggleTeamLeads}
          bg={showTeamLeads ? "primary.600" : "coolGray.100"}
          p={2} 
          rounded="md"
          _pressed={{ opacity: 0.8 }}
        >
          <HStack alignItems="center" justifyContent="center" space={2}>
            <Icon 
              as={MaterialIcons} 
              name="groups" 
              color={showTeamLeads ? "white" : "coolGray.600"} 
              size="sm"
            />
            <Text 
              fontWeight="medium" 
              color={showTeamLeads ? "white" : "coolGray.600"}
            >
              Team
            </Text>
            {teamLeadCount > 0 && (
              <Badge rounded="full" variant="solid" colorScheme={showTeamLeads ? "info" : "coolGray"}>
                {teamLeadCount}
              </Badge>
            )}
          </HStack>
        </Pressable>
      </HStack>
    </Box>
  );
};

export default TeamLeadFilterToggle;