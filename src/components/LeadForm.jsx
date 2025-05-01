import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  FormControl,
  Input,
  TextArea,
  Button,
  ScrollView,
  Heading,
  Icon,
  KeyboardAvoidingView,
  useToast,
  HStack,
} from 'native-base';
import Feather from 'react-native-vector-icons/Feather';
import { useLeads } from '../hooks/useLeads';
import { Platform } from 'react-native';

const LeadForm = ({ leadId, onSuccess, onCancel }) => {
  const { createLead, updateLead, getLead, isCreatingLead, isUpdatingLead } = useLeads();
  const toast = useToast();
  const isEditing = !!leadId;
  
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
    notes: '',
  });
  
  const [errors, setErrors] = useState({});
  
  // Load lead data if editing
  useEffect(() => {
    if (isEditing) {
      const { data: lead, isLoading } = getLead(leadId);
      if (lead && !isLoading) {
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
          notes: lead.notes || '',
        });
      }
    }
  }, [isEditing, leadId, getLead]);
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }
    
    if (!formData.contactName.trim()) {
      newErrors.contactName = 'Contact name is required';
    }
    
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/im.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
    }
    
    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      if (isEditing) {
        await updateLead({
          leadId,
          leadData: formData,
        });
      } else {
        await createLead(formData);
      }
      
      toast.show({
        title: isEditing ? "Lead updated" : "Lead created",
        status: "success",
      });
      
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error saving lead:", error);
      
      toast.show({
        title: "Error",
        description: "Failed to save lead",
        status: "error",
      });
    }
  };
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      flex={1}
    >
      <ScrollView
        flex={1}
        contentContainerStyle={{ flexGrow: 1 }}
        px={4}
        pt={4}
      >
        <VStack space={4} flex={1}>
          <Heading size="lg" color="primary.600">
            {isEditing ? 'Edit Lead' : 'Add New Lead'}
          </Heading>
          
          <VStack space={4}>
            {/* Company Information */}
            <FormControl isRequired isInvalid={'companyName' in errors}>
              <FormControl.Label>Company Name</FormControl.Label>
              <Input 
                placeholder="Enter company name"
                value={formData.companyName}
                onChangeText={value => setFormData({ ...formData, companyName: value })}
                leftElement={
                  <Icon as={Feather} name="briefcase" size={5} ml={2} color="gray.400" />
                }
              />
              <FormControl.ErrorMessage>
                {errors.companyName}
              </FormControl.ErrorMessage>
            </FormControl>
            
            <FormControl isRequired isInvalid={'contactName' in errors}>
              <FormControl.Label>Contact Person</FormControl.Label>
              <Input 
                placeholder="Enter contact name"
                value={formData.contactName}
                onChangeText={value => setFormData({ ...formData, contactName: value })}
                leftElement={
                  <Icon as={Feather} name="user" size={5} ml={2} color="gray.400" />
                }
              />
              <FormControl.ErrorMessage>
                {errors.contactName}
              </FormControl.ErrorMessage>
            </FormControl>
            
            {/* Contact Information */}
            <FormControl isRequired isInvalid={'phoneNumber' in errors}>
              <FormControl.Label>Phone Number</FormControl.Label>
              <Input 
                placeholder="Enter phone number"
                value={formData.phoneNumber}
                onChangeText={value => setFormData({ ...formData, phoneNumber: value })}
                keyboardType="phone-pad"
                leftElement={
                  <Icon as={Feather} name="phone" size={5} ml={2} color="gray.400" />
                }
              />
              <FormControl.ErrorMessage>
                {errors.phoneNumber}
              </FormControl.ErrorMessage>
            </FormControl>
            
            <FormControl isInvalid={'email' in errors}>
              <FormControl.Label>Email (Optional)</FormControl.Label>
              <Input 
                placeholder="Enter email address"
                value={formData.email}
                onChangeText={value => setFormData({ ...formData, email: value })}
                keyboardType="email-address"
                autoCapitalize="none"
                leftElement={
                  <Icon as={Feather} name="mail" size={5} ml={2} color="gray.400" />
                }
              />
              <FormControl.ErrorMessage>
                {errors.email}
              </FormControl.ErrorMessage>
            </FormControl>
            
            {/* Address Information */}
            <FormControl>
              <FormControl.Label>Address (Optional)</FormControl.Label>
              <Input 
                placeholder="Enter street address"
                value={formData.address}
                onChangeText={value => setFormData({ ...formData, address: value })}
                leftElement={
                  <Icon as={Feather} name="map-pin" size={5} ml={2} color="gray.400" />
                }
              />
            </FormControl>
            
            <HStack space={2}>
              <FormControl flex={2}>
                <FormControl.Label>City</FormControl.Label>
                <Input 
                  placeholder="City"
                  value={formData.city}
                  onChangeText={value => setFormData({ ...formData, city: value })}
                />
              </FormControl>
              
              <FormControl flex={1}>
                <FormControl.Label>State</FormControl.Label>
                <Input 
                  placeholder="State"
                  value={formData.state}
                  onChangeText={value => setFormData({ ...formData, state: value })}
                />
              </FormControl>
              
              <FormControl flex={1}>
                <FormControl.Label>ZIP</FormControl.Label>
                <Input 
                  placeholder="ZIP"
                  value={formData.zipCode}
                  onChangeText={value => setFormData({ ...formData, zipCode: value })}
                  keyboardType="number-pad"
                />
              </FormControl>
            </HStack>
            
            {/* Additional Information */}
            <FormControl>
              <FormControl.Label>Industry (Optional)</FormControl.Label>
              <Input 
                placeholder="Enter industry"
                value={formData.industry}
                onChangeText={value => setFormData({ ...formData, industry: value })}
                leftElement={
                  <Icon as={Feather} name="tag" size={5} ml={2} color="gray.400" />
                }
              />
            </FormControl>
            
            <FormControl>
              <FormControl.Label>Website (Optional)</FormControl.Label>
              <Input 
                placeholder="Enter website"
                value={formData.website}
                onChangeText={value => setFormData({ ...formData, website: value })}
                autoCapitalize="none"
                leftElement={
                  <Icon as={Feather} name="globe" size={5} ml={2} color="gray.400" />
                }
              />
            </FormControl>
            
            <FormControl>
              <FormControl.Label>Notes (Optional)</FormControl.Label>
              <TextArea 
                placeholder="Enter any notes about this lead"
                value={formData.notes}
                onChangeText={value => setFormData({ ...formData, notes: value })}
                autoCompleteType={undefined}
                h={20}
              />
            </FormControl>
          </VStack>
          
          <VStack space={3} mt={6} mb={8}>
            <Button
              colorScheme="primary"
              isLoading={isCreatingLead || isUpdatingLead}
              onPress={handleSubmit}
              leftIcon={<Icon as={Feather} name="save" size="sm" />}
            >
              {isEditing ? 'Update Lead' : 'Save Lead'}
            </Button>
            
            {onCancel && (
              <Button
                variant="outline"
                colorScheme="gray"
                onPress={onCancel}
              >
                Cancel
              </Button>
            )}
          </VStack>
        </VStack>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default LeadForm;
