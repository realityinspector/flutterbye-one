import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Icon,
  Avatar,
  FormControl,
  Input,
  Divider,
  Switch,
  ScrollView,
  useToast,
  Pressable,
  Modal,
  AlertDialog,
} from 'native-base';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';

const ProfileScreen = () => {
  const { user, logout, update, isLoading } = useAuth();
  const navigation = useNavigation();
  const toast = useToast();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmLogoutOpen, setIsConfirmLogoutOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    companyName: user?.companyName || '',
  });
  
  const [preferences, setPreferences] = useState({
    notifications: true,
    calendarIntegration: true,
    darkMode: false,
  });
  
  const cancelRef = React.useRef(null);
  
  const handleUpdateProfile = async () => {
    if (!formData.fullName || !formData.email) {
      toast.show({
        title: "Missing fields",
        description: "Please complete all required fields",
        status: "warning",
      });
      return;
    }
    
    try {
      await update({
        fullName: formData.fullName,
        email: formData.email,
        companyName: formData.companyName,
      });
      
      toast.show({
        title: "Profile updated",
        status: "success",
      });
      
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      
      toast.show({
        title: "Update failed",
        description: "Could not update profile",
        status: "error",
      });
    }
  };
  
  const handleLogout = async () => {
    try {
      await logout();
      
      // Navigation will be handled by the main router
    } catch (error) {
      console.error("Error logging out:", error);
      
      toast.show({
        title: "Logout failed",
        description: "Please try again",
        status: "error",
      });
    }
  };
  
  if (!user) {
    return null;
  }
  
  return (
    <Box flex={1} bg="white" safeArea>
      <ScrollView>
        {/* Header */}
        <VStack space={4} alignItems="center" px={4} pt={8} pb={6}>
          <Avatar
            bg="primary.500"
            size="xl"
            source={null}
          >
            {user.fullName?.charAt(0) || "U"}
          </Avatar>
          
          <VStack alignItems="center" space={1}>
            <Heading size="lg">{user.fullName}</Heading>
            <Text color="gray.500">{user.email}</Text>
            
            {user.role === 'admin' && (
              <Badge colorScheme="primary" mt={1}>Admin</Badge>
            )}
          </VStack>
          
          {!isEditing && (
            <Button
              leftIcon={<Icon as={Feather} name="edit-2" size="sm" />}
              variant="outline"
              onPress={() => setIsEditing(true)}
              mt={2}
            >
              Edit Profile
            </Button>
          )}
        </VStack>
        
        <Divider />
        
        {/* Profile form (edit mode) */}
        {isEditing ? (
          <VStack space={4} px={4} py={6}>
            <Heading size="md">Edit Profile</Heading>
            
            <FormControl isRequired>
              <FormControl.Label>Full Name</FormControl.Label>
              <Input
                value={formData.fullName}
                onChangeText={value => setFormData({ ...formData, fullName: value })}
                placeholder="Your full name"
              />
            </FormControl>
            
            <FormControl isRequired>
              <FormControl.Label>Email</FormControl.Label>
              <Input
                value={formData.email}
                onChangeText={value => setFormData({ ...formData, email: value })}
                placeholder="Your email address"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </FormControl>
            
            <FormControl>
              <FormControl.Label>Company</FormControl.Label>
              <Input
                value={formData.companyName}
                onChangeText={value => setFormData({ ...formData, companyName: value })}
                placeholder="Your company name"
              />
            </FormControl>
            
            <HStack space={2} mt={4}>
              <Button
                flex={1}
                variant="outline"
                onPress={() => setIsEditing(false)}
              >
                Cancel
              </Button>
              
              <Button
                flex={1}
                colorScheme="primary"
                isLoading={isLoading}
                onPress={handleUpdateProfile}
              >
                Save Changes
              </Button>
            </HStack>
          </VStack>
        ) : (
          <>
            {/* Profile info (view mode) */}
            <VStack space={4} px={4} py={6}>
              <Heading size="md">Account Information</Heading>
              
              <VStack space={3}>
                <HStack justifyContent="space-between">
                  <Text color="gray.500">Username</Text>
                  <Text fontWeight="medium">{user.username}</Text>
                </HStack>
                
                <HStack justifyContent="space-between">
                  <Text color="gray.500">Full Name</Text>
                  <Text fontWeight="medium">{user.fullName}</Text>
                </HStack>
                
                <HStack justifyContent="space-between">
                  <Text color="gray.500">Email</Text>
                  <Text fontWeight="medium">{user.email}</Text>
                </HStack>
                
                <HStack justifyContent="space-between">
                  <Text color="gray.500">Company</Text>
                  <Text fontWeight="medium">{user.companyName || "Not specified"}</Text>
                </HStack>
                
                <HStack justifyContent="space-between">
                  <Text color="gray.500">Role</Text>
                  <Text fontWeight="medium" textTransform="capitalize">{user.role}</Text>
                </HStack>
              </VStack>
            </VStack>
            
            <Divider />
            
            {/* App preferences */}
            <VStack space={4} px={4} py={6}>
              <Heading size="md">Preferences</Heading>
              
              <FormControl>
                <HStack alignItems="center" justifyContent="space-between">
                  <FormControl.Label>Push Notifications</FormControl.Label>
                  <Switch
                    isChecked={preferences.notifications}
                    onToggle={() => setPreferences({
                      ...preferences,
                      notifications: !preferences.notifications
                    })}
                    colorScheme="primary"
                  />
                </HStack>
              </FormControl>
              
              <FormControl>
                <HStack alignItems="center" justifyContent="space-between">
                  <FormControl.Label>Calendar Integration</FormControl.Label>
                  <Switch
                    isChecked={preferences.calendarIntegration}
                    onToggle={() => setPreferences({
                      ...preferences,
                      calendarIntegration: !preferences.calendarIntegration
                    })}
                    colorScheme="primary"
                  />
                </HStack>
              </FormControl>
              
              <FormControl>
                <HStack alignItems="center" justifyContent="space-between">
                  <FormControl.Label>Dark Mode</FormControl.Label>
                  <Switch
                    isChecked={preferences.darkMode}
                    onToggle={() => setPreferences({
                      ...preferences,
                      darkMode: !preferences.darkMode
                    })}
                    colorScheme="primary"
                  />
                </HStack>
              </FormControl>
            </VStack>
            
            <Divider />
            
            {/* App actions */}
            <VStack space={4} px={4} py={6}>
              <Heading size="md">Activity</Heading>
              
              <Pressable
                onPress={() => navigation.navigate('Calls' as never)}
                bg="gray.50"
                p={3}
                rounded="md"
              >
                <HStack alignItems="center" justifyContent="space-between">
                  <HStack space={3} alignItems="center">
                    <Icon as={Feather} name="phone" size="sm" color="primary.500" />
                    <Text>Call History</Text>
                  </HStack>
                  <Icon as={Feather} name="chevron-right" size="sm" color="gray.400" />
                </HStack>
              </Pressable>
              
              <Pressable
                onPress={() => {}}
                bg="gray.50"
                p={3}
                rounded="md"
              >
                <HStack alignItems="center" justifyContent="space-between">
                  <HStack space={3} alignItems="center">
                    <Icon as={Feather} name="help-circle" size="sm" color="primary.500" />
                    <Text>Help & Support</Text>
                  </HStack>
                  <Icon as={Feather} name="chevron-right" size="sm" color="gray.400" />
                </HStack>
              </Pressable>
              
              <Pressable
                onPress={() => {}}
                bg="gray.50"
                p={3}
                rounded="md"
              >
                <HStack alignItems="center" justifyContent="space-between">
                  <HStack space={3} alignItems="center">
                    <Icon as={Feather} name="info" size="sm" color="primary.500" />
                    <Text>About WALK&TALK</Text>
                  </HStack>
                  <Icon as={Feather} name="chevron-right" size="sm" color="gray.400" />
                </HStack>
              </Pressable>
            </VStack>
            
            <Box px={4} py={6}>
              <Button
                colorScheme="error"
                variant="outline"
                leftIcon={<Icon as={Feather} name="log-out" size="sm" />}
                onPress={() => setIsConfirmLogoutOpen(true)}
              >
                Log Out
              </Button>
            </Box>
          </>
        )}
      </ScrollView>
      
      {/* Logout confirmation dialog */}
      <AlertDialog
        leastDestructiveRef={cancelRef}
        isOpen={isConfirmLogoutOpen}
        onClose={() => setIsConfirmLogoutOpen(false)}
      >
        <AlertDialog.Content>
          <AlertDialog.CloseButton />
          <AlertDialog.Header>Log Out</AlertDialog.Header>
          <AlertDialog.Body>
            Are you sure you want to log out of your account?
          </AlertDialog.Body>
          <AlertDialog.Footer>
            <Button.Group space={2}>
              <Button
                variant="unstyled"
                colorScheme="coolGray"
                onPress={() => setIsConfirmLogoutOpen(false)}
                ref={cancelRef}
              >
                Cancel
              </Button>
              <Button
                colorScheme="danger"
                onPress={handleLogout}
                isLoading={isLoading}
              >
                Log Out
              </Button>
            </Button.Group>
          </AlertDialog.Footer>
        </AlertDialog.Content>
      </AlertDialog>
    </Box>
  );
};

export default ProfileScreen;
