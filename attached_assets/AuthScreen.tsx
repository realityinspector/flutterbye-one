import React, { useState } from 'react';
import {
  Box,
  Text,
  Heading,
  VStack,
  FormControl,
  Input,
  Button,
  HStack,
  Center,
  Pressable,
  Icon,
  ScrollView,
  useColorModeValue,
  IconButton,
  Image,
} from 'native-base';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { KeyboardAvoidingView, Platform } from 'react-native';

const AuthScreen = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    fullName: '',
    companyName: '',
  });
  const { login, register, isLoading } = useAuth();
  
  const handleToggleMode = () => {
    setIsLogin(!isLogin);
  };
  
  const handleSubmit = async () => {
    try {
      if (isLogin) {
        await login({
          username: formData.username,
          password: formData.password,
        });
      } else {
        await register({
          username: formData.username,
          password: formData.password,
          email: formData.email,
          fullName: formData.fullName,
          companyName: formData.companyName || undefined,
        });
      }
    } catch (error) {
      console.error('Auth error:', error);
    }
  };
  
  const bgColor = useColorModeValue('white', 'gray.900');
  const textColor = useColorModeValue('gray.800', 'gray.100');
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1 }} 
        bg="primary.500"
      >
        <Box flex={1} safeArea>
          <Center mt={10} mb={6}>
            <Heading size="xl" color="white" fontWeight="bold">
              WALK&TALK
            </Heading>
            <Text color="white" fontSize="lg">
              Your on-the-go sales companion
            </Text>
          </Center>
          
          <Box
            mx={4}
            p={6}
            rounded="xl"
            bg={bgColor}
            shadow={5}
            flex={1}
          >
            <VStack space={4}>
              <Heading
                color="primary.500"
                size="lg"
                fontWeight="bold"
                textAlign="center"
              >
                {isLogin ? 'Welcome Back' : 'Create Account'}
              </Heading>
              
              <FormControl isRequired>
                <FormControl.Label>Username</FormControl.Label>
                <Input
                  placeholder="Username"
                  value={formData.username}
                  onChangeText={(value) => setFormData({ ...formData, username: value })}
                  InputLeftElement={
                    <Icon as={Feather} name="user" size={5} ml={2} color="gray.400" />
                  }
                />
              </FormControl>
              
              <FormControl isRequired>
                <FormControl.Label>Password</FormControl.Label>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={formData.password}
                  onChangeText={(value) => setFormData({ ...formData, password: value })}
                  InputLeftElement={
                    <Icon as={Feather} name="lock" size={5} ml={2} color="gray.400" />
                  }
                  InputRightElement={
                    <IconButton
                      icon={<Icon as={Feather} name={showPassword ? 'eye-off' : 'eye'} />}
                      onPress={() => setShowPassword(!showPassword)}
                      variant="unstyled"
                      mr={1}
                    />
                  }
                />
              </FormControl>
              
              {!isLogin && (
                <>
                  <FormControl isRequired>
                    <FormControl.Label>Email</FormControl.Label>
                    <Input
                      placeholder="Email address"
                      value={formData.email}
                      onChangeText={(value) => setFormData({ ...formData, email: value })}
                      InputLeftElement={
                        <Icon as={Feather} name="mail" size={5} ml={2} color="gray.400" />
                      }
                    />
                  </FormControl>
                  
                  <FormControl isRequired>
                    <FormControl.Label>Full Name</FormControl.Label>
                    <Input
                      placeholder="Full name"
                      value={formData.fullName}
                      onChangeText={(value) => setFormData({ ...formData, fullName: value })}
                      InputLeftElement={
                        <Icon as={Feather} name="user-check" size={5} ml={2} color="gray.400" />
                      }
                    />
                  </FormControl>
                  
                  <FormControl>
                    <FormControl.Label>Company Name (Optional)</FormControl.Label>
                    <Input
                      placeholder="Company name"
                      value={formData.companyName}
                      onChangeText={(value) => setFormData({ ...formData, companyName: value })}
                      InputLeftElement={
                        <Icon as={Feather} name="briefcase" size={5} ml={2} color="gray.400" />
                      }
                    />
                  </FormControl>
                </>
              )}
              
              <Button
                colorScheme="primary"
                size="lg"
                mt={2}
                isLoading={isLoading}
                onPress={handleSubmit}
              >
                {isLogin ? 'Sign In' : 'Create Account'}
              </Button>
              
              <HStack justifyContent="center" mt={2}>
                <Text color={textColor}>
                  {isLogin ? "Don't have an account? " : 'Already have an account? '}
                </Text>
                <Pressable onPress={handleToggleMode}>
                  <Text color="primary.500" fontWeight="bold">
                    {isLogin ? 'Sign Up' : 'Sign In'}
                  </Text>
                </Pressable>
              </HStack>
            </VStack>
          </Box>
          
          <Center mt={4} mb={6}>
            <Text color="white" fontSize="sm">
              Accelerate your sales with AI-powered insights
            </Text>
          </Center>
        </Box>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default AuthScreen;
