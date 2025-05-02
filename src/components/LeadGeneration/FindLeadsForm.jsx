import React, { useState } from 'react';
import {
  VStack,
  FormControl,
  TextArea,
  Button,
  Text,
  Box,
  useToast
} from 'native-base';

/**
 * Find Leads Form - Natural language lead generation form
 * 
 * Allows users to describe the kinds of leads they want to find using natural language
 * and submits the query to the AI service for processing
 */
const FindLeadsForm = ({ onSubmit, isLoading }) => {
  const [criteria, setCriteria] = useState('');
  const toast = useToast();

  const handleSubmit = () => {
    if (!criteria.trim()) {
      toast.show({
        description: 'Please describe what kind of leads you are looking for',
        placement: 'top',
        duration: 3000,
        status: 'warning'
      });
      return;
    }

    if (criteria.length < 10) {
      toast.show({
        description: 'Please provide more details about the leads you want to find',
        placement: 'top',
        duration: 3000,
        status: 'warning'
      });
      return;
    }

    onSubmit(criteria);
  };

  return (
    <Box px={4} py={4} bg="white" borderRadius="md" shadow={1}>
      <VStack space={4}>
        <Text fontSize="lg" fontWeight="bold">
          Find New Leads with AI
        </Text>
        
        <Text fontSize="sm" color="gray.600">
          Describe the kinds of leads you're looking for in natural language.
          Be specific about industry, location, company size, or any other relevant details.
        </Text>
        
        <FormControl>
          <FormControl.Label>Describe your ideal leads</FormControl.Label>
          <TextArea
            h={20}
            placeholder="Example: Find tech startups in Boston that focus on artificial intelligence and have less than 50 employees"
            value={criteria}
            onChangeText={setCriteria}
            autoCompleteType={''}
          />
        </FormControl>

        <Button
          onPress={handleSubmit}
          isLoading={isLoading}
          isLoadingText="Searching..."
          colorScheme="blue"
        >
          Find Leads
        </Button>
      </VStack>
    </Box>
  );
};

export default FindLeadsForm;