import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useToast } from 'native-base';

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

  // Fetch all calls
  const { data: calls = [], refetch } = useQuery({
    queryKey: ['calls'],
    queryFn: async () => {
      try {
        const response = await callsAxios.get('/calls');
        return response.data;
      } catch (error) {
        console.error('Error fetching calls:', error);
        setIsError(true);
        throw error;
      }
    },
  });

  // Get calls for a specific lead
  const getCallsByLead = async (leadId) => {
    try {
      setIsLoading(true);
      const response = await callsAxios.get(`/leads/${leadId}/calls`);
      return response.data;
    } catch (error) {
      console.error('Error fetching lead calls:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Create a new call record
  const createCallMutation = useMutation({
    mutationFn: async (callData) => {
      const response = await callsAxios.post('/calls', callData);
      return response.data;
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
        description: error.response?.data?.message || "Please try again",
        status: "error",
        placement: "top",
      });
    },
  });

  // Wrapper function for creating calls
  const createCall = async (callData) => {
    return createCallMutation.mutateAsync(callData);
  };

  // Get all calls (not using useState to avoid duplicate state management)
  const getCalls = async () => {
    try {
      const response = await callsAxios.get('/calls');
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
    createCall,
    getCalls,
    isCreatingCall: createCallMutation.isPending,
  };
};