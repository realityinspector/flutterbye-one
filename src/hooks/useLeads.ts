import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useToast } from 'native-base';
// Import our custom useAsync hook
import { useAsync } from './useAsync';
// Import Zod types directly from the shared schema and our extended types
import { NewUserLead, Call } from '../../shared/db/zod-schema';
import { UserLeadWithRelations, CallWithRelations } from '../types';

// Base URL for API
const API_URL = 'http://localhost:5000/api';

// Lead service axios instance
const leadsAxios = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

export const useLeads = () => {
  const toast = useToast();
  const [leads, setLeads] = useState<UserLeadWithRelations[]>([]);
  
  // Create async hooks for each operation
  const fetchLeadsAsync = useAsync<UserLeadWithRelations[]>();
  const fetchLeadAsync = useAsync<UserLeadWithRelations, Error, [number]>();
  const createLeadAsync = useAsync<UserLeadWithRelations, Error, [NewUserLead]>();
  const updateLeadAsync = useAsync<UserLeadWithRelations, Error, [number, Partial<UserLeadWithRelations>]>();
  const deleteLeadAsync = useAsync<{success: boolean}, Error, [number]>();
  const fetchCallsForLeadAsync = useAsync<CallWithRelations[], Error, [number]>();
  
  // Fetch all leads with type safety
  const fetchLeads = useCallback(async () => {
    try {
      return await fetchLeadsAsync.execute(async () => {
        const response = await leadsAxios.get<{success: boolean, data: UserLeadWithRelations[]}>('/leads');
        return response.data.data;
      });
    } catch (error) {
      console.error('Error fetching leads:', error);
      return [];
    }
  }, [fetchLeadsAsync]);
  
  // Load leads on initial mount
  useEffect(() => {
    const loadData = async () => {
      const data = await fetchLeads();
      if (data) {
        setLeads(data);
      }
    };
    
    loadData();
  }, [fetchLeads]);

  // Get a single lead by id with proper typing
  const getLead = async (leadId: number): Promise<UserLeadWithRelations> => {
    try {
      return await fetchLeadAsync.execute(async (id) => {
        const response = await leadsAxios.get<{success: boolean, data: UserLeadWithRelations}>(`/leads/${id}`);
        return response.data.data;
      }, leadId);
    } catch (error) {
      console.error('Error fetching lead details:', error);
      throw error;
    }
  };

  // Create a new lead with type safety
  const createLead = async (leadData: NewUserLead): Promise<UserLeadWithRelations> => {
    try {
      const result = await createLeadAsync.execute(async (data) => {
        const response = await leadsAxios.post<{success: boolean, data: UserLeadWithRelations}>('/leads', data);
        return response.data.data;
      }, leadData);
      
      // Update local state
      setLeads(prev => [...prev, result]);
      
      // Show success message
      toast.show({
        title: "Lead created successfully",
        placement: "top",
        variant: "solid",
      });
      
      return result;
    } catch (error) {
      console.error('Error creating lead:', error);
      toast.show({
        title: "Failed to create lead",
        description: error instanceof Error ? error.message : "Please try again",
        placement: "top",
        variant: "solid",
      });
      throw error;
    }
  };

  // Fetch calls for a lead with proper typing
  const getCallsForLead = async (leadId: number): Promise<CallWithRelations[]> => {
    try {
      return await fetchCallsForLeadAsync.execute(async (id) => {
        const response = await leadsAxios.get<{success: boolean, data: CallWithRelations[]}>(`/leads/${id}/calls`);
        return response.data.data;
      }, leadId);
    } catch (error) {
      console.error('Error fetching calls for lead:', error);
      toast.show({
        title: "Failed to fetch calls",
        description: error instanceof Error ? error.message : "Please try again",
        placement: "top",
        variant: "solid",
      });
      throw error;
    }
  };

  // Update a lead with proper typing
  const updateLead = async (leadId: number, leadData: Partial<UserLeadWithRelations>): Promise<UserLeadWithRelations> => {
    try {
      const result = await updateLeadAsync.execute(async (id, data) => {
        const response = await leadsAxios.put<{success: boolean, data: UserLeadWithRelations}>(`/leads/${id}`, data);
        return response.data.data;
      }, leadId, leadData);
      
      // Update local state
      setLeads(prev => prev.map(lead => lead.id === leadId ? result : lead));
      
      // Show success message
      toast.show({
        title: "Lead updated successfully",
        placement: "top",
        variant: "solid",
      });
      
      return result;
    } catch (error) {
      console.error('Error updating lead:', error);
      toast.show({
        title: "Failed to update lead",
        description: error instanceof Error ? error.message : "Please try again",
        placement: "top",
        variant: "solid",
      });
      throw error;
    }
  };

  // Delete a lead with proper typing
  const deleteLead = async (leadId: number): Promise<{success: boolean}> => {
    try {
      const result = await deleteLeadAsync.execute(async (id) => {
        const response = await leadsAxios.delete<{success: boolean}>(`/leads/${id}`);
        return response.data;
      }, leadId);
      
      // Update local state
      setLeads(prev => prev.filter(lead => lead.id !== leadId));
      
      // Show success message
      toast.show({
        title: "Lead deleted successfully",
        placement: "top",
        variant: "solid",
      });
      
      return result;
    } catch (error) {
      console.error('Error deleting lead:', error);
      toast.show({
        title: "Failed to delete lead",
        description: error instanceof Error ? error.message : "Please try again",
        placement: "top",
        variant: "solid",
      });
      throw error;
    }
  };

  // Refetch function to refresh leads
  const refetch = useCallback(async () => {
    const data = await fetchLeads();
    if (data) {
      setLeads(data);
    }
  }, [fetchLeads]);

  return {
    leads,
    isLoading: fetchLeadsAsync.isPending || fetchLeadAsync.isPending || fetchCallsForLeadAsync.isPending,
    isError: fetchLeadsAsync.isError || fetchLeadAsync.isError || fetchCallsForLeadAsync.isError,
    refetch,
    getLead,
    createLead,
    updateLead,
    deleteLead,
    getCallsForLead,
    isCreatingLead: createLeadAsync.isPending,
    isUpdatingLead: updateLeadAsync.isPending,
    isDeletingLead: deleteLeadAsync.isPending,
  };
};
