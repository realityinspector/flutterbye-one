import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useToast } from 'native-base';
// Import Zod types directly from the shared schema
import { UserLead, NewUserLead, Call } from '../../shared/db/zod-schema';

// Base URL for API
const API_URL = 'http://localhost:5000/api';

// Lead service axios instance
const leadsAxios = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

export const useLeads = () => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  // Fetch all leads - using proper typing for response
  const { data: leads = [], refetch } = useQuery<UserLead[]>({ 
    queryKey: ['leads'],
    queryFn: async () => {
      try {
        const response = await leadsAxios.get<{success: boolean, data: UserLead[]}>('/leads');
        return response.data.data;
      } catch (error) {
        console.error('Error fetching leads:', error);
        setIsError(true);
        throw error;
      }
    },
  });

  // Get a single lead by id - properly typed
  const getLead = async (leadId: number): Promise<UserLead> => {
    try {
      setIsLoading(true);
      const response = await leadsAxios.get<{success: boolean, data: UserLead}>(`/leads/${leadId}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching lead details:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Create a new lead - with proper type safety
  const createLeadMutation = useMutation<UserLead, Error, NewUserLead>({
    mutationFn: async (leadData: NewUserLead) => {
      const response = await leadsAxios.post<{success: boolean, data: UserLead}>('/leads', leadData);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.show({
        title: "Lead created successfully",
        status: "success",
        placement: "top",
      });
    },
    onError: (error) => {
      console.error('Error creating lead:', error);
      toast.show({
        title: "Failed to create lead",
        description: error.message || "Please try again",
        status: "error",
        placement: "top",
      });
    },
  });

  // Fetch calls for a lead - using Call type from Zod schema
  const getCallsForLead = async (leadId: number): Promise<Call[]> => {
    try {
      setIsLoading(true);
      const response = await leadsAxios.get<{success: boolean, data: Call[]}>(`/leads/${leadId}/calls`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching calls for lead:', error);
      toast.show({
        title: "Failed to fetch calls",
        description: error instanceof Error ? error.message : "Please try again",
        status: "error",
        placement: "top",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Update a lead - with proper typings
  const updateLeadMutation = useMutation<
    UserLead, 
    Error, 
    { leadId: number; leadData: Partial<UserLead> }
  >({
    mutationFn: async ({ leadId, leadData }) => {
      const response = await leadsAxios.put<{success: boolean, data: UserLead}>(`/leads/${leadId}`, leadData);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.show({
        title: "Lead updated successfully",
        status: "success",
        placement: "top",
      });
    },
    onError: (error) => {
      console.error('Error updating lead:', error);
      toast.show({
        title: "Failed to update lead",
        description: error.message || "Please try again",
        status: "error",
        placement: "top",
      });
    },
  });

  // Delete a lead - properly typed
  const deleteLeadMutation = useMutation<{success: boolean}, Error, number>({
    mutationFn: async (leadId: number) => {
      const response = await leadsAxios.delete<{success: boolean}>(`/leads/${leadId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.show({
        title: "Lead deleted successfully",
        status: "success",
        placement: "top",
      });
    },
    onError: (error) => {
      console.error('Error deleting lead:', error);
      toast.show({
        title: "Failed to delete lead",
        description: error.message || "Please try again",
        status: "error",
        placement: "top",
      });
    },
  });

  // Wrapper functions for mutations - with typings
  const createLead = async (leadData: NewUserLead): Promise<UserLead> => {
    return createLeadMutation.mutateAsync(leadData);
  };

  const updateLead = async (leadId: number, leadData: Partial<UserLead>): Promise<UserLead> => {
    return updateLeadMutation.mutateAsync({ leadId, leadData });
  };

  const deleteLead = async (leadId: number): Promise<{success: boolean}> => {
    return deleteLeadMutation.mutateAsync(leadId);
  };

  return {
    leads,
    isLoading,
    isError,
    refetch,
    getLead,
    createLead,
    updateLead,
    deleteLead,
    getCallsForLead,
    isCreatingLead: createLeadMutation.isPending,
    isUpdatingLead: updateLeadMutation.isPending,
    isDeletingLead: deleteLeadMutation.isPending,
  };
};
