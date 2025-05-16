import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useToast } from 'native-base';

// Base URL for API
const API_URL = 'http://localhost:5000/api';

// Organizations service axios instance
const organizationsAxios = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

export const useOrganizations = () => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  // Fetch all organizations for the current user
  const { data: organizations = [], refetch } = useQuery({
    queryKey: ['organizations'],
    queryFn: async () => {
      try {
        const response = await organizationsAxios.get('/organizations');
        return response.data;
      } catch (error) {
        console.error('Error fetching organizations:', error);
        setIsError(true);
        throw error;
      }
    },
  });

  // Get organizations for the current user (helper function)
  const getUserOrganizations = async () => {
    try {
      setIsLoading(true);
      const response = await organizationsAxios.get('/organizations');
      return response.data;
    } catch (error) {
      console.error('Error fetching user organizations:', error);
      toast.show({
        title: "Failed to fetch organizations",
        description: error.response?.data?.message || "Please try again",
        status: "error",
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Get a single organization by id
  const getOrganization = async (organizationId) => {
    try {
      setIsLoading(true);
      const response = await organizationsAxios.get(`/organizations/${organizationId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching organization details:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Create a new organization
  const createOrganizationMutation = useMutation({
    mutationFn: async (organizationData) => {
      const response = await organizationsAxios.post('/organizations', organizationData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      toast.show({
        title: "Organization created successfully",
        status: "success",
      });
    },
    onError: (error) => {
      console.error('Error creating organization:', error);
      toast.show({
        title: "Failed to create organization",
        description: error.response?.data?.message || "Please try again",
        status: "error",
      });
    },
  });

  // Get members of an organization
  const getOrganizationMembers = async (organizationId) => {
    try {
      setIsLoading(true);
      const response = await organizationsAxios.get(`/organizations/${organizationId}/members`);
      return response.data;
    } catch (error) {
      console.error('Error fetching organization members:', error);
      toast.show({
        title: "Failed to fetch organization members",
        description: error.response?.data?.message || "Please try again",
        status: "error",
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Add a member to an organization
  const addOrganizationMemberMutation = useMutation({
    mutationFn: async ({ organizationId, memberData }) => {
      const response = await organizationsAxios.post(`/organizations/${organizationId}/members`, memberData);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['organizations', variables.organizationId, 'members'] });
      toast.show({
        title: "Member added successfully",
        status: "success",
      });
    },
    onError: (error) => {
      console.error('Error adding organization member:', error);
      toast.show({
        title: "Failed to add member",
        description: error.response?.data?.message || "Please try again",
        status: "error",
      });
    },
  });

  // Wrapper functions for mutations
  const createOrganization = async (organizationData) => {
    return createOrganizationMutation.mutateAsync(organizationData);
  };

  const addOrganizationMember = async (organizationId, memberData) => {
    return addOrganizationMemberMutation.mutateAsync({ organizationId, memberData });
  };

  return {
    organizations,
    isLoading,
    isError,
    refetch,
    getUserOrganizations,
    getOrganization,
    createOrganization,
    getOrganizationMembers,
    addOrganizationMember,
    isCreatingOrganization: createOrganizationMutation.isPending,
    isAddingMember: addOrganizationMemberMutation.isPending,
  };
};