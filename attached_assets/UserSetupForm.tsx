import React, { useState } from 'react';
import {
  VStack,
  FormControl,
  Input,
  HStack,
  Text,
  Button,
  Icon,
  Box,
  Switch,
  Divider,
  useToast,
} from 'native-base';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';

type UserSetupFormProps = {
  onComplete: () => void;
};

const UserSetupForm = ({ onComplete }: UserSetupFormProps) => {
  const { user, update } = useAuth();
  const toast = useToast();
  
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    companyName: user?.companyName || '',
    enableNotifications: true,
    enableCalendarIntegration: true,
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async () => {
    if (!formData.fullName || !formData.email) {
      toast.show({
        title: "Required fields",
        description: "Please complete all required fields",
        status: "warning",
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Update the user profile
      await update({
        fullName: formData.fullName,
        email: formData.email,
        companyName: formData.companyName,
        hasCompletedSetup: true,
      });
      
      toast.show({
        title: "Profile updated",
        description: "Your preferences have been saved",
        status: "success",
      });
      
      onComplete();
    } catch (error) {
      console.error("Error updating user profile:", error);
      
      toast.show({
        title: "Update failed",
        description: "Please try again",
        status: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <VStack space={5}>
      <Box bg="primary.50" p={4} rounded="md">
        <HStack space={3} alignItems="center">
          <Icon as={Feather} name="user-check" size="sm" color="primary.600" />
          <Text color="primary.700" fontWeight="medium">
            Welcome to WALK&TALK! Let's personalize your experience.
          </Text>
        </HStack>
      </Box>
      
      <FormControl isRequired>
        <FormControl.Label>Full Name</FormControl.Label>
        <Input
          placeholder="Enter your full name"
          value={formData.fullName}
          onChangeText={value => setFormData({ ...formData, fullName: value })}
        />
      </FormControl>
      
      <FormControl isRequired>
        <FormControl.Label>Email</FormControl.Label>
        <Input
          placeholder="Enter your email address"
          value={formData.email}
          onChangeText={value => setFormData({ ...formData, email: value })}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </FormControl>
      
      <FormControl>
        <FormControl.Label>Company</FormControl.Label>
        <Input
          placeholder="Enter your company name"
          value={formData.companyName}
          onChangeText={value => setFormData({ ...formData, companyName: value })}
        />
      </FormControl>
      
      <Divider />
      
      <VStack space={4}>
        <Text fontWeight="medium" color="gray.700">App Preferences</Text>
        
        <FormControl>
          <HStack alignItems="center" justifyContent="space-between">
            <VStack>
              <Text>Push Notifications</Text>
              <Text fontSize="xs" color="gray.500">
                Get reminders for follow-up calls
              </Text>
            </VStack>
            <Switch
              isChecked={formData.enableNotifications}
              onToggle={() => 
                setFormData({ 
                  ...formData, 
                  enableNotifications: !formData.enableNotifications 
                })
              }
              colorScheme="primary"
            />
          </HStack>
        </FormControl>
        
        <FormControl>
          <HStack alignItems="center" justifyContent="space-between">
            <VStack>
              <Text>Calendar Integration</Text>
              <Text fontSize="xs" color="gray.500">
                Add call reminders to your calendar
              </Text>
            </VStack>
            <Switch
              isChecked={formData.enableCalendarIntegration}
              onToggle={() => 
                setFormData({ 
                  ...formData, 
                  enableCalendarIntegration: !formData.enableCalendarIntegration 
                })
              }
              colorScheme="primary"
            />
          </HStack>
        </FormControl>
      </VStack>
      
      <Button
        mt={4}
        isLoading={isSubmitting}
        onPress={handleSubmit}
        leftIcon={<Icon as={Feather} name="check-circle" size="sm" />}
      >
        Complete Setup
      </Button>
    </VStack>
  );
};

export default UserSetupForm;
