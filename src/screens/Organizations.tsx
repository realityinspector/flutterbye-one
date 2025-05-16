import React, { useEffect, useState } from 'react';
import { 
  Box, 
  FlatList, 
  Heading, 
  VStack, 
  HStack, 
  Text, 
  Button, 
  Icon, 
  Divider, 
  Pressable,
  Modal,
  FormControl,
  Input,
  TextArea,
  useToast
} from 'native-base';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useOrganizations, OrganizationWithMembers } from '../hooks/useOrganizations';
import { useAuth } from '../hooks/useAuth';
import { SyntheticEvent } from 'react';

/**
 * Organizations screen component
 * Shows the list of organizations and allows creating new ones
 */
const OrganizationsScreen = () => {
  const { organizations, isLoading, fetchOrganizations, createOrganization, updateOrganization } = useOrganizations();
  const { user } = useAuth();
  const navigation = useNavigation();
  const toast = useToast();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgDescription, setNewOrgDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Load organizations on component mount
  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);
  
  // Handle organization creation
  const handleCreateOrg = async () => {
    if (!newOrgName.trim()) {
      toast.show({
        title: "Organization name is required",
        status: "warning",
        placement: "top"
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      await createOrganization({
        name: newOrgName.trim(),
        description: newOrgDescription.trim() || undefined
      });
      
      setShowCreateModal(false);
      setNewOrgName('');
      setNewOrgDescription('');
      
      toast.show({
        title: "Organization created successfully",
        status: "success",
        placement: "top"
      });
    } catch (error) {
      console.error('Error creating organization:', error);
      toast.show({
        title: "Failed to create organization",
        description: error instanceof Error ? error.message : "Please try again",
        status: "error",
        placement: "top"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Navigate to organization details
  const handleViewOrg = (orgId: number) => {
    // @ts-ignore - navigation typing issue
    navigation.navigate('OrganizationDetails', { orgId });
  };
  
  // State for quick edit organization name functionality
  const [quickEditOrgId, setQuickEditOrgId] = useState<number | null>(null);
  const [quickEditName, setQuickEditName] = useState('');
  
  // Handle quick name update
  const handleQuickNameUpdate = async (orgId: number) => {
    if (!quickEditName.trim()) {
      toast.show({
        title: "Organization name is required",
        status: "warning",
        placement: "top"
      });
      return;
    }
    
    try {
      await updateOrganization(orgId, {
        name: quickEditName.trim()
      });
      
      setQuickEditOrgId(null);
      
      toast.show({
        title: "Organization name updated",
        status: "success",
        placement: "top"
      });
    } catch (error) {
      console.error('Error updating organization name:', error);
      toast.show({
        title: "Failed to update name",
        status: "error",
        placement: "top"
      });
    }
  };

  // Render individual organization card
  const renderOrganizationCard = ({ item }: { item: OrganizationWithMembers }) => {
    const isOwner = item.createdBy === user?.id;
    const isAdmin = item.userRole === 'admin';
    const isEditing = quickEditOrgId === item.id;
    
    // Set up edit mode
    const startEditing = (e: SyntheticEvent) => {
      e.stopPropagation();
      setQuickEditOrgId(item.id);
      setQuickEditName(item.name);
    };
    
    return (
      <Pressable 
        mb={4} 
        onPress={() => handleViewOrg(item.id)}
        _pressed={{ opacity: 0.7 }}
      >
        <Box 
          p={4}
          bg="white"
          rounded="lg"
          shadow={1}
          borderWidth={1}
          borderColor="coolGray.200"
        >
          <HStack justifyContent="space-between" alignItems="center">
            <VStack flex={1} mr={2}>
              {isEditing ? (
                <HStack space={2} alignItems="center">
                  <Input 
                    value={quickEditName}
                    onChangeText={setQuickEditName}
                    flex={1}
                    autoFocus
                    fontSize="md"
                    onSubmitEditing={() => handleQuickNameUpdate(item.id)}
                    returnKeyType="done"
                  />
                  <Button 
                    size="sm" 
                    onPress={(e) => {
                      e.stopPropagation();
                      handleQuickNameUpdate(item.id);
                    }}
                    colorScheme="primary"
                  >
                    Save
                  </Button>
                </HStack>
              ) : (
                <HStack alignItems="center" space={2}>
                  <Heading size="md" flex={1}>{item.name}</Heading>
                  {isOwner && (
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onPress={startEditing}
                      p={1}
                      _pressed={{ bg: "coolGray.100" }}
                    >
                      <Icon as={Ionicons} name="pencil-outline" size="sm" color="coolGray.500" />
                    </Button>
                  )}
                </HStack>
              )}
              {item.description && !isEditing && (
                <Text fontSize="sm" color="coolGray.600" mt={1} numberOfLines={2}>
                  {item.description}
                </Text>
              )}
            </VStack>
            <Text 
              fontSize="xs" 
              px={2} 
              py={1} 
              rounded="full" 
              bg={isAdmin ? "blue.100" : "coolGray.100"}
              color={isAdmin ? "blue.800" : "coolGray.800"}
            >
              {isAdmin ? "Admin" : "Member"}
            </Text>
          </HStack>
          
          <Divider my={2} />
          
          <HStack justifyContent="space-between" alignItems="center">
            <Text fontSize="xs" color="coolGray.600">
              Created: {new Date(item.createdAt).toLocaleDateString()}
            </Text>
            <HStack space={2} alignItems="center">
              <Icon as={Ionicons} name="people-outline" size="sm" color="coolGray.600" />
              <Text fontSize="xs" color="coolGray.600">
                {item.members?.length || 0} members
              </Text>
            </HStack>
          </HStack>
        </Box>
      </Pressable>
    );
  };
  
  // Render organization creation modal
  const renderCreateOrgModal = () => (
    <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)}>
      <Modal.Content maxW="400px">
        <Modal.CloseButton />
        <Modal.Header>Create New Organization</Modal.Header>
        <Modal.Body>
          <FormControl isRequired>
            <FormControl.Label>Organization Name</FormControl.Label>
            <Input
              value={newOrgName}
              onChangeText={setNewOrgName}
              placeholder="Enter organization name"
            />
          </FormControl>
          <FormControl mt={3}>
            <FormControl.Label>Description (Optional)</FormControl.Label>
            <TextArea
              value={newOrgDescription}
              onChangeText={setNewOrgDescription}
              placeholder="Enter organization description"
              autoCompleteType={undefined}
            />
          </FormControl>
        </Modal.Body>
        <Modal.Footer>
          <Button.Group space={2}>
            <Button 
              variant="ghost" 
              onPress={() => setShowCreateModal(false)}
              isDisabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onPress={handleCreateOrg}
              isLoading={isSubmitting}
              isDisabled={isSubmitting || !newOrgName.trim()}
            >
              Create
            </Button>
          </Button.Group>
        </Modal.Footer>
      </Modal.Content>
    </Modal>
  );
  
  return (
    <Box flex={1} bg="coolGray.50" px={4} pt={4}>
      <HStack justifyContent="space-between" alignItems="center" mb={4}>
        <Heading size="lg">Organizations</Heading>
        <Button 
          leftIcon={<Icon as={Ionicons} name="add" size="sm" />}
          onPress={() => setShowCreateModal(true)}
        >
          Create
        </Button>
      </HStack>
      
      <FlatList
        data={organizations}
        keyExtractor={item => item.id.toString()}
        renderItem={renderOrganizationCard}
        refreshing={isLoading}
        onRefresh={fetchOrganizations}
        ListEmptyComponent={
          <Box 
            py={10} 
            alignItems="center" 
            justifyContent="center"
            bg="white"
            rounded="lg"
            shadow={1}
          >
            <Icon as={Ionicons} name="people" size="4xl" color="coolGray.300" />
            <Text fontSize="lg" color="coolGray.500" mt={4}>
              No organizations yet
            </Text>
            <Text fontSize="sm" color="coolGray.400" textAlign="center" px={4}>
              Create an organization to share leads with your team
            </Text>
            <Button 
              mt={6}
              leftIcon={<Icon as={Ionicons} name="add" size="sm" />}
              onPress={() => setShowCreateModal(true)}
            >
              Create Organization
            </Button>
          </Box>
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      />
      
      {renderCreateOrgModal()}
    </Box>
  );
};

export default OrganizationsScreen;