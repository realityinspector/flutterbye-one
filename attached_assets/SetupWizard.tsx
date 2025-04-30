import React, { useState, ReactNode } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Button,
  Icon,
  Progress,
  Center,
  useTheme,
} from 'native-base';
import { Feather } from '@expo/vector-icons';

type Step = {
  title: string;
  description: string;
  content: ReactNode;
};

type SetupWizardProps = {
  steps: Step[];
  onComplete: () => void;
  onSkip?: () => void;
  allowSkip?: boolean;
};

const SetupWizard = ({ 
  steps, 
  onComplete, 
  onSkip, 
  allowSkip = false 
}: SetupWizardProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const theme = useTheme();
  
  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };
  
  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const progressValue = ((currentStep + 1) / steps.length) * 100;
  
  return (
    <Box flex={1} bg="white" safeArea>
      {/* Header with progress */}
      <VStack px={4} pt={4} pb={2} space={2} borderBottomWidth={1} borderBottomColor="gray.200">
        <HStack justifyContent="space-between" alignItems="center">
          <Heading size="lg" color="primary.600">Setup Wizard</Heading>
          <Text color="gray.500">
            Step {currentStep + 1} of {steps.length}
          </Text>
        </HStack>
        
        <Progress
          value={progressValue}
          colorScheme="primary"
          size="sm"
          rounded="full"
        />
        
        <HStack space={3} alignItems="center" my={2}>
          <Icon as={Feather} name="info" size="sm" color="primary.500" />
          <Text fontSize="sm" color="gray.600">
            {steps[currentStep].description}
          </Text>
        </HStack>
      </VStack>
      
      {/* Content area */}
      <Box flex={1} px={4} py={4}>
        <Heading size="md" mb={4} color="gray.800">
          {steps[currentStep].title}
        </Heading>
        
        {steps[currentStep].content}
      </Box>
      
      {/* Bottom navigation buttons */}
      <HStack
        px={4}
        py={4}
        space={2}
        justifyContent="space-between"
        borderTopWidth={1}
        borderTopColor="gray.200"
      >
        <Button
          variant="outline"
          colorScheme="gray"
          isDisabled={currentStep === 0}
          onPress={handleBack}
          leftIcon={<Icon as={Feather} name="arrow-left" size="sm" />}
          flex={1}
        >
          Back
        </Button>
        
        <Button
          colorScheme="primary"
          onPress={handleNext}
          rightIcon={
            currentStep === steps.length - 1
              ? <Icon as={Feather} name="check" size="sm" />
              : <Icon as={Feather} name="arrow-right" size="sm" />
          }
          flex={1}
        >
          {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
        </Button>
      </HStack>
      
      {allowSkip && onSkip && (
        <Center py={2}>
          <Button
            variant="ghost"
            onPress={onSkip}
            leftIcon={<Icon as={Feather} name="skip-forward" size="sm" />}
            _text={{ color: "gray.500", fontSize: "sm" }}
          >
            Skip Setup
          </Button>
        </Center>
      )}
    </Box>
  );
};

export default SetupWizard;
