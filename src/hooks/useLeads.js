import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useToast } from 'native-base';

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

  // Fetch all leads
  const { data: leads = [], refetch } = useQuery({
    queryKey: ['leads'],
    queryFn: async () => {
      try {
        const response = await leadsAxios.get('/leads');
        return response.data;
      } catch (error) {
        console.error('Error fetching leads:', error);
        setIsError(true);
        throw error;
      }
    },
  });

  // Get a single lead by id
  const getLead = async (leadId) => {
    try {
      setIsLoading(true);
      const response = await leadsAxios.get(`/leads/${leadId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching lead details:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Create a new lead
  const createLeadMutation = useMutation({
    mutationFn: async (leadData) => {
      // Prepare lead data with team sharing properties if specified
      const leadPayload = {
        ...leadData,
        // Ensure organizationId is null if not sharing with team
        organizationId: leadData.isShared ? leadData.organizationId : null,
      };
      
      const response = await leadsAxios.post('/leads', leadPayload);
      return response.data;
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
        description: error.response?.data?.message || "Please try again",
        status: "error",
        placement: "top",
      });
    },
  });

  // Fetch calls for a lead
  const getCallsForLead = async (leadId) => {
    try {
      setIsLoading(true);
      const response = await leadsAxios.get(`/leads/${leadId}/calls`);
      return response.data;
    } catch (error) {
      console.error('Error fetching calls for lead:', error);
      toast.show({
        title: "Failed to fetch calls",
        description: error.response?.data?.message || "Please try again",
        status: "error",
        placement: "top",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Update a lead
  const updateLeadMutation = useMutation({
    mutationFn: async ({ leadId, leadData }) => {
      // Prepare lead data with team sharing properties if specified
      const leadPayload = {
        ...leadData,
        // Ensure organizationId is null if not sharing with team
        organizationId: leadData.isShared ? leadData.organizationId : null,
      };
      
      const response = await leadsAxios.put(`/leads/${leadId}`, leadPayload);
      return response.data;
    },
    onSuccess: (data) => {
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
        description: error.response?.data?.message || "Please try again",
        status: "error",
        placement: "top",
      });
    },
  });

  // Delete a lead
  const deleteLeadMutation = useMutation({
    mutationFn: async (leadId) => {
      const response = await leadsAxios.delete(`/leads/${leadId}`);
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
        description: error.response?.data?.message || "Please try again",
        status: "error",
        placement: "top",
      });
    },
  });

  // Wrapper functions for mutations
  const createLead = async (leadData) => {
    return createLeadMutation.mutateAsync(leadData);
  };

  const updateLead = async (leadId, leadData) => {
    return updateLeadMutation.mutateAsync({ leadId, leadData });
  };

  const deleteLead = async (leadId) => {
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
