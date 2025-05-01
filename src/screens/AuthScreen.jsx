import React, { useState } from 'react';
import {
  Box,
  Center,
  VStack,
  Heading,
  Text,
  FormControl,
  Input,
  Button,
  HStack,
  Pressable,
  Icon,
  useToast,
  KeyboardAvoidingView,
  Divider,
} from 'native-base';
import { Platform } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useAuth } from '../hooks/useAuth';

const AuthScreen = () => {
  const { login, register, isAuthLoading } = useAuth();
  const toast = useToast();
  
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    fullName: '',
  });

  // Handle input changes
  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Toggle between login and register modes
  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    // Reset form data on mode switch
    setFormData({
      username: '',
      password: '',
      email: '',
      fullName: '',
    });
  };

  // Toggle password visibility
  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  // Validate form input
  const validateForm = () => {
    if (!formData.username) {
      toast.show({
        title: "Username required",
        status: "warning",
      });
      return false;
    }
    
    if (!formData.password) {
      toast.show({
        title: "Password required",
        status: "warning",
      });
      return false;
    }
    
    if (mode === 'register') {
      if (!formData.email) {
        toast.show({
          title: "Email required",
          status: "warning",
        });
        return false;
      }
      
      if (!formData.fullName) {
        toast.show({
          title: "Full name required",
          status: "warning",
        });
        return false;
      }
    }
    
    return true;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      if (mode === 'login') {
        await login(formData.username, formData.password);
      } else {
        await register(formData);
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast.show({
        title: mode === 'login' ? "Login failed" : "Registration failed",
        description: error.message || "Please check your credentials and try again",
        status: "error",
      });
    }
  };

  return (
    <KeyboardAvoidingView
      flex={1}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Box flex={1} bg="white" safeArea>
        <Center flex={1} p={8}>
          <VStack space={6} w="100%">
            {/* Logo placeholder */}
            <Center>
              <Box w={20} h={20} bg="primary.100" rounded="full" mb={4} />
              {/* Replace with your app logo */}
              <Heading size="xl" color="primary.600" mb={1}>Walk N Talk CRM</Heading>
              <Text color="gray.500" textAlign="center">
                {mode === 'login' ? 'Sign in to your account' : 'Create a new account'}
              </Text>
            </Center>
            
            <VStack space={4} mt={4}>
              {/* Registration form fields */}
              {mode === 'register' && (
                <>
                  <FormControl isRequired>
                    <FormControl.Label>Full Name</FormControl.Label>
                    <Input
                      leftElement={
                        <Icon as={Feather} name="user" size={5} color="gray.400" ml={2} />
                      }
                      placeholder="Enter your full name"
                      value={formData.fullName}
                      onChangeText={(value) => handleChange('fullName', value)}
                      autoCapitalize="words"
                    />
                  </FormControl>
                  
                  <FormControl isRequired>
                    <FormControl.Label>Email</FormControl.Label>
                    <Input
                      leftElement={
                        <Icon as={Feather} name="mail" size={5} color="gray.400" ml={2} />
                      }
                      placeholder="Enter your email"
                      value={formData.email}
                      onChangeText={(value) => handleChange('email', value)}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </FormControl>
                </>
              )}
              
              {/* Common form fields */}
              <FormControl isRequired>
                <FormControl.Label>Username</FormControl.Label>
                <Input
                  leftElement={
                    <Icon as={Feather} name="user" size={5} color="gray.400" ml={2} />
                  }
                  placeholder="Enter your username"
                  value={formData.username}
                  onChangeText={(value) => handleChange('username', value)}
                  autoCapitalize="none"
                />
              </FormControl>
              
              <FormControl isRequired>
                <FormControl.Label>Password</FormControl.Label>
                <Input
                  leftElement={
                    <Icon as={Feather} name="lock" size={5} color="gray.400" ml={2} />
                  }
                  rightElement={
                    <Pressable onPress={toggleShowPassword}>
                      <Icon
                        as={Feather}
                        name={showPassword ? "eye-off" : "eye"}
                        size={5}
                        color="gray.400"
                        mr={2}
                      />
                    </Pressable>
                  }
                  placeholder="Enter your password"
                  value={formData.password}
                  onChangeText={(value) => handleChange('password', value)}
                  type={showPassword ? "text" : "password"}
                />
              </FormControl>
              
              {mode === 'login' && (
                <Pressable alignSelf="flex-end">
                  <Text color="primary.500" fontSize="sm">
                    Forgot password?
                  </Text>
                </Pressable>
              )}
            </VStack>
            
            <Button
              mt={4}
              size="lg"
              isLoading={isAuthLoading}
              onPress={handleSubmit}
            >
              {mode === 'login' ? 'Sign In' : 'Sign Up'}
            </Button>
            
            <HStack mt={4} justifyContent="center" space={1}>
              <Text color="gray.500">
                {mode === 'login' ? "Don't have an account?" : "Already have an account?"}
              </Text>
              <Pressable onPress={toggleMode}>
                <Text color="primary.500" fontWeight="medium">
                  {mode === 'login' ? 'Sign Up' : 'Sign In'}
                </Text>
              </Pressable>
            </HStack>
            
            {/* Demo account section */}
            <VStack space={4} mt={4}>
              <HStack alignItems="center" space={2}>
                <Divider flex={1} bg="gray.200" />
                <Text color="gray.400">or</Text>
                <Divider flex={1} bg="gray.200" />
              </HStack>
              
              <Button
                variant="outline"
                leftIcon={<Icon as={Feather} name="zap" size={5} color="primary.500" />}
                onPress={() => {
                  setFormData({
                    username: 'demo',
                    password: 'password',
                    email: '',
                    fullName: '',
                  });
                  setMode('login');
                }}
              >
                Demo Login
              </Button>
            </VStack>
          </VStack>
        </Center>
      </Box>
    </KeyboardAvoidingView>
  );
};

export default AuthScreen;