import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useToast } from 'native-base';
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
  const queryClient = useQueryClient();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  // Fetch all calls - with type safety
  const { data: calls = [], refetch } = useQuery<Call[]>({
    queryKey: ['calls'],
    queryFn: async () => {
      try {
        const response = await callsAxios.get<{success: boolean, data: Call[]}>('/calls');
        return response.data.data;
      } catch (error) {
        console.error('Error fetching calls:', error);
        setIsError(true);
        throw error;
      }
    },
  });

  // Get calls for a specific lead - with proper typing
  const getCallsByLead = async (leadId: number): Promise<Call[]> => {
    try {
      setIsLoading(true);
      const response = await callsAxios.get<{success: boolean, data: Call[]}>(`/leads/${leadId}/calls`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching lead calls:', error);
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
  
  // Fetch individual call by ID - properly typed
  const getCall = async (callId: number): Promise<{success: boolean, data?: Call, message?: string}> => {
    try {
      setIsLoading(true);
      // In a full implementation, this would get an individual call
      // For now, we'll get all calls and filter
      const allCalls = await getCalls();
      const call = allCalls.data.find(c => c.id === callId);
      return call ? { success: true, data: call } : { success: false, message: 'Call not found' };
    } catch (error) {
      console.error('Error fetching call:', error);
      toast.show({
        title: "Failed to fetch call details",
        description: error instanceof Error ? error.message : "Please try again",
        status: "error",
        placement: "top",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Create a new call record - using Zod type
  const createCallMutation = useMutation<Call, Error, NewCall>({
    mutationFn: async (callData: NewCall) => {
      const response = await callsAxios.post<{success: boolean, data: Call}>('/calls', callData);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calls'] });
      toast.show({
        title: "Call recorded successfully",
        status: "success",
        placement: "top",
      });
    },
    onError: (error) => {
      console.error('Error creating call record:', error);
      toast.show({
        title: "Failed to record call",
        description: error.message || "Please try again",
        status: "error",
        placement: "top",
      });
    },
  });

  // Wrapper function for creating calls - with type safety
  const createCall = async (callData: NewCall): Promise<Call> => {
    return createCallMutation.mutateAsync(callData);
  };

  // Get all calls - with proper return type
  const getCalls = async (): Promise<{success: boolean, data: Call[]}> => {
    try {
      const response = await callsAxios.get<{success: boolean, data: Call[]}>('/calls');
      return response.data;
    } catch (error) {
      console.error('Error fetching all calls:', error);
      throw error;
    }
  };

  return {
    calls,
    isLoading,
    isError,
    refetch,
    getCallsByLead,
    getCall,
    createCall,
    getCalls,
    isCreatingCall: createCallMutation.isPending,
  };
};
