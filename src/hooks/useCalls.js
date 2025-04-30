import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useToast } from 'native-base';

// Base URL for API
const API_URL = 'http://localhost:8000/api';

// Calls service axios instance
const callsAxios = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Call outcome types
export type CallOutcome = 
  | 'no_answer' 
  | 'call_back' 
  | 'do_not_call' 
  | 'interested' 
  | 'not_interested' 
  | 'meeting_scheduled' 
  | 'other';

// Call record type
export type Call = {
  id: number;
  userId: number;
  userLeadId: number;
  callDate: string;
  duration?: number;
  outcome?: CallOutcome;
  notes?: string;
  reminderDate?: string;
};

// Create call payload
type CreateCallPayload = {
  userLeadId: number;
  callDate?: string;
  duration?: number;
  outcome?: CallOutcome;
  notes?: string;
  reminderDate?: string;
};

export const useCalls = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  // Get all calls
  const { data: calls = [], isLoading, error, refetch: refetchCalls } = useQuery({
    queryKey: ['calls'],
    queryFn: async () => {
      const response = await callsAxios.get('/calls');
      return response.data;
    }
  });

  // Get calls for a specific lead
  const getCallsForLead = (leadId) => {
    return useQuery({
      queryKey: ['calls', 'lead', leadId],
      queryFn: async () => {
        if (!leadId) return [];
        const response = await callsAxios.get(`/leads/${leadId}/calls`);
        return response.data;
      },
      enabled: !!leadId,
    });
  };

  // Get a single call
  const getCall = (callId) => {
    return useQuery({
      queryKey: ['calls', callId],
      queryFn: async () => {
        if (!callId) return null;
        const response = await callsAxios.get(`/calls/${callId}`);
        return response.data;
      },
      enabled: !!callId,
    });
  };

  // Create a new call
  const createCallMutation = useMutation({
    mutationFn: async (callData) => {
      const response = await callsAxios.post('/calls', callData);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['calls'] });
      queryClient.invalidateQueries({ queryKey: ['calls', 'lead', data.userLeadId] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.show({
        title: "Call logged",
        status: "success",
        placement: "top",
        duration: 3000,
      });
    },
    onError: (error) => {
      console.error('Create call error:', error);
      toast.show({
        title: "Failed to log call",
        description: error.response?.data?.message || "Please try again",
        status: "error",
        placement: "top",
        duration: 3000,
      });
    },
  });

  // Update a call
  const updateCallMutation = useMutation({
    mutationFn: async ({ callId, callData }) => {
      const response = await callsAxios.put(`/calls/${callId}`, callData);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['calls'] });
      queryClient.invalidateQueries({ queryKey: ['calls', data.id] });
      queryClient.invalidateQueries({ queryKey: ['calls', 'lead', data.userLeadId] });
      toast.show({
        title: "Call updated",
        status: "success",
        placement: "top",
        duration: 3000,
      });
    },
    onError: (error) => {
      console.error('Update call error:', error);
      toast.show({
        title: "Failed to update call",
        description: error.response?.data?.message || "Please try again",
        status: "error",
        placement: "top",
        duration: 3000,
      });
    },
  });

  // Delete a call
  const deleteCallMutation = useMutation({
    mutationFn: async (callId) => {
      await callsAxios.delete(`/calls/${callId}`);
      return callId;
    },
    onSuccess: (callId) => {
      queryClient.invalidateQueries({ queryKey: ['calls'] });
      queryClient.removeQueries({ queryKey: ['calls', callId] });
      toast.show({
        title: "Call deleted",
        status: "success",
        placement: "top",
        duration: 3000,
      });
    },
    onError: (error) => {
      console.error('Delete call error:', error);
      toast.show({
        title: "Failed to delete call",
        description: error.response?.data?.message || "Please try again",
        status: "error",
        placement: "top",
        duration: 3000,
      });
    },
  });

  return {
    calls,
    isLoading,
    error,
    refetchCalls,
    getCallsForLead,
    getCall,
    createCall: createCallMutation.mutateAsync,
    updateCall: updateCallMutation.mutateAsync,
    deleteCall: deleteCallMutation.mutateAsync,
    isCreatingCall: createCallMutation.isPending,
    isUpdatingCall: updateCallMutation.isPending,
    isDeletingCall: deleteCallMutation.isPending,
  };
};
