import React, { useEffect, useState } from 'react';
import { 
  Box, 
  ScrollView,
  Heading, 
  VStack, 
  HStack, 
  Text, 
  Button, 
  Icon, 
  Divider, 
  Avatar,
  Badge,
  Spinner,
  IconButton,
  Menu,
  Pressable,
  Modal,
  FormControl,
  Input,
  Select,
  useToast
} from 'native-base';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useOrganizations, OrganizationWithMembers } from '../hooks/useOrganizations';
import { useAuth } from '../hooks/useAuth';

/**
 * Organization details screen
 * Shows details of a specific organization and allows managing members
 */
const OrganizationDetailsScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { 
    getOrganization, 
    updateOrganization, 
    deleteOrganization,
    addMember,
    updateMemberRole,
    removeMember,
    isLoading 
  } = useOrganizations();
  const { user } = useAuth();
  const toast = useToast();
  
  // @ts-ignore - routing typing issue
  const { orgId } = route.params;
  
  const [organization, setOrganization] = useState<OrganizationWithMembers | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [orgName, setOrgName] = useState('');
  const [orgDesc, setOrgDesc] = useState('');
  const [newMemberUsername, setNewMemberUsername] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('member');
  
  // Load organization data
  useEffect(() => {
    loadOrganizationData();
  }, [orgId]);
  
  // Set initial form values when organization data is loaded
  useEffect(() => {
    if (organization) {
      setOrgName(organization.name);
      setOrgDesc(organization.description || '');
      setIsAdmin(organization.userRole === 'admin');
    }
  }, [organization]);
  
  // Load organization details
  const loadOrganizationData = async () => {
    try {
      const data = await getOrganization(orgId);
      setOrganization(data);
    } catch (error) {
      console.error('Error loading organization:', error);
      toast.show({
        title: "Failed to load organization details",
        status: "error",
        placement: "top"
      });
      
      // Navigate back on error
      navigation.goBack();
    }
  };
  
  // Update organization
  const handleUpdateOrg = async () => {
    if (!orgName.trim()) {
      toast.show({
        title: "Organization name is required",
        status: "warning",
        placement: "top"
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      const updatedOrg = await updateOrganization(orgId, {
        name: orgName.trim(),
        description: orgDesc.trim() || undefined
      });
      
      setOrganization(prevState => ({
        ...prevState!,
        name: updatedOrg.name,
        description: updatedOrg.description
      }));
      
      setIsEditModalOpen(false);
      
      toast.show({
        title: "Organization updated successfully",
        status: "success",
        placement: "top"
      });
    } catch (error) {
      console.error('Error updating organization:', error);
      toast.show({
        title: "Failed to update organization",
        status: "error",
        placement: "top"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Delete organization
  const handleDeleteOrg = async () => {
    setIsSubmitting(true);
    try {
      await deleteOrganization(orgId);
      
      toast.show({
        title: "Organization deleted successfully",
        status: "success",
        placement: "top"
      });
      
      navigation.goBack();
    } catch (error) {
      console.error('Error deleting organization:', error);
      toast.show({
        title: "Failed to delete organization",
        status: "error",
        placement: "top"
      });
      setIsDeleteModalOpen(false);
      setIsSubmitting(false);
    }
  };
  
  // Add a new member
  const handleAddMember = async () => {
    if (!newMemberUsername.trim()) {
      toast.show({
        title: "Username is required",
        status: "warning",
        placement: "top"
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      const result = await addMember(orgId, {
        username: newMemberUsername.trim(),
        role: newMemberRole
      });
      
      // Refresh organization data
      loadOrganizationData();
      
      setIsAddMemberModalOpen(false);
      setNewMemberUsername('');
      setNewMemberRole('member');
      
      toast.show({
        title: "Member added successfully",
        status: "success",
        placement: "top"
      });
    } catch (error) {
      console.error('Error adding member:', error);
      toast.show({
        title: "Failed to add member",
        description: error instanceof Error ? error.message : "Please try again",
        status: "error",
        placement: "top"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Change member role
  const handleChangeMemberRole = async (memberId: number, role: string) => {
    try {
      await updateMemberRole(orgId, memberId, role);
      
      // Refresh data
      loadOrganizationData();
      
      toast.show({
        title: "Member role updated",
        status: "success",
        placement: "top"
      });
    } catch (error) {
      console.error('Error updating member role:', error);
      toast.show({
        title: "Failed to update member role",
        status: "error",
        placement: "top"
      });
    }
  };
  
  // Remove a member
  const handleRemoveMember = async (memberId: number) => {
    try {
      await removeMember(orgId, memberId);
      
      // Refresh data
      loadOrganizationData();
      
      toast.show({
        title: "Member removed from organization",
        status: "success",
        placement: "top"
      });
    } catch (error) {
      console.error('Error removing member:', error);
      toast.show({
        title: "Failed to remove member",
        description: error instanceof Error ? error.message : "Please try again",
        status: "error",
        placement: "top"
      });
    }
  };
  
  // Loading state
  if (!organization && isLoading) {
    return (
      <Box flex={1} justifyContent="center" alignItems="center">
        <Spinner size="lg" />
        <Text mt={4}>Loading organization details...</Text>
      </Box>
    );
  }
  
  // Error state
  if (!organization) {
    return (
      <Box flex={1} justifyContent="center" alignItems="center">
        <Icon as={MaterialIcons} name="error-outline" size="6xl" color="red.500" />
        <Text mt={4}>Failed to load organization</Text>
        <Button mt={4} onPress={() => navigation.goBack()}>Go Back</Button>
      </Box>
    );
  }
  
  // Render edit organization modal
  const renderEditOrgModal = () => (
    <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
      <Modal.Content maxW="400px">
        <Modal.CloseButton />
        <Modal.Header>Edit Organization</Modal.Header>
        <Modal.Body>
          <FormControl isRequired>
            <FormControl.Label>Organization Name</FormControl.Label>
            <Input
              value={orgName}
              onChangeText={setOrgName}
              placeholder="Enter organization name"
              autoFocus
              fontSize="md"
              borderColor="primary.400"
              _focus={{
                borderColor: "primary.500",
                backgroundColor: "coolGray.50",
              }}
            />
            <FormControl.HelperText>
              As organization owner, you can change the name at any time.
            </FormControl.HelperText>
          </FormControl>
          <FormControl mt={3}>
            <FormControl.Label>Description (Optional)</FormControl.Label>
            <Input
              value={orgDesc}
              onChangeText={setOrgDesc}
              placeholder="Enter organization description"
              multiline
              numberOfLines={3}
            />
          </FormControl>
        </Modal.Body>
        <Modal.Footer>
          <Button.Group space={2}>
            <Button 
              variant="ghost" 
              onPress={() => setIsEditModalOpen(false)}
              isDisabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onPress={handleUpdateOrg}
              isLoading={isSubmitting}
              isDisabled={isSubmitting || !orgName.trim()}
              colorScheme="primary"
              leftIcon={<Icon as={MaterialIcons} name="save" size="sm" />}
            >
              Save Changes
            </Button>
          </Button.Group>
        </Modal.Footer>
      </Modal.Content>
    </Modal>
  );
  
  // Render add member modal
  const renderAddMemberModal = () => (
    <Modal isOpen={isAddMemberModalOpen} onClose={() => setIsAddMemberModalOpen(false)}>
      <Modal.Content maxW="400px">
        <Modal.CloseButton />
        <Modal.Header>Add Team Member</Modal.Header>
        <Modal.Body>
          <FormControl isRequired>
            <FormControl.Label>Username</FormControl.Label>
            <Input
              value={newMemberUsername}
              onChangeText={setNewMemberUsername}
              placeholder="Enter username"
              autoCapitalize="none"
            />
            <FormControl.HelperText>
              The user must be registered in the system
            </FormControl.HelperText>
          </FormControl>
          <FormControl mt={3}>
            <FormControl.Label>Role</FormControl.Label>
            <Select
              selectedValue={newMemberRole}
              onValueChange={value => setNewMemberRole(value)}
              accessibilityLabel="Select role"
            >
              <Select.Item label="Member" value="member" />
              <Select.Item label="Admin" value="admin" />
            </Select>
          </FormControl>
        </Modal.Body>
        <Modal.Footer>
          <Button.Group space={2}>
            <Button 
              variant="ghost" 
              onPress={() => setIsAddMemberModalOpen(false)}
              isDisabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onPress={handleAddMember}
              isLoading={isSubmitting}
              isDisabled={isSubmitting || !newMemberUsername.trim()}
            >
              Add Member
            </Button>
          </Button.Group>
        </Modal.Footer>
      </Modal.Content>
    </Modal>
  );
  
  // Render delete confirmation modal
  const renderDeleteConfirmModal = () => (
    <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)}>
      <Modal.Content maxW="400px">
        <Modal.CloseButton />
        <Modal.Header>Delete Organization</Modal.Header>
        <Modal.Body>
          <Text>
            Are you sure you want to delete the organization "{organization.name}"? 
            This action cannot be undone.
          </Text>
          <Text mt={2} fontWeight="bold" color="red.500">
            All shared leads will be unlinked from this organization.
          </Text>
        </Modal.Body>
        <Modal.Footer>
          <Button.Group space={2}>
            <Button 
              variant="ghost" 
              onPress={() => setIsDeleteModalOpen(false)}
              isDisabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              colorScheme="danger"
              onPress={handleDeleteOrg}
              isLoading={isSubmitting}
              isDisabled={isSubmitting}
            >
              Delete
            </Button>
          </Button.Group>
        </Modal.Footer>
      </Modal.Content>
    </Modal>
  );
  
  return (
    <Box flex={1} bg="coolGray.50">
      <ScrollView>
        {/* Header */}
        <Box bg="white" p={4} shadow={1}>
          <HStack justifyContent="space-between" alignItems="center">
            <VStack>
              <HStack alignItems="center" space={2}>
                <Heading size="lg">{organization.name}</Heading>
                {isAdmin && (
                  <IconButton
                    icon={<Icon as={MaterialIcons} name="edit" size="sm" color="primary.500" />}
                    variant="ghost"
                    rounded="full"
                    onPress={() => setIsEditModalOpen(true)}
                    _icon={{ color: "primary.500" }}
                  />
                )}
              </HStack>
              {organization.description && (
                <Text color="coolGray.600" mt={1}>
                  {organization.description}
                </Text>
              )}
            </VStack>
            
            {isAdmin && (
              <Menu
                trigger={(triggerProps) => (
                  <IconButton
                    icon={<Icon as={MaterialIcons} name="more-vert" />}
                    variant="ghost"
                    rounded="full"
                    {...triggerProps}
                  />
                )}
              >
                <Menu.Item 
                  onPress={() => setIsEditModalOpen(true)}
                  leftIcon={<Icon as={MaterialIcons} name="edit" size="sm" />}
                >
                  Edit Organization
                </Menu.Item>
                <Menu.Item 
                  onPress={() => setIsDeleteModalOpen(true)}
                  leftIcon={<Icon as={MaterialIcons} name="delete" size="sm" />}
                  _text={{ color: "red.500" }}
                >
                  Delete Organization
                </Menu.Item>
              </Menu>
            )}
          </HStack>
          
          <HStack mt={2} space={2} alignItems="center">
            <Badge
              colorScheme={isAdmin ? "blue" : "coolGray"}
              variant="subtle"
              rounded="full"
            >
              {isAdmin ? "You are an admin" : "You are a member"}
            </Badge>
            
            <Text fontSize="xs" color="coolGray.500">
              Created {new Date(organization.createdAt).toLocaleDateString()}
            </Text>
          </HStack>
        </Box>
        
        {/* Stats */}
        <HStack bg="white" mt={4} p={4} justifyContent="space-around" shadow={1}>
          <VStack alignItems="center">
            <Text fontSize="xs" color="coolGray.500">Members</Text>
            <Text fontSize="2xl" fontWeight="bold">
              {organization.members?.length || 0}
            </Text>
          </VStack>
          
          <VStack alignItems="center">
            <Text fontSize="xs" color="coolGray.500">Team Leads</Text>
            <Text fontSize="2xl" fontWeight="bold">
              {organization.leadCount || 0}
            </Text>
          </VStack>
        </HStack>
        
        {/* Members Section */}
        <Box bg="white" mt={4} p={4} shadow={1}>
          <HStack justifyContent="space-between" alignItems="center" mb={4}>
            <Heading size="md">Team Members</Heading>
            {isAdmin && (
              <Button 
                size="sm"
                leftIcon={<Icon as={Ionicons} name="add" size="sm" />}
                onPress={() => setIsAddMemberModalOpen(true)}
              >
                Add Member
              </Button>
            )}
          </HStack>
          
          <VStack space={4} divider={<Divider />}>
            {organization.members?.map(member => (
              <HStack key={member.id} justifyContent="space-between" alignItems="center">
                <HStack space={3} alignItems="center">
                  <Avatar 
                    size="sm"
                    bg="primary.600"
                  >
                    {member.fullName?.[0] || member.username[0]}
                  </Avatar>
                  <VStack>
                    <Text fontWeight="bold">{member.fullName || member.username}</Text>
                    <Text fontSize="xs" color="coolGray.500">{member.email}</Text>
                  </VStack>
                </HStack>
                
                <HStack space={2} alignItems="center">
                  <Badge
                    colorScheme={member.role === 'admin' ? "blue" : "coolGray"}
                    variant="subtle"
                    rounded="full"
                  >
                    {member.role === 'admin' ? "Admin" : "Member"}
                  </Badge>
                  
                  {isAdmin && member.userId !== user?.id && (
                    <Menu
                      trigger={(triggerProps) => (
                        <IconButton
                          icon={<Icon as={MaterialIcons} name="more-vert" />}
                          variant="ghost"
                          rounded="full"
                          size="sm"
                          {...triggerProps}
                        />
                      )}
                    >
                      <Menu.Item 
                        onPress={() => handleChangeMemberRole(
                          member.id, 
                          member.role === 'admin' ? 'member' : 'admin'
                        )}
                        leftIcon={<Icon as={MaterialIcons} name="swap-horiz" size="sm" />}
                      >
                        Make {member.role === 'admin' ? 'Member' : 'Admin'}
                      </Menu.Item>
                      <Menu.Item 
                        onPress={() => handleRemoveMember(member.id)}
                        leftIcon={<Icon as={MaterialIcons} name="person-remove" size="sm" />}
                        _text={{ color: "red.500" }}
                      >
                        Remove from Team
                      </Menu.Item>
                    </Menu>
                  )}
                </HStack>
              </HStack>
            ))}
            
            {(!organization.members || organization.members.length === 0) && (
              <Box py={4} alignItems="center">
                <Text color="coolGray.500">No members found</Text>
              </Box>
            )}
          </VStack>
        </Box>
        
        {/* Leave Organization Option */}
        {!isAdmin && (
          <Box p={4} mt={4}>
            <Button 
              colorScheme="danger" 
              variant="outline"
              leftIcon={<Icon as={MaterialIcons} name="exit-to-app" />}
              onPress={() => {
                const currentUser = organization.members?.find(m => m.userId === user?.id);
                if (currentUser) {
                  handleRemoveMember(currentUser.id);
                }
              }}
            >
              Leave Organization
            </Button>
          </Box>
        )}
      </ScrollView>
      
      {renderEditOrgModal()}
      {renderAddMemberModal()}
      {renderDeleteConfirmModal()}
    </Box>
  );
};

export default OrganizationDetailsScreen;