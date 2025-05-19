import React, { useState, useEffect } from 'react';
import {
  Box, VStack, HStack, Text, Heading, Divider, Badge, Icon,
  Spinner, useToast, Center, IconButton, Button, FormControl,
  TextArea, Select, CheckIcon, Radio
} from 'native-base';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useLeads } from '../../hooks/useLeads';
import { useCalls } from '../../hooks/useCalls';

const CallScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const toast = useToast();
  const { leadId } = route.params || {};
  const { getLead, isLoading: isLoadingLead } = useLeads();
  const { createCall, isCreatingCall } = useCalls();
  
  const [lead, setLead] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    userLeadId: null,
    duration: 60,
    outcome: 'completed',
    notes: ''
  });

  const outcomeOptions = [
    { label: 'Completed', value: 'completed' },
    { label: 'No Answer', value: 'no_answer' },
    { label: 'Left Message', value: 'left_message' },
    { label: 'Interested', value: 'interested' },
    { label: 'Not Interested', value: 'not_interested' }
  ];

  const durationOptions = [
    { value: 30, label: '30 seconds' },
    { value: 60, label: '1 minute' },
    { value: 120, label: '2 minutes' },
    { value: 180, label: '3 minutes' },
    { value: 300, label: '5 minutes' },
    { value: 600, label: '10 minutes' },
    { value: 900, label: '15 minutes' },
    { value: 1800, label: '30 minutes' },
  ];

  useEffect(() => {
    const fetchLead = async () => {
      try {
        setIsLoading(true);
        
        if (!leadId) {
          toast.show({
            title: "Missing lead ID",
            status: "error",
            placement: "top"
          });
          navigation.goBack();
          return;
        }
        
        const leadData = await getLead(leadId);
        if (leadData) {
          setLead(leadData);
          setFormData(prev => ({
            ...prev,
            userLeadId: leadId,
            phoneNumber: route.params?.phoneNumber || leadData.globalLead?.phoneNumber,
            contactName: route.params?.contactName || leadData.globalLead?.contactName,
          }));
        } else {
          toast.show({
            title: "Lead not found",
            status: "error",
            placement: "top"
          });
          navigation.goBack();
        }
      } catch (error) {
        console.error('Error fetching lead details:', error);
        toast.show({
          title: "Error loading lead details",
          status: "error",
          placement: "top"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLead();
  }, [leadId, getLead]);

  const handleInputChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };

  const handleSubmit = async () => {
    try {
      const callData = {
        ...formData,
        callDate: new Date().toISOString(),
      };

      const response = await createCall(callData);
      
      if (response.success) {
        toast.show({
          title: "Call recorded successfully",
          status: "success",
          placement: "top"
        });
        navigation.navigate('Calls');
      }
    } catch (error) {
      console.error('Error recording call:', error);
      toast.show({
        title: "Error recording call",
        description: error.message,
        status: "error",
        placement: "top"
      });
    }
  };

  if (isLoading || isLoadingLead) {
    return (
      <Center flex={1} bg="white">
        <Spinner size="lg" color="primary.500" />
        <Text mt={4} color="gray.500">Loading lead details...</Text>
      </Center>
    );
  }

  return (
    <Box flex={1} bg="white" safeArea>
      <VStack px={4} pt={5} space={4}>
        <HStack alignItems="center" space={3}>
          <IconButton
            icon={<Icon as={Feather} name="arrow-left" size="md" />}
            variant="ghost"
            onPress={() => navigation.goBack()}
          />
          <Heading size="lg">Record Call</Heading>
        </HStack>
        
        <Divider />
        
        {lead && (
          <VStack space={2} bg="gray.50" p={4} rounded="md">
            <Heading size="md">{lead.globalLead.companyName}</Heading>
            <HStack alignItems="center" space={1}>
              <Icon as={Feather} name="user" size="sm" color="gray.500" />
              <Text>{lead.globalLead.contactName}</Text>
            </HStack>
            <HStack alignItems="center" space={1}>
              <Icon as={Feather} name="phone" size="sm" color="gray.500" />
              <Text>{lead.globalLead.phoneNumber}</Text>
            </HStack>
            {lead.globalLead.email && (
              <HStack alignItems="center" space={1}>
                <Icon as={Feather} name="mail" size="sm" color="gray.500" />
                <Text>{lead.globalLead.email}</Text>
              </HStack>
            )}
            <HStack alignItems="center" mt={2}>
              <Badge colorScheme={lead.status === 'new' ? 'info' : 'success'} mr={2}>
                {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
              </Badge>
              <Text fontSize="sm">Priority: {lead.priority}</Text>
            </HStack>
          </VStack>
        )}
        
        <Divider />
        
        <FormControl>
          <FormControl.Label>Call Duration</FormControl.Label>
          <Radio.Group
            name="duration"
            accessibilityLabel="call duration"
            value={formData.duration.toString()}
            onChange={(value) => handleInputChange('duration', parseInt(value))}
          >
            <HStack flexWrap="wrap">
              {durationOptions.map((option) => (
                <Radio 
                  key={option.value} 
                  value={option.value.toString()} 
                  size="sm"
                  m={1}
                  colorScheme="primary"
                >
                  {option.label}
                </Radio>
              ))}
            </HStack>
          </Radio.Group>
        </FormControl>
        
        <FormControl>
          <FormControl.Label>Call Outcome</FormControl.Label>
          <Select
            selectedValue={formData.outcome}
            onValueChange={(value) => handleInputChange('outcome', value)}
            _selectedItem={{
              bg: "primary.100",
              endIcon: <CheckIcon size={5} />
            }}
          >
            {outcomeOptions.map((option) => (
              <Select.Item 
                key={option.value} 
                label={option.label} 
                value={option.value} 
              />
            ))}
          </Select>
        </FormControl>
        
        <FormControl>
          <FormControl.Label>Notes</FormControl.Label>
          <TextArea
            h={20}
            placeholder="Enter call notes here"
            value={formData.notes}
            onChangeText={(value) => handleInputChange('notes', value)}
            autoCompleteType={undefined}
          />
        </FormControl>
        
        <Button
          mt={4}
          colorScheme="primary"
          onPress={handleSubmit}
          isLoading={isCreatingCall}
          isLoadingText="Saving Call"
        >
          Save Call Record
        </Button>
      </VStack>
    </Box>
  );
};

export default CallScreen;
