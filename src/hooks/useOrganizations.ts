import { useState, useCallback } from 'react';
import axios from 'axios';
import { Organization, OrganizationMember } from '../../shared/db/zod-schema';
import { useAuth } from './useAuth';

// Create an axios instance for organizations API
const organizationsAxios = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
organizationsAxios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Types for enhanced organization data
export interface OrganizationWithMembers extends Organization {
  members?: OrganizationMember[];
  userRole?: string;
  leadCount?: number;
}

export const useOrganizations = () => {
  const { token } = useAuth();
  const [organizations, setOrganizations] = useState<OrganizationWithMembers[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Fetch all organizations for current user
  const fetchOrganizations = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await organizationsAxios.get<{success: boolean, data: OrganizationWithMembers[]}>('/organizations');
      setOrganizations(response.data.data);
      return response.data.data;
    } catch (err) {
      setError(err as Error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // Get a specific organization with its members
  const getOrganization = useCallback(async (id: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await organizationsAxios.get<{success: boolean, data: OrganizationWithMembers}>(`/organizations/${id}`);
      return response.data.data;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // Create a new organization
  const createOrganization = useCallback(async (orgData: { name: string, description?: string }) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await organizationsAxios.post<{success: boolean, data: Organization}>('/organizations', orgData);
      await fetchOrganizations(); // Refresh the list after creating
      return response.data.data;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [fetchOrganizations, token]);

  // Update an organization
  const updateOrganization = useCallback(async (id: number, orgData: { name?: string, description?: string }) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await organizationsAxios.put<{success: boolean, data: Organization}>(`/organizations/${id}`, orgData);
      await fetchOrganizations(); // Refresh the list after updating
      return response.data.data;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [fetchOrganizations, token]);

  // Delete an organization
  const deleteOrganization = useCallback(async (id: number) => {
    setIsLoading(true);
    setError(null);

    try {
      await organizationsAxios.delete(`/organizations/${id}`);
      await fetchOrganizations(); // Refresh the list after deleting
      return true;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [fetchOrganizations, token]);

  // Add a member to organization
  const addMember = useCallback(async (orgId: number, memberData: { username?: string, email?: string, role?: string }) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await organizationsAxios.post<{success: boolean, data: OrganizationMember}>(
        `/organizations/${orgId}/members`, 
        memberData
      );
      return response.data.data;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // Get organization members
  const getMembers = useCallback(async (orgId: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await organizationsAxios.get<{success: boolean, data: OrganizationMember[]}>(`/organizations/${orgId}/members`);
      return response.data.data;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // Update member role
  const updateMemberRole = useCallback(async (orgId: number, memberId: number, role: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await organizationsAxios.put<{success: boolean, data: OrganizationMember}>(
        `/organizations/${orgId}/members/${memberId}`, 
        { role }
      );
      return response.data.data;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // Remove member from organization
  const removeMember = useCallback(async (orgId: number, memberId: number) => {
    setIsLoading(true);
    setError(null);

    try {
      await organizationsAxios.delete(`/organizations/${orgId}/members/${memberId}`);
      return true;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  return {
    organizations,
    isLoading,
    error,
    fetchOrganizations,
    getOrganization,
    createOrganization,
    updateOrganization,
    deleteOrganization,
    addMember,
    getMembers,
    updateMemberRole,
    removeMember
  };
};