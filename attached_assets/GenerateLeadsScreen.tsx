import React, { useState } from 'react';
import {
  Box,
  VStack,
  Heading,
  Text,
  FormControl,
  Input,
  TextArea,
  Button,
  Icon,
  ScrollView,
  HStack,
  Center,
  Spinner,
  useToast,
  IconButton,
  NumberInput,
} from 'native-base';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useLeads, LeadGenerationCriteria } from '../hooks/useLeads';

const GenerateLeadsScreen = () => {
  const navigation = useNavigation();
  const toast = useToast();
  const { generateLeads, isGeneratingLeads } = useLeads();
  
  const [criteria, setCriteria] = useState<LeadGenerationCriteria>({
    industry: '',
    location: '',
    companySize: '',
    other: '',
  });
  
  const [leadCount, setLeadCount] = useState(5);
  
  const handleGenerate = async () => {
    if (!criteria.industry && !criteria.location && !criteria.companySize && !criteria.other) {
      toast.show({
        title: "Missing criteria",
        description: "Please enter at least one search criteria",
        status: "warning",
      });
      return;
    }
    
    try {
      await generateLeads(criteria, leadCount);
      
      toast.show({
        title: "Leads generated",
        description: `${leadCount} new leads were added to your list`,
        status: "success",
      });
      
      navigation.goBack();
    } catch (error) {
      console.error("Error generating leads:", error);
      
      toast.show({
        title: "Generation failed",
        description: "Could not generate leads. Please try again.",
        status: "error",
      });
    }
  };
  
  return (
    <Box flex={1} bg="white" safeArea>
      {/* Header */}
      <HStack px={4} pt={4} pb={2} alignItems="center">
        <IconButton
          icon={<Icon as={Feather} name="arrow-left" size="sm" />}
          variant="ghost"
          rounded="full"
          onPress={() => navigation.goBack()}
        />
        
        <Heading size="lg" ml={2}>Generate Leads</Heading>
      </HStack>
      
      <ScrollView flex={1} px={4} py={2}>
        <VStack space={5}>
          <Box bg="primary.50" p={4} rounded="md">
            <HStack space={3} alignItems="center">
              <Icon as={Feather} name="cpu" size="md" color="primary.600" />
              <VStack>
                <Text fontWeight="medium" color="primary.700">
                  AI-Powered Lead Generation
                </Text>
                <Text fontSize="sm" color="primary.600">
                  Our AI will create realistic leads based on your criteria
                </Text>
              </VStack>
            </HStack>
          </Box>
          
          <FormControl>
            <FormControl.Label>Industry</FormControl.Label>
            <Input
              placeholder="e.g., Technology, Healthcare, Retail"
              value={criteria.industry}
              onChangeText={value => setCriteria({ ...criteria, industry: value })}
              leftElement={
                <Icon as={Feather} name="briefcase" size={5} ml={2} color="gray.400" />
              }
            />
            <FormControl.HelperText>
              Specify the industry for lead generation
            </FormControl.HelperText>
          </FormControl>
          
          <FormControl>
            <FormControl.Label>Location</FormControl.Label>
            <Input
              placeholder="e.g., New York, NY or Los Angeles Area"
              value={criteria.location}
              onChangeText={value => setCriteria({ ...criteria, location: value })}
              leftElement={
                <Icon as={Feather} name="map-pin" size={5} ml={2} color="gray.400" />
              }
            />
            <FormControl.HelperText>
              City, state, or region to target
            </FormControl.HelperText>
          </FormControl>
          
          <FormControl>
            <FormControl.Label>Company Size</FormControl.Label>
            <Input
              placeholder="e.g., Small Business, 10-50 employees"
              value={criteria.companySize}
              onChangeText={value => setCriteria({ ...criteria, companySize: value })}
              leftElement={
                <Icon as={Feather} name="users" size={5} ml={2} color="gray.400" />
              }
            />
          </FormControl>
          
          <FormControl>
            <FormControl.Label>Additional Criteria</FormControl.Label>
            <TextArea
              placeholder="Enter any additional details about the leads you want to generate..."
              value={criteria.other}
              onChangeText={value => setCriteria({ ...criteria, other: value })}
              autoCompleteType={undefined}
              h={20}
            />
          </FormControl>
          
          <FormControl>
            <FormControl.Label>Number of Leads</FormControl.Label>
            <HStack space={3} alignItems="center">
              <Button
                onPress={() => setLeadCount(Math.max(1, leadCount - 1))}
                variant="outline"
                p={2}
                minW={10}
              >
                <Icon as={Feather} name="minus" size="sm" />
              </Button>
              
              <Input
                value={leadCount.toString()}
                onChangeText={value => {
                  const num = parseInt(value);
                  if (!isNaN(num) && num > 0 && num <= 20) {
                    setLeadCount(num);
                  }
                }}
                keyboardType="number-pad"
                textAlign="center"
                w={20}
              />
              
              <Button
                onPress={() => setLeadCount(Math.min(20, leadCount + 1))}
                variant="outline"
                p={2}
                minW={10}
              >
                <Icon as={Feather} name="plus" size="sm" />
              </Button>
            </HStack>
            <FormControl.HelperText>
              Generate between 1-20 leads at a time
            </FormControl.HelperText>
          </FormControl>
          
          <Button
            mt={4}
            size="lg"
            leftIcon={<Icon as={Feather} name="cpu" size="sm" />}
            isLoading={isGeneratingLeads}
            onPress={handleGenerate}
            colorScheme="primary"
          >
            Generate Leads
          </Button>
          
          <Text fontSize="xs" color="gray.500" textAlign="center" mt={2} mb={8}>
            Note: Generated leads are fictional and intended for demonstration purposes.
            Always verify information before contacting.
          </Text>
        </VStack>
      </ScrollView>
    </Box>
  );
};

export default GenerateLeadsScreen;
