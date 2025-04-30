import React, { useState } from 'react';
import {
  VStack,
  FormControl,
  Input,
  TextArea,
  Switch,
  HStack,
  Text,
  Button,
  Icon,
  Box,
  Divider,
  useToast,
} from 'native-base';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';

type AdminSetupFormProps = {
  onComplete: () => void;
};

const AdminSetupForm = ({ onComplete }: AdminSetupFormProps) => {
  const { user, update } = useAuth();
  const toast = useToast();
  
  const [formData, setFormData] = useState({
    companyName: user?.companyName || '',
    adminEmail: user?.email || '',
    enableAILeadGeneration: true,
    leadGenSettings: {
      defaultIndustry: '',
      defaultLocation: '',
      searchRadius: '50',
    },
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async () => {
    if (!formData.companyName) {
      toast.show({
        title: "Company name required",
        description: "Please enter your company name",
        status: "warning",
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // First update the user's profile
      await update({
        companyName: formData.companyName,
        hasCompletedSetup: true,
      });
      
      // Then complete the admin setup via API
      await fetch('/api/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyName: formData.companyName,
          adminEmail: formData.adminEmail,
          leadGenerationSettings: {
            enabled: formData.enableAILeadGeneration,
            defaultIndustry: formData.leadGenSettings.defaultIndustry,
            defaultLocation: formData.leadGenSettings.defaultLocation,
            searchRadius: parseInt(formData.leadGenSettings.searchRadius) || 50,
          },
        }),
      });
      
      toast.show({
        title: "Setup complete",
        description: "Your WALK&TALK system is ready to use",
        status: "success",
      });
      
      onComplete();
    } catch (error) {
      console.error("Error during admin setup:", error);
      
      toast.show({
        title: "Setup failed",
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
          <Icon as={Feather} name="alert-circle" size="sm" color="primary.600" />
          <Text color="primary.700" fontWeight="medium">
            Welcome, Admin! Complete this initial setup to configure your WALK&TALK system.
          </Text>
        </HStack>
      </Box>
      
      <FormControl isRequired>
        <FormControl.Label>Company Name</FormControl.Label>
        <Input
          placeholder="Enter your company name"
          value={formData.companyName}
          onChangeText={value => setFormData({ ...formData, companyName: value })}
        />
        <FormControl.HelperText>
          This will be used throughout the app
        </FormControl.HelperText>
      </FormControl>
      
      <FormControl isRequired>
        <FormControl.Label>Admin Email</FormControl.Label>
        <Input
          placeholder="Enter admin email address"
          value={formData.adminEmail}
          onChangeText={value => setFormData({ ...formData, adminEmail: value })}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <FormControl.HelperText>
          For system notifications and support
        </FormControl.HelperText>
      </FormControl>
      
      <Divider />
      
      <VStack space={3}>
        <FormControl>
          <FormControl.Label>AI Lead Generation</FormControl.Label>
          <HStack alignItems="center" justifyContent="space-between">
            <Text>Enable AI-powered lead generation</Text>
            <Switch
              isChecked={formData.enableAILeadGeneration}
              onToggle={() => 
                setFormData({ 
                  ...formData, 
                  enableAILeadGeneration: !formData.enableAILeadGeneration 
                })
              }
              colorScheme="primary"
            />
          </HStack>
          <FormControl.HelperText>
            Allow users to generate leads using AI
          </FormControl.HelperText>
        </FormControl>
        
        {formData.enableAILeadGeneration && (
          <VStack space={3} ml={2} mt={2} pl={3} borderLeftWidth={2} borderLeftColor="primary.200">
            <FormControl>
              <FormControl.Label>Default Industry</FormControl.Label>
              <Input
                placeholder="e.g., Technology, Healthcare"
                value={formData.leadGenSettings.defaultIndustry}
                onChangeText={value => 
                  setFormData({ 
                    ...formData, 
                    leadGenSettings: {
                      ...formData.leadGenSettings,
                      defaultIndustry: value
                    }
                  })
                }
              />
            </FormControl>
            
            <FormControl>
              <FormControl.Label>Default Location</FormControl.Label>
              <Input
                placeholder="e.g., New York, NY"
                value={formData.leadGenSettings.defaultLocation}
                onChangeText={value => 
                  setFormData({ 
                    ...formData, 
                    leadGenSettings: {
                      ...formData.leadGenSettings,
                      defaultLocation: value
                    }
                  })
                }
              />
            </FormControl>
            
            <FormControl>
              <FormControl.Label>Search Radius (miles)</FormControl.Label>
              <Input
                placeholder="50"
                value={formData.leadGenSettings.searchRadius}
                onChangeText={value => 
                  setFormData({ 
                    ...formData, 
                    leadGenSettings: {
                      ...formData.leadGenSettings,
                      searchRadius: value
                    }
                  })
                }
                keyboardType="number-pad"
              />
            </FormControl>
          </VStack>
        )}
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

export default AdminSetupForm;
