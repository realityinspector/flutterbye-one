import React, { useState, useEffect } from 'react';
import {
  Box,
  ScrollView,
  VStack,
  HStack,
  Heading,
  Text,
  FormControl,
  Input,
  TextArea,
  Button,
  Select,
  Icon,
  useToast,
  IconButton,
  KeyboardAvoidingView,
  Spinner,
  Center,
} from 'native-base';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useLeads } from '../hooks/useLeads';

const LeadFormScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const toast = useToast();
  const { leadId } = route.params || {};
  const { getLead, createLead, updateLead, isLoading } = useLeads();
  
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    phoneNumber: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    industry: '',
    website: '',
    status: 'new',
    priority: 5,
    notes: '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingLead, setIsLoadingLead] = useState(false);
  const [originalLead, setOriginalLead] = useState(null);
  
  // Load lead data if editing an existing lead
  useEffect(() => {
    const fetchLead = async () => {
      if (leadId) {
        try {
          setIsLoadingLead(true);
          const lead = await getLead(leadId);
          setOriginalLead(lead);
          
          // Map lead data to form fields
          setFormData({
            companyName: lead.globalLead?.companyName || '',
            contactName: lead.globalLead?.contactName || '',
            phoneNumber: lead.globalLead?.phoneNumber || '',
            email: lead.globalLead?.email || '',
            address: lead.globalLead?.address || '',
            city: lead.globalLead?.city || '',
            state: lead.globalLead?.state || '',
            zipCode: lead.globalLead?.zipCode || '',
            industry: lead.globalLead?.industry || '',
            website: lead.globalLead?.website || '',
            status: lead.status || 'new',
            priority: lead.priority || 5,
            notes: lead.notes || '',
          });
        } catch (error) {
          console.error('Error fetching lead details:', error);
          toast.show({
            title: "Couldn't load lead data",
            description: "Please try again",
            status: "error",
          });
        } finally {
          setIsLoadingLead(false);
        }
      }
    };
    
    fetchLead();
  }, [leadId]);

  // Handle form input changes
  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Form validation
  const validateForm = () => {
    if (!formData.companyName) {
      toast.show({
        title: "Company name required",
        status: "warning",
      });
      return false;
    }
    
    if (!formData.contactName) {
      toast.show({
        title: "Contact name required",
        status: "warning",
      });
      return false;
    }
    
    if (!formData.phoneNumber) {
      toast.show({
        title: "Phone number required",
        status: "warning",
      });
      return false;
    }
    
    return true;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      if (leadId) {
        // Update existing lead
        await updateLead(leadId, formData);
        toast.show({
          title: "Lead updated",
          status: "success",
        });
      } else {
        // Create new lead
        await createLead(formData);
        toast.show({
          title: "Lead created",
          status: "success",
        });
      }
      
      navigation.goBack();
    } catch (error) {
      console.error('Error saving lead:', error);
      toast.show({
        title: leadId ? "Update failed" : "Creation failed",
        description: error.message || "Please try again",
        status: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancel action
  const handleCancel = () => {
    navigation.goBack();
  };

  // Show loading state while fetching lead data
  if (leadId && isLoadingLead) {
    return (
      <Center flex={1}>
        <Spinner size="lg" color="primary.500" />
        <Text mt={4} color="gray.500">Loading lead data...</Text>
      </Center>
    );
  }

  return (
    <KeyboardAvoidingView flex={1} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <Box flex={1} safeArea bg="white">
        <Box px={4} py={4} bg="white" shadow={2} zIndex={1}>
          <HStack alignItems="center" justifyContent="space-between">
            <HStack space={2} alignItems="center">
              <IconButton
                icon={<Icon as={Feather} name="x" size={6} />}
                onPress={handleCancel}
                variant="ghost"
                borderRadius="full"
              />
              <Heading size="md">{leadId ? 'Edit Lead' : 'Add Lead'}</Heading>
            </HStack>
            <Button
              onPress={handleSubmit}
              isLoading={isSubmitting}
              colorScheme="primary"
            >
              {leadId ? 'Update' : 'Save'}
            </Button>
          </HStack>
        </Box>

        <ScrollView p={4}>
          <VStack space={5} mb={5}>
            {/* Basic Information */}
            <FormControl isRequired>
              <FormControl.Label>Company Name</FormControl.Label>
              <Input
                placeholder="Enter company name"
                value={formData.companyName}
                onChangeText={(value) => handleChange('companyName', value)}
                leftElement={
                  <Icon as={Feather} name="briefcase" size={5} color="gray.400" ml={2} />
                }
              />
            </FormControl>

            <FormControl isRequired>
              <FormControl.Label>Contact Name</FormControl.Label>
              <Input
                placeholder="Enter contact name"
                value={formData.contactName}
                onChangeText={(value) => handleChange('contactName', value)}
                leftElement={
                  <Icon as={Feather} name="user" size={5} color="gray.400" ml={2} />
                }
              />
            </FormControl>

            <FormControl isRequired>
              <FormControl.Label>Phone Number</FormControl.Label>
              <Input
                placeholder="Enter phone number"
                value={formData.phoneNumber}
                onChangeText={(value) => handleChange('phoneNumber', value)}
                keyboardType="phone-pad"
                leftElement={
                  <Icon as={Feather} name="phone" size={5} color="gray.400" ml={2} />
                }
              />
            </FormControl>

            <FormControl>
              <FormControl.Label>Email</FormControl.Label>
              <Input
                placeholder="Enter email address"
                value={formData.email}
                onChangeText={(value) => handleChange('email', value)}
                keyboardType="email-address"
                leftElement={
                  <Icon as={Feather} name="mail" size={5} color="gray.400" ml={2} />
                }
              />
            </FormControl>

            {/* Address Information */}
            <FormControl>
              <FormControl.Label>Address</FormControl.Label>
              <Input
                placeholder="Enter street address"
                value={formData.address}
                onChangeText={(value) => handleChange('address', value)}
                leftElement={
                  <Icon as={Feather} name="map-pin" size={5} color="gray.400" ml={2} />
                }
              />
            </FormControl>

            <HStack space={4}>
              <FormControl flex={1}>
                <FormControl.Label>City</FormControl.Label>
                <Input
                  placeholder="City"
                  value={formData.city}
                  onChangeText={(value) => handleChange('city', value)}
                />
              </FormControl>

              <FormControl flex={1}>
                <FormControl.Label>State</FormControl.Label>
                <Input
                  placeholder="State"
                  value={formData.state}
                  onChangeText={(value) => handleChange('state', value)}
                />
              </FormControl>
            </HStack>

            <FormControl>
              <FormControl.Label>ZIP Code</FormControl.Label>
              <Input
                placeholder="ZIP Code"
                value={formData.zipCode}
                onChangeText={(value) => handleChange('zipCode', value)}
                keyboardType="numeric"
              />
            </FormControl>

            {/* Additional Information */}
            <FormControl>
              <FormControl.Label>Industry</FormControl.Label>
              <Input
                placeholder="Enter industry"
                value={formData.industry}
                onChangeText={(value) => handleChange('industry', value)}
                leftElement={
                  <Icon as={Feather} name="tag" size={5} color="gray.400" ml={2} />
                }
              />
            </FormControl>

            <FormControl>
              <FormControl.Label>Website</FormControl.Label>
              <Input
                placeholder="Enter website URL"
                value={formData.website}
                onChangeText={(value) => handleChange('website', value)}
                keyboardType="url"
                leftElement={
                  <Icon as={Feather} name="globe" size={5} color="gray.400" ml={2} />
                }
              />
            </FormControl>

            {/* Lead Status and Priority */}
            <FormControl>
              <FormControl.Label>Status</FormControl.Label>
              <Select
                selectedValue={formData.status}
                onValueChange={(value) => handleChange('status', value)}
                placeholder="Select status"
                leftIcon={<Icon as={Feather} name="flag" size={5} color="gray.400" ml={2} />}
              >
                <Select.Item label="New" value="new" />
                <Select.Item label="Contacted" value="contacted" />
                <Select.Item label="Qualified" value="qualified" />
                <Select.Item label="Unqualified" value="unqualified" />
                <Select.Item label="Converted" value="converted" />
              </Select>
            </FormControl>

            <FormControl>
              <FormControl.Label>Priority (1-10)</FormControl.Label>
              <Select
                selectedValue={formData.priority.toString()}
                onValueChange={(value) => handleChange('priority', parseInt(value))}
                placeholder="Select priority"
                leftIcon={<Icon as={Feather} name="alert-circle" size={5} color="gray.400" ml={2} />}
              >
                <Select.Item label="1 - Very Low" value="1" />
                <Select.Item label="2 - Low" value="2" />
                <Select.Item label="3 - Low" value="3" />
                <Select.Item label="4 - Medium Low" value="4" />
                <Select.Item label="5 - Medium" value="5" />
                <Select.Item label="6 - Medium" value="6" />
                <Select.Item label="7 - Medium High" value="7" />
                <Select.Item label="8 - High" value="8" />
                <Select.Item label="9 - Very High" value="9" />
                <Select.Item label="10 - Critical" value="10" />
              </Select>
            </FormControl>

            <FormControl>
              <FormControl.Label>Notes</FormControl.Label>
              <TextArea
                h={20}
                placeholder="Enter notes about this lead"
                value={formData.notes}
                onChangeText={(value) => handleChange('notes', value)}
                autoCompleteType={undefined}
              />
            </FormControl>
          </VStack>
        </ScrollView>
      </Box>
    </KeyboardAvoidingView>
  );
};

export default LeadFormScreen;