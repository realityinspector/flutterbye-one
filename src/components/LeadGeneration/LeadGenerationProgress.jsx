import React from 'react';
import {
  HStack,
  VStack,
  Text,
  Spinner,
  Box,
  Progress,
  Icon
} from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';

/**
 * Lead Generation Progress Component
 * 
 * Displays a progress indicator and status messages during the lead generation process.
 * Shows different status messages based on the current stage of processing.
 */
const LeadGenerationProgress = ({ status, progress = 0 }) => {
  const getStatusMessage = () => {
    switch (status) {
      case 'searching':
        return 'Searching the web for leads matching your criteria...';
      case 'analyzing':
        return 'Analyzing search results and extracting lead information...';
      case 'finalizing':
        return 'Finalizing results and preparing leads for review...';
      case 'error':
        return 'An error occurred while searching for leads. Please try again.';
      default:
        return 'Processing your request...';
    }
  };

  const getIcon = () => {
    switch (status) {
      case 'searching':
        return 'search';
      case 'analyzing':
        return 'analytics';
      case 'finalizing':
        return 'check_circle';
      case 'error':
        return 'error';
      default:
        return 'hourglass_empty';
    }
  };

  // Calculate progress percentage
  const progressValue = status === 'searching' ? 30 : 
                         status === 'analyzing' ? 60 :
                         status === 'finalizing' ? 90 : progress;

  // Error state doesn't show progress
  const showProgress = status !== 'error';

  return (
    <Box bg="white" p={4} rounded="md" shadow={1} mb={4}>
      <VStack space={3}>
        <HStack space={2} alignItems="center">
          {status === 'error' ? (
            <Icon 
              as={MaterialIcons} 
              name={getIcon()} 
              color="red.500" 
              size="md" 
            />
          ) : (
            <Spinner size="sm" color="blue.500" />
          )}
          <Text 
            fontWeight="medium" 
            fontSize="md" 
            color={status === 'error' ? 'red.500' : 'blue.500'}
          >
            {status === 'error' ? 'Error' : 'Generating Leads'}
          </Text>
        </HStack>
        
        <Text fontSize="sm" color="gray.600">
          {getStatusMessage()}
        </Text>
        
        {showProgress && (
          <Progress 
            value={progressValue} 
            colorScheme="blue" 
            size="xs"
          />
        )}
        
        {status !== 'error' && (
          <Text fontSize="xs" color="gray.500" textAlign="center">
            This may take up to a minute
          </Text>
        )}
      </VStack>
    </Box>
  );
};

export default LeadGenerationProgress;