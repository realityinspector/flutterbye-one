import React, { useState, useEffect } from 'react';
import {
  Box,
  ScrollView,
  Heading,
  Text,
  VStack,
  HStack,
  FormControl,
  Input,
  Button,
  useToast,
  Icon,
  Center,
  Avatar,
  Divider,
  Pressable,
  Badge,
  Modal,
} from 'native-base';
import Feather from 'react-native-vector-icons/Feather';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../hooks/useAuth';
import { useOrganizations } from '../../hooks/useOrganizations';
import Footer from '../../components/Footer';

const ProfileScreen = () => {
  const { user, update, logout } = useAuth();
  const toast = useToast();
  const navigation = useNavigation();
  const { organizations, fetchOrganizations, isLoading: orgsLoading } = useOrganizations();
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    companyName: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Load organizations when component mounts
  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  // Load user data into form
  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        email: user.email || '',
        companyName: user.companyName || '',
      });
    }
  }, [user]);

  // Handle form submission
  const handleSubmit = async () => {
    if (!formData.fullName) {
      toast.show({
        title: "Name required",
        description: "Please enter your full name",
        status: "warning",
      });
      return;
    }

    if (!formData.email) {
      toast.show({
        title: "Email required",
        description: "Please enter your email address",
        status: "warning",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await update(formData);
      toast.show({
        title: "Profile updated",
        status: "success",
      });
    } catch (error) {
      console.error('Update error:', error);
      toast.show({
        title: "Update failed",
        description: error.message || "Couldn't update profile",
        status: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user?.fullName) return '?';
    return user.fullName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <Box flex={1} bg="gray.50">
      <VStack flex={1}>
        <Box flex={1} bg="white" safeArea>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Profile header */}
            <Center py={6}>
              <Avatar 
                bg="primary.500" 
                size="xl" 
                _text={{ fontSize: "2xl" }}
              >
                {getUserInitials()}
              </Avatar>
              <Text mt={2} fontSize="lg" fontWeight="bold">
                {user?.fullName}
              </Text>
              <Text color="gray.500">
                {user?.role === 'admin' ? 'Administrator' : 'Sales Representative'}
              </Text>
            </Center>

            <Divider />

            {/* Profile form */}
            <Box p={4}>
              <Heading mb={6} size="md">Your Profile</Heading>
              
              <VStack space={4}>
                <FormControl>
                  <FormControl.Label>Full Name</FormControl.Label>
                  <Input
                    leftElement={
                      <Icon as={Feather} name="user" size={5} color="gray.400" ml={2} />
                    }
                    value={formData.fullName}
                    onChangeText={(value) => setFormData({ ...formData, fullName: value })}
                    placeholder="Your full name"
                  />
                </FormControl>

                <FormControl>
                  <FormControl.Label>Email</FormControl.Label>
                  <Input
                    leftElement={
                      <Icon as={Feather} name="mail" size={5} color="gray.400" ml={2} />
                    }
                    value={formData.email}
                    onChangeText={(value) => setFormData({ ...formData, email: value })}
                    placeholder="Your email address"
                    keyboardType="email-address"
                  />
                </FormControl>

                <FormControl>
                  <FormControl.Label>Company</FormControl.Label>
                  <Input
                    leftElement={
                      <Icon as={Feather} name="briefcase" size={5} color="gray.400" ml={2} />
                    }
                    value={formData.companyName}
                    onChangeText={(value) => setFormData({ ...formData, companyName: value })}
                    placeholder="Your company name"
                  />
                </FormControl>

                <Button
                  mt={4}
                  onPress={handleSubmit}
                  isLoading={isSubmitting}
                  colorScheme="primary"
                >
                  Save Changes
                </Button>
              </VStack>
            </Box>

            <Divider my={6} />

            {/* Teams section */}
            <Box p={4}>
              <Heading mb={6} size="md">Teams</Heading>
              
              <VStack space={4}>
                <Pressable 
                  onPress={() => navigation.navigate('Organizations')}
                >
                  <HStack alignItems="center" justifyContent="space-between" py={2}>
                    <HStack space={3} alignItems="center">
                      <Icon as={MaterialIcons} name="people" size={5} color="primary.500" />
                      <VStack>
                        <Text fontSize="md">Manage Teams</Text>
                        <Text fontSize="xs" color="gray.500">
                          {orgsLoading 
                            ? "Loading your teams..." 
                            : `${organizations.length} team${organizations.length !== 1 ? 's' : ''} available`
                          }
                        </Text>
                      </VStack>
                    </HStack>
                    <Icon as={Feather} name="chevron-right" size={5} color="primary.400" />
                  </HStack>
                </Pressable>
                
                {/* Quick team access - shows up to 2 recent teams */}
                {!orgsLoading && organizations.length > 0 && (
                  <VStack space={2} mt={2} ml={8}>
                    {organizations.slice(0, 2).map(org => (
                      <Pressable 
                        key={org.id}
                        onPress={() => navigation.navigate('OrganizationDetails', { orgId: org.id })}
                      >
                        <HStack 
                          bg="coolGray.50" 
                          p={3} 
                          rounded="md" 
                          alignItems="center" 
                          justifyContent="space-between"
                        >
                          <HStack space={2} alignItems="center">
                            <Text fontSize="sm" fontWeight="medium">{org.name}</Text>
                            <Badge colorScheme="primary" variant="subtle" rounded="full">
                              <Text fontSize="2xs">
                                {org.members?.length || 0} member{(org.members?.length || 0) !== 1 ? 's' : ''}
                              </Text>
                            </Badge>
                          </HStack>
                          <Icon as={Feather} name="chevron-right" size={4} color="coolGray.400" />
                        </HStack>
                      </Pressable>
                    ))}
                    
                    {organizations.length > 2 && (
                      <Text fontSize="xs" color="primary.500" ml={2} mt={1}>
                        + {organizations.length - 2} more teams
                      </Text>
                    )}
                  </VStack>
                )}
                
                <Pressable 
                  onPress={() => {
                    setShowCreateModal(true);
                    navigation.navigate('Organizations');
                  }}
                  mt={2}
                >
                  <HStack 
                    alignItems="center" 
                    justifyContent="flex-start" 
                    bg="primary.50" 
                    p={3} 
                    rounded="md"
                  >
                    <Icon as={MaterialIcons} name="add-circle" size={5} color="primary.500" mr={2} />
                    <Text color="primary.600" fontSize="sm">Create New Team</Text>
                  </HStack>
                </Pressable>
              </VStack>
            </Box>
            
            <Divider my={6} />
            
            {/* Account section */}
            <Box p={4}>
              <Heading mb={6} size="md">Account</Heading>
              
              <VStack space={4}>
                <HStack alignItems="center" justifyContent="space-between">
                  <HStack space={3} alignItems="center">
                    <Icon as={Feather} name="shield" size={5} color="gray.500" />
                    <Text fontSize="md">Change Password</Text>
                  </HStack>
                  <Icon as={Feather} name="chevron-right" size={5} color="gray.400" />
                </HStack>

                <HStack alignItems="center" justifyContent="space-between">
                  <HStack space={3} alignItems="center">
                    <Icon as={Feather} name="bell" size={5} color="gray.500" />
                    <Text fontSize="md">Notification Settings</Text>
                  </HStack>
                  <Icon as={Feather} name="chevron-right" size={5} color="gray.400" />
                </HStack>

                <Button
                  mt={4}
                  variant="outline"
                  colorScheme="error"
                  leftIcon={<Icon as={Feather} name="log-out" size={5} />}
                  onPress={handleLogout}
                >
                  Log Out
                </Button>
              </VStack>
            </Box>

            {/* App info */}
            <Center py={8}>
              <Text color="gray.400">FLUTTERBYE CRM</Text>
              <Text color="gray.400" fontSize="xs">Version 1.0.0</Text>
            </Center>
          </ScrollView>
        </Box>
        <Footer />
        
        {/* Create Organization Modal */}
        <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)}>
          <Modal.Content maxW="400px">
            <Modal.CloseButton />
            <Modal.Header>Create New Team</Modal.Header>
            <Modal.Body>
              <FormControl isRequired>
                <FormControl.Label>Team Name</FormControl.Label>
                <Input 
                  placeholder="Enter team name" 
                />
              </FormControl>
              
              <FormControl mt={4}>
                <FormControl.Label>Description</FormControl.Label>
                <Input 
                  placeholder="Enter team description (optional)" 
                />
              </FormControl>
            </Modal.Body>
            <Modal.Footer>
              <Button.Group space={2}>
                <Button 
                  variant="ghost" 
                  colorScheme="blueGray" 
                  onPress={() => setShowCreateModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  onPress={() => {
                    setShowCreateModal(false);
                    navigation.navigate('Organizations');
                    toast.show({
                      title: "Redirecting to Teams",
                      description: "Complete team creation there",
                      status: "info"
                    });
                  }}
                >
                  Continue to Teams
                </Button>
              </Button.Group>
            </Modal.Footer>
          </Modal.Content>
        </Modal>
      </VStack>
    </Box>
  );
};

export default ProfileScreen;