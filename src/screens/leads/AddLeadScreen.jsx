import React, { useState } from 'react';
import { 
  Box, VStack, FormControl, Input, TextArea, ScrollView, Button, 
  Select, HStack, IconButton, useToast, Heading, Divider, CheckIcon
} from 'native-base';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useLeads } from '../../hooks/useLeads';

const AddLeadScreen = () => {
  const navigation = useNavigation();
  const { createLead, isCreatingLead } = useLeads();
  const toast = useToast();
  
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
    priority: '3',
    notes: ''
  });

  const statusOptions = [
    { label: 'New', value: 'new' },
    { label: 'Contacted', value: 'contacted' },
    { label: 'Qualified', value: 'qualified' },
    { label: 'Proposal', value: 'proposal' },
    { label: 'Negotiation', value: 'negotiation' },
    { label: 'Won', value: 'won' },
    { label: 'Lost', value: 'lost' }
  ];

  const priorityOptions = [
    { label: 'Very High (5)', value: '5' },
    { label: 'High (4)', value: '4' },
    { label: 'Medium (3)', value: '3' },
    { label: 'Low (2)', value: '2' },
    { label: 'Very Low (1)', value: '1' }
  ];

  const industryOptions = [
    { label: 'Technology', value: 'Technology' },
    { label: 'Healthcare', value: 'Healthcare' },
    { label: 'Finance', value: 'Finance' },
    { label: 'Education', value: 'Education' },
    { label: 'Manufacturing', value: 'Manufacturing' },
    { label: 'Retail', value: 'Retail' },
    { label: 'Real Estate', value: 'Real Estate' },
    { label: 'Hospitality', value: 'Hospitality' },
    { label: 'Construction', value: 'Construction' },
    { label: 'Other', value: 'Other' }
  ];

  const handleInputChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };

  const validateForm = () => {
    if (!formData.companyName) {
      toast.show({
        title: 'Company name required',
        status: 'warning',
        placement: 'top'
      });
      return false;
    }

    if (!formData.contactName) {
      toast.show({
        title: 'Contact name required',
        status: 'warning',
        placement: 'top'
      });
      return false;
    }

    if (!formData.phoneNumber) {
      toast.show({
        title: 'Phone number required',
        status: 'warning',
        placement: 'top'
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      await createLead({
        ...formData,
        priority: parseInt(formData.priority)
      });

      toast.show({
        title: 'Lead created successfully',
        status: 'success',
        placement: 'top'
      });

      navigation.navigate('Leads');
    } catch (error) {
      toast.show({
        title: 'Error creating lead',
        description: error.message,
        status: 'error',
        placement: 'top'
      });
    }
  };

  return (
    <Box flex={1} bg="white" safeArea>
      <VStack px={4} pt={5}>
        <HStack justifyContent="space-between" alignItems="center" mb={4}>
          <IconButton
            icon={<Feather name="arrow-left" size={24} color="black" />}
            variant="ghost"
            onPress={() => navigation.goBack()}
          />
          <Heading size="lg">Add New Lead</Heading>
          <Box w={10} />  {/* Empty box for balance */}
        </HStack>
      </VStack>

      <Divider />

      <ScrollView flex={1} px={4}>
        <VStack space={4} mt={4}>
          <FormControl isRequired>
            <FormControl.Label>Company Name</FormControl.Label>
            <Input
              placeholder="Enter company name"
              value={formData.companyName}
              onChangeText={(value) => handleInputChange('companyName', value)}
            />
          </FormControl>

          <FormControl isRequired>
            <FormControl.Label>Contact Name</FormControl.Label>
            <Input
              placeholder="Enter contact name"
              value={formData.contactName}
              onChangeText={(value) => handleInputChange('contactName', value)}
            />
          </FormControl>

          <FormControl isRequired>
            <FormControl.Label>Phone Number</FormControl.Label>
            <Input
              placeholder="Enter phone number"
              value={formData.phoneNumber}
              onChangeText={(value) => handleInputChange('phoneNumber', value)}
              keyboardType="phone-pad"
            />
          </FormControl>

          <FormControl>
            <FormControl.Label>Email</FormControl.Label>
            <Input
              placeholder="Enter email address"
              value={formData.email}
              onChangeText={(value) => handleInputChange('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </FormControl>

          <FormControl>
            <FormControl.Label>Industry</FormControl.Label>
            <Select
              selectedValue={formData.industry}
              onValueChange={(value) => handleInputChange('industry', value)}
              placeholder="Select industry"
              _selectedItem={{
                bg: "primary.100",
                endIcon: <CheckIcon size={5} />
              }}
            >
              {industryOptions.map((option) => (
                <Select.Item 
                  key={option.value} 
                  label={option.label} 
                  value={option.value} 
                />
              ))}
            </Select>
          </FormControl>

          <FormControl>
            <FormControl.Label>Website</FormControl.Label>
            <Input
              placeholder="Enter website URL"
              value={formData.website}
              onChangeText={(value) => handleInputChange('website', value)}
              autoCapitalize="none"
              keyboardType="url"
            />
          </FormControl>

          <FormControl>
            <FormControl.Label>Address</FormControl.Label>
            <Input
              placeholder="Enter street address"
              value={formData.address}
              onChangeText={(value) => handleInputChange('address', value)}
            />
          </FormControl>

          <HStack space={2}>
            <FormControl flex={2}>
              <FormControl.Label>City</FormControl.Label>
              <Input
                placeholder="City"
                value={formData.city}
                onChangeText={(value) => handleInputChange('city', value)}
              />
            </FormControl>

            <FormControl flex={1}>
              <FormControl.Label>State</FormControl.Label>
              <Input
                placeholder="State"
                value={formData.state}
                onChangeText={(value) => handleInputChange('state', value)}
              />
            </FormControl>

            <FormControl flex={1}>
              <FormControl.Label>Zip</FormControl.Label>
              <Input
                placeholder="Zip Code"
                value={formData.zipCode}
                onChangeText={(value) => handleInputChange('zipCode', value)}
                keyboardType="number-pad"
              />
            </FormControl>
          </HStack>

          <FormControl>
            <FormControl.Label>Status</FormControl.Label>
            <Select
              selectedValue={formData.status}
              onValueChange={(value) => handleInputChange('status', value)}
              placeholder="Select lead status"
              _selectedItem={{
                bg: "primary.100",
                endIcon: <CheckIcon size={5} />
              }}
            >
              {statusOptions.map((option) => (
                <Select.Item 
                  key={option.value} 
                  label={option.label} 
                  value={option.value} 
                />
              ))}
            </Select>
          </FormControl>

          <FormControl>
            <FormControl.Label>Priority</FormControl.Label>
            <Select
              selectedValue={formData.priority}
              onValueChange={(value) => handleInputChange('priority', value)}
              placeholder="Select priority level"
              _selectedItem={{
                bg: "primary.100",
                endIcon: <CheckIcon size={5} />
              }}
            >
              {priorityOptions.map((option) => (
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
              placeholder="Enter any additional notes"
              value={formData.notes}
              onChangeText={(value) => handleInputChange('notes', value)}
              autoCompleteType={undefined}
            />
          </FormControl>

          <Button
            mt={4}
            mb={8}
            colorScheme="primary"
            onPress={handleSubmit}
            isLoading={isCreatingLead}
            isLoadingText="Creating Lead"
          >
            Create Lead
          </Button>
        </VStack>
      </ScrollView>
    </Box>
  );
};

export default AddLeadScreen;
