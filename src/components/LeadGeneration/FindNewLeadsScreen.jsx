import React, { useState, useCallback } from 'react';
import {
  VStack,
  ScrollView,
  Box,
  Text,
  Center,
  Spinner,
  useToast
} from 'native-base';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';
import { useLeads } from '../../hooks/useLeads';
import FindLeadsForm from './FindLeadsForm';
import LeadGenerationProgress from './LeadGenerationProgress';
import LeadApprovalList from './LeadApprovalList';

/**
 * Find New Leads Screen
 * 
 * Main screen for the lead generation feature. Allows users to describe the kinds of
 * leads they're looking for, shows progress during search, and displays results for approval.
 */
const FindNewLeadsScreen = ({ navigation }) => {
  const [state, setState] = useState({
    isLoading: false,
    status: '',
    leads: [],
    summary: '',
    error: null,
    interactionId: null
  });

  const { user } = useAuth();
  const { createLead } = useLeads();
  const toast = useToast();

  // Handle submission of the lead search criteria form
  const handleSearch = useCallback(async (criteria) => {
    setState({
      isLoading: true,
      status: 'searching',
      leads: [],
      summary: '',
      error: null
    });

    try {
      // Call the AI lead generation endpoint
      const response = await axios.post('/api/ai/leads/generate', { 
        criteria,
        userId: user?.id
      });

      if (response.data.success) {
        setState({
          isLoading: false,
          status: '',
          leads: response.data.leads || [],
          summary: response.data.summary || '',
          interactionId: response.data.interactionId
        });
      } else {
        setState({
          isLoading: false,
          status: 'error',
          error: response.data.error || 'Failed to generate leads',
          leads: [],
          summary: ''
        });

        toast.show({
          description: response.data.error || 'Failed to generate leads',
          status: 'error',
          placement: 'top'
        });
      }
    } catch (error) {
      console.error('Lead generation error:', error);
      setState({
        isLoading: false,
        status: 'error',
        error: error.response?.data?.error || error.message || 'Failed to connect to the server',
        leads: [],
        summary: ''
      });

      toast.show({
        description: error.response?.data?.error || error.message || 'Failed to connect to the server',
        status: 'error',
        placement: 'top'
      });
    }
  }, [user, toast]);

  // Handle importing selected leads into the CRM
  const handleImportLeads = useCallback(async (selectedLeads) => {
    setState(prev => ({ ...prev, isLoading: true, status: 'importing' }));

    try {
      // Create each selected lead in the system
      const promises = selectedLeads.map(lead => {
        const leadData = {
          companyName: lead.companyName,
          contactName: lead.contactName || null,
          phoneNumber: lead.phoneNumber || null,
          email: lead.email || null,
          industry: lead.industry || null,
          website: lead.website || null,
          address: lead.address || null,
          city: lead.city || null,
          state: lead.state || null,
          zipCode: lead.zipCode || null,
          notes: lead.description || null,
          status: 'new',
          origin: 'ai_generated',
          userId: user?.id
        };

        return createLead(leadData);
      });

      const results = await Promise.all(promises);

      toast.show({
        description: `Successfully imported ${results.length} leads`,
        status: 'success',
        placement: 'top'
      });

      // Reset state and navigate to leads screen
      setState({
        isLoading: false,
        status: '',
        leads: [],
        summary: '',
        error: null
      });

      // Navigate to leads list
      navigation.navigate('Leads');

    } catch (error) {
      console.error('Lead import error:', error);
      setState(prev => ({ ...prev, isLoading: false, status: 'error' }));

      toast.show({
        description: error.response?.data?.error || error.message || 'Failed to import leads',
        status: 'error',
        placement: 'top'
      });
    }
  }, [user, createLead, navigation, toast]);

  // Handle cancellation of the lead generation process
  const handleCancel = useCallback(() => {
    setState({
      isLoading: false,
      status: '',
      leads: [],
      summary: '',
      error: null
    });
  }, []);

  // Determine which component to show based on current state
  const renderContent = () => {
    // Show loading/progress state
    if (state.isLoading) {
      return <LeadGenerationProgress status={state.status} />;
    }

    // Show lead approval list if we have leads to display
    if (state.leads && state.leads.length > 0) {
      return (
        <LeadApprovalList 
          leads={state.leads} 
          summary={state.summary}
          onImportLeads={handleImportLeads}
          onCancel={handleCancel}
        />
      );
    }

    // Show the search form by default
    return <FindLeadsForm onSubmit={handleSearch} isLoading={state.isLoading} />;
  };

  return (
    <ScrollView bg="gray.100" px={4} py={4}>
      <VStack space={4}>
        <Text fontSize="xl" fontWeight="bold">
          Find New Leads
        </Text>

        <Text color="gray.600">
          Describe the ideal leads you're looking for, and our AI will search the web to find matching companies.
        </Text>

        {renderContent()}
      </VStack>
    </ScrollView>
  );
};

export default FindNewLeadsScreen;