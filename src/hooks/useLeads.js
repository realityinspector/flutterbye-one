import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useToast } from 'native-base';

// Base URL for API
const API_URL = 'http://localhost:8000/api';

// Lead service axios instance
const leadsAxios = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Type for creating a new lead
export type CreateLeadPayload = {
  companyName: string;
  contactName: string;
  phoneNumber: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  industry?: string;
  website?: string;
  notes?: string;
};

// Type for user lead data
export type UserLead = {
  id: number;
  userId: number;
  globalLeadId: number;
  status: 'new' | 'contacted' | 'qualified' | 'unqualified' | 'converted';
  priority: number;
  notes?: string;
  lastContactedAt?: string;
  reminderDate?: string;
  globalLead?: {
    id: number;
    companyName: string;
    contactName: string;
    phoneNumber: string;
    email?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    industry?: string;
    website?: string;
  };
};

export const useLeads = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  // Get all leads
  const { data: leads = [], isLoading, error, refetch: refetchLeads } = useQuery({
    queryKey: ['leads'],
    queryFn: async () => {
      const response = await leadsAxios.get('/leads');
      return response.data;
    }
  });

  // Get a single lead
  const getLead = (leadId) => {
    return useQuery({
      queryKey: ['leads', leadId],
      queryFn: async () => {
        if (!leadId) return null;
        const response = await leadsAxios.get(`/leads/${leadId}`);
        return response.data;
      },
      enabled: !!leadId,
    });
  };

  // Create a new lead
  const createLeadMutation = useMutation({
    mutationFn: async (leadData) => {
      const response = await leadsAxios.post('/leads', leadData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.show({
        title: "Lead created",
        status: "success",
        placement: "top",
        duration: 3000,
      });
    },
    onError: (error) => {
      console.error('Create lead error:', error);
      toast.show({
        title: "Failed to create lead",
        description: error.response?.data?.message || "Please try again",
        status: "error",
        placement: "top",
        duration: 3000,
      });
    },
  });

  // Update a lead
  const updateLeadMutation = useMutation({
    mutationFn: async ({ leadId, leadData }) => {
      const response = await leadsAxios.put(`/leads/${leadId}`, leadData);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['leads', data.id] });
      toast.show({
        title: "Lead updated",
        status: "success",
        placement: "top",
        duration: 3000,
      });
    },
    onError: (error) => {
      console.error('Update lead error:', error);
      toast.show({
        title: "Failed to update lead",
        description: error.response?.data?.message || "Please try again",
        status: "error",
        placement: "top",
        duration: 3000,
      });
    },
  });

  // Delete a lead
  const deleteLeadMutation = useMutation({
    mutationFn: async (leadId) => {
      await leadsAxios.delete(`/leads/${leadId}`);
      return leadId;
    },
    onSuccess: (leadId) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.removeQueries({ queryKey: ['leads', leadId] });
      toast.show({
        title: "Lead deleted",
        status: "success",
        placement: "top",
        duration: 3000,
      });
    },
    onError: (error) => {
      console.error('Delete lead error:', error);
      toast.show({
        title: "Failed to delete lead",
        description: error.response?.data?.message || "Please try again",
        status: "error",
        placement: "top",
        duration: 3000,
      });
    },
  });

  return {
    leads,
    isLoading,
    error,
    refetchLeads,
    getLead,
    createLead: createLeadMutation.mutateAsync,
    updateLead: updateLeadMutation.mutateAsync,
    deleteLead: deleteLeadMutation.mutateAsync,
    isCreatingLead: createLeadMutation.isPending,
    isUpdatingLead: updateLeadMutation.isPending,
    isDeletingLead: deleteLeadMutation.isPending,
  };
};
