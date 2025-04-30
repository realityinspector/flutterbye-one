import React, { useState } from 'react';
import {
  Box,
  Button,
  Center,
  Heading,
  Text,
  VStack,
  HStack,
  Icon,
  Progress,
  Pressable,
  useToast,
} from 'native-base';
import { Feather } from '@expo/vector-icons';

/**
 * SetupWizard component for guiding users through a step-by-step setup process
 * 
 * @param {Object} props Component props
 * @param {Array} props.steps Array of step objects with title, description, and content
 * @param {Function} props.onComplete Callback when all steps are completed
 * @param {Function} props.onSkip Optional callback when setup is skipped
 * @param {boolean} props.allowSkip Whether to allow skipping the setup (defaults to false)
 */
const SetupWizard = ({
  steps,
  onComplete,
  onSkip,
  allowSkip = false,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  // Calculate progress percentage
  const progress = ((currentStep + 1) / steps.length) * 100;

  // Go to next step or complete
  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  // Go to previous step
  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Complete the wizard
  const handleComplete = () => {
    setIsSubmitting(true);
    
    try {
      onComplete();
    } catch (error) {
      console.error('Setup completion error:', error);
      toast.show({
        title: "Setup failed",
        description: error.message || "Please try again",
        status: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Skip the wizard
  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    }
  };

  return (
    <Box flex={1} bg="white" p={4} rounded="lg" shadow={2}>
      {/* Progress indicator */}
      <Box mb={6}>
        <HStack mb={2} justifyContent="space-between">
          <Text fontWeight="medium" color="gray.700">
            Step {currentStep + 1} of {steps.length}
          </Text>
          <Text color="gray.500">{Math.round(progress)}%</Text>
        </HStack>
        <Progress value={progress} size="sm" colorScheme="primary" />
      </Box>

      {/* Step header */}
      <VStack mb={6}>
        <Heading size="lg" mb={2}>{steps[currentStep].title}</Heading>
        <Text color="gray.600">{steps[currentStep].description}</Text>
      </VStack>

      {/* Step content */}
      <Box flex={1} mb={6}>
        {steps[currentStep].content}
      </Box>

      {/* Navigation buttons */}
      <VStack space={4}>
        <HStack space={4} justifyContent="space-between">
          <Button
            variant="outline"
            onPress={handleBack}
            isDisabled={currentStep === 0 || isSubmitting}
            leftIcon={<Icon as={Feather} name="arrow-left" size={5} />}
            flex={1}
          >
            Back
          </Button>
          
          <Button
            onPress={handleNext}
            isLoading={isSubmitting}
            rightIcon={currentStep < steps.length - 1 ? 
              <Icon as={Feather} name="arrow-right" size={5} /> : 
              undefined
            }
            flex={1}
          >
            {currentStep < steps.length - 1 ? 'Next' : 'Complete'}
          </Button>
        </HStack>
        
        {allowSkip && (
          <Pressable onPress={handleSkip}>
            <Center>
              <Text color="gray.500" fontWeight="medium" underline>
                Skip setup for now
              </Text>
            </Center>
          </Pressable>
        )}
      </VStack>
    </Box>
  );
};

export default SetupWizard;