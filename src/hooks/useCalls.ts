import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useToast } from 'native-base';
// Import our custom useAsync hook
import { useAsync } from './useAsync';
// Import Zod types directly from the shared schema
import { Call, NewCall } from '../../shared/db/zod-schema';

// Base URL for API
const API_URL = 'http://localhost:5000/api';

// Call service axios instance
const callsAxios = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

export const useCalls = () => {
  const toast = useToast();
  const [calls, setCalls] = useState<Call[]>([]);
  
  // Create async hooks for each operation
  const fetchCallsAsync = useAsync<Call[]>();
  const fetchCallsByLeadAsync = useAsync<Call[], Error, [number]>();
  const fetchCallAsync = useAsync<{success: boolean, data?: Call, message?: string}, Error, [number]>(); 
  const createCallAsync = useAsync<Call, Error, [NewCall]>();
  
  // Fetch all calls with type safety
  const fetchCalls = useCallback(async () => {
    try {
      return await fetchCallsAsync.execute(async () => {
        const response = await callsAxios.get<{success: boolean, data: Call[]}>('/calls');
        return response.data.data;
      });
    } catch (error) {
      console.error('Error fetching calls:', error);
      return [];
    }
  }, [fetchCallsAsync]);
  
  // Load calls on initial mount
  useEffect(() => {
    const loadData = async () => {
      const data = await fetchCalls();
      if (data) {
        setCalls(data);
      }
    };
    
    loadData();
  }, [fetchCalls]);

  // Get calls for a specific lead with proper typing
  const getCallsByLead = async (leadId: number): Promise<Call[]> => {
    try {
      return await fetchCallsByLeadAsync.execute(async (id) => {
        const response = await callsAxios.get<{success: boolean, data: Call[]}>(`/leads/${id}/calls`);
        return response.data.data;
      }, leadId);
    } catch (error) {
      console.error('Error fetching lead calls:', error);
      toast.show({
        title: "Failed to fetch calls",
        description: error instanceof Error ? error.message : "Please try again",
        placement: "top",
        variant: "solid",
      });
      throw error;
    }
  };
  
  // Fetch individual call by ID with proper typing
  const getCall = async (callId: number): Promise<{success: boolean, data?: Call, message?: string}> => {
    try {
      return await fetchCallAsync.execute(async (id) => {
        // In a full implementation, this would get an individual call
        // For now, we'll get all calls and filter
        const allCalls = await getCalls();
        const call = allCalls.data.find(c => c.id === id);
        return call ? { success: true, data: call } : { success: false, message: 'Call not found' };
      }, callId);
    } catch (error) {
      console.error('Error fetching call:', error);
      toast.show({
        title: "Failed to fetch call details",
        description: error instanceof Error ? error.message : "Please try again",
        placement: "top",
        variant: "solid",
      });
      throw error;
    }
  };

  // Create a new call record with type safety
  const createCall = async (callData: NewCall): Promise<Call> => {
    try {
      const result = await createCallAsync.execute(async (data) => {
        const response = await callsAxios.post<{success: boolean, data: Call}>('/calls', data);
        return response.data.data;
      }, callData);
      
      // Update local state
      setCalls(prev => [...prev, result]);
      
      // Show success message
      toast.show({
        title: "Call recorded successfully",
        placement: "top",
        variant: "solid",
      });
      
      return result;
    } catch (error) {
      console.error('Error creating call record:', error);
      toast.show({
        title: "Failed to record call",
        description: error instanceof Error ? error.message : "Please try again",
        placement: "top",
        variant: "solid",
      });
      throw error;
    }
  };

  // Get all calls with proper return type
  const getCalls = async (): Promise<{success: boolean, data: Call[]}> => {
    try {
      const response = await callsAxios.get<{success: boolean, data: Call[]}>('/calls');
      return response.data;
    } catch (error) {
      console.error('Error fetching all calls:', error);
      throw error;
    }
  };
  
  // Refetch function to refresh calls
  const refetch = useCallback(async () => {
    const data = await fetchCalls();
    if (data) {
      setCalls(data);
    }
  }, [fetchCalls]);

  return {
    calls,
    isLoading: fetchCallsAsync.isPending || fetchCallsByLeadAsync.isPending || fetchCallAsync.isPending,
    isError: fetchCallsAsync.isError || fetchCallsByLeadAsync.isError || fetchCallAsync.isError,
    refetch,
    getCallsByLead,
    getCall,
    createCall,
    getCalls,
    isCreatingCall: createCallAsync.isPending,
  };
};
