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
  Switch,
  TextArea,
} from 'native-base';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';

/**
 * AdminSetupForm component for initial admin onboarding
 * 
 * @param {Object} props Component props
 * @param {Function} props.onComplete Callback when setup is complete
 */
const AdminSetupForm = ({ onComplete }) => {
  const { user, update } = useAuth();
  const toast = useToast();
  
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    companyName: user?.companyName || '',
    companySize: '',
    industry: '',
    welcomeMessage: '',
    enableNotifications: true,
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  // Handle form input changes
  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle next step
  const handleNextStep = () => {
    // Validation for each step
    if (step === 1) {
      if (!formData.fullName || !formData.email) {
        toast.show({
          title: "Required fields missing",
          description: "Please enter your name and email",
          status: "warning",
        });
        return;
      }
    } else if (step === 2) {
      if (!formData.companyName) {
        toast.show({
          title: "Company name required",
          description: "Please enter your company name",
          status: "warning",
        });
        return;
      }
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
        role: 'admin',
      });
      
      toast.show({
        title: "Setup completed",
        description: "Your organization is ready to use Walk N Talk CRM",
        status: "success",
      });
      
      onComplete();
    } catch (error) {
      console.error('Admin setup error:', error);
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
            <Heading size="lg" mb={2}>Welcome, Administrator</Heading>
            <Text fontSize="md" color="gray.600" mb={8}>
              Let's set up your Walk N Talk CRM account
            </Text>
            
            <FormControl mb={6} isRequired>
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
            
            <FormControl isRequired>
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
      
      case 2:
        return (
          <Box>
            <Heading size="lg" mb={2}>Company Information</Heading>
            <Text fontSize="md" color="gray.600" mb={8}>
              Tell us about your organization
            </Text>
            
            <FormControl mb={6} isRequired>
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
            
            <FormControl mb={6}>
              <FormControl.Label>Industry</FormControl.Label>
              <Input
                size="lg"
                placeholder="Enter your industry"
                value={formData.industry}
                onChangeText={(value) => handleChange('industry', value)}
                leftElement={
                  <Icon as={Feather} name="tag" size={5} color="gray.400" ml={2} />
                }
              />
            </FormControl>
            
            <FormControl>
              <FormControl.Label>Company Size</FormControl.Label>
              <Input
                size="lg"
                placeholder="Number of employees"
                value={formData.companySize}
                onChangeText={(value) => handleChange('companySize', value)}
                keyboardType="number-pad"
                leftElement={
                  <Icon as={Feather} name="users" size={5} color="gray.400" ml={2} />
                }
              />
            </FormControl>
          </Box>
        );
      
      case 3:
        return (
          <Box>
            <Heading size="lg" mb={2}>User Experience</Heading>
            <Text fontSize="md" color="gray.600" mb={8}>
              Customize the experience for your team
            </Text>
            
            <FormControl mb={6}>
              <FormControl.Label>Welcome Message</FormControl.Label>
              <TextArea
                h={24}
                placeholder="Enter a welcome message for your team members"
                value={formData.welcomeMessage}
                onChangeText={(value) => handleChange('welcomeMessage', value)}
                autoCompleteType={undefined}
              />
              <FormControl.HelperText>
                This message will be displayed when users log in
              </FormControl.HelperText>
            </FormControl>
          </Box>
        );
      
      case 4:
        return (
          <Box>
            <Heading size="lg" mb={2}>Final Settings</Heading>
            <Text fontSize="md" color="gray.600" mb={8}>
              Just a few more settings before you're ready to go
            </Text>
            
            <FormControl mb={6}>
              <FormControl.Label>Enable Notifications</FormControl.Label>
              <HStack alignItems="center" space={2}>
                <Switch
                  size="lg"
                  isChecked={formData.enableNotifications}
                  onToggle={(value) => handleChange('enableNotifications', value)}
                  colorScheme="primary"
                />
                <Text>{formData.enableNotifications ? 'Enabled' : 'Disabled'}</Text>
              </HStack>
              <FormControl.HelperText>
                Receive notifications for new leads and important updates
              </FormControl.HelperText>
            </FormControl>
            
            <Box p={4} bg="primary.50" rounded="md" mt={6}>
              <HStack alignItems="center" space={2} mb={2}>
                <Icon as={Feather} name="info" color="primary.500" size={5} />
                <Heading size="sm" color="primary.500">Ready to Launch</Heading>
              </HStack>
              <Text color="primary.700">
                You're about to complete the setup process. Once finished, you'll be able to:
              </Text>
              <VStack space={2} mt={2} pl={2}>
                <HStack space={2} alignItems="center">
                  <Icon as={Feather} name="check-circle" size={4} color="primary.500" />
                  <Text color="primary.700">Manage your team members</Text>
                </HStack>
                <HStack space={2} alignItems="center">
                  <Icon as={Feather} name="check-circle" size={4} color="primary.500" />
                  <Text color="primary.700">Track leads and calls</Text>
                </HStack>
                <HStack space={2} alignItems="center">
                  <Icon as={Feather} name="check-circle" size={4} color="primary.500" />
                  <Text color="primary.700">Monitor sales performance</Text>
                </HStack>
              </VStack>
            </Box>
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

export default AdminSetupForm;