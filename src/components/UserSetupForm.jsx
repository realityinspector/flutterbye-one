import React, { useState } from 'react';
import {
  Box,
  VStack,
  FormControl,
  Input,
  Button,
  useToast,
  Text,
  Heading,
  Icon,
  Progress,
  HStack,
} from 'native-base';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';

/**
 * UserSetupForm component for new user onboarding
 * 
 * @param {Object} props Component props
 * @param {Function} props.onComplete Callback when setup is complete
 */
const UserSetupForm = ({ onComplete }) => {
  const { user, update } = useAuth();
  const toast = useToast();
  
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    companyName: user?.companyName || '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  // Handle form input changes
  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle next step
  const handleNextStep = () => {
    if (step === 1 && !formData.fullName) {
      toast.show({
        title: "Name is required",
        status: "warning",
      });
      return;
    }
    
    if (step === 2 && !formData.email) {
      toast.show({
        title: "Email is required",
        status: "warning",
      });
      return;
    }
    
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  // Handle previous step
  const handlePrevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      await update({
        ...formData,
        hasCompletedSetup: true,
      });
      
      toast.show({
        title: "Setup completed",
        description: "Your profile has been saved",
        status: "success",
      });
      
      onComplete();
    } catch (error) {
      console.error('User setup error:', error);
      toast.show({
        title: "Setup failed",
        description: error.message || "Please try again",
        status: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render current step content
  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <Box>
            <Heading size="lg" mb={2}>Welcome to Walk N Talk CRM</Heading>
            <Text fontSize="md" color="gray.600" mb={8}>
              Let's set up your profile so you can get started
            </Text>
            
            <FormControl mb={6}>
              <FormControl.Label>Your Full Name</FormControl.Label>
              <Input
                size="lg"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChangeText={(value) => handleChange('fullName', value)}
                leftElement={
                  <Icon as={Feather} name="user" size={5} color="gray.400" ml={2} />
                }
              />
            </FormControl>
          </Box>
        );
      
      case 2:
        return (
          <Box>
            <Heading size="lg" mb={2}>Your Contact Details</Heading>
            <Text fontSize="md" color="gray.600" mb={8}>
              How can leads and clients reach you?
            </Text>
            
            <FormControl mb={6}>
              <FormControl.Label>Email Address</FormControl.Label>
              <Input
                size="lg"
                placeholder="Enter your email"
                value={formData.email}
                onChangeText={(value) => handleChange('email', value)}
                keyboardType="email-address"
                leftElement={
                  <Icon as={Feather} name="mail" size={5} color="gray.400" ml={2} />
                }
              />
            </FormControl>
          </Box>
        );
      
      case 3:
        return (
          <Box>
            <Heading size="lg" mb={2}>Your Company</Heading>
            <Text fontSize="md" color="gray.600" mb={8}>
              Tell us about your organization
            </Text>
            
            <FormControl mb={6}>
              <FormControl.Label>Company Name</FormControl.Label>
              <Input
                size="lg"
                placeholder="Enter your company name"
                value={formData.companyName}
                onChangeText={(value) => handleChange('companyName', value)}
                leftElement={
                  <Icon as={Feather} name="briefcase" size={5} color="gray.400" ml={2} />
                }
              />
            </FormControl>
          </Box>
        );
      
      default:
        return null;
    }
  };

  return (
    <Box p={6} bg="white" rounded="lg" shadow={2} width="100%">
      {/* Progress indicator */}
      <HStack mb={8} alignItems="center">
        <Progress value={(step / totalSteps) * 100} colorScheme="primary" flex={1} />
        <Text ml={2} color="gray.500">{step}/{totalSteps}</Text>
      </HStack>
      
      {/* Step content */}
      {renderStepContent()}
      
      {/* Navigation buttons */}
      <HStack mt={8} space={4} justifyContent="space-between">
        <Button
          variant="ghost"
          onPress={handlePrevStep}
          isDisabled={step === 1 || isSubmitting}
          leftIcon={<Icon as={Feather} name="chevron-left" size={5} />}
        >
          Back
        </Button>
        
        <Button
          onPress={handleNextStep}
          isLoading={isSubmitting}
          rightIcon={step < totalSteps ? <Icon as={Feather} name="chevron-right" size={5} /> : undefined}
        >
          {step < totalSteps ? 'Next' : 'Complete Setup'}
        </Button>
      </HStack>
    </Box>
  );
};

export default UserSetupForm;