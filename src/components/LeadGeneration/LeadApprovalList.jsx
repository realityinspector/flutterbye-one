import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Pressable,
  Divider,
  Button,
  Icon,
  Badge,
  ScrollView,
  Link,
  Checkbox
} from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';

/**
 * Lead Approval List Component
 * 
 * Displays a list of AI-generated leads for user review and approval before importing
 * into the CRM system. Users can select which leads to import and request more leads.
 */
const LeadApprovalList = ({ 
  leads = [], 
  summary = '', 
  onImportLeads, 
  onCancel, 
  onRequestMoreLeads, 
  isLoadingMoreLeads = false,
  noMoreRecordsAvailable = false
}) => {
  // Track which leads are selected for import
  const [selectedLeads, setSelectedLeads] = useState(
    leads.map((_, index) => ({ id: index, selected: true }))
  );

  // Handler for toggling selection of individual leads
  const handleToggleSelection = (index) => {
    setSelectedLeads(selectedLeads.map(item => 
      item.id === index ? { ...item, selected: !item.selected } : item
    ));
  };

  // Handler for selecting/deselecting all leads
  const handleSelectAll = (selectAll) => {
    setSelectedLeads(selectedLeads.map(item => ({ ...item, selected: selectAll })));
  };

  // Get only the selected leads for import
  const getSelectedLeads = () => {
    return leads.filter((_, index) => 
      selectedLeads.find(item => item.id === index)?.selected
    );
  };

  // Handler for importing selected leads
  const handleImport = () => {
    const leadsToImport = getSelectedLeads();
    onImportLeads(leadsToImport);
  };

  // Calculate how many leads are selected
  const selectedCount = selectedLeads.filter(item => item.selected).length;

  return (
    <Box bg="white" rounded="md" shadow={1} mb={4}>
      <VStack space={3} divider={<Divider />}>
        {/* Header section with summary and selection controls */}
        <Box p={4}>
          <VStack space={3}>
            <Text fontSize="lg" fontWeight="bold">
              AI-Generated Leads
            </Text>
            
            <Text fontSize="sm" color="gray.600">
              {summary || 'Based on your criteria, the following leads were found:'}
            </Text>
            
            <HStack justifyContent="space-between" alignItems="center">
              <Text fontSize="sm">
                {selectedCount} of {leads.length} leads selected
              </Text>
              
              <HStack space={2}>
                <Button
                  size="sm" 
                  variant="ghost"
                  onPress={() => handleSelectAll(true)}
                >
                  Select All
                </Button>
                <Button
                  size="sm" 
                  variant="ghost"
                  onPress={() => handleSelectAll(false)}
                >
                  Deselect All
                </Button>
              </HStack>
            </HStack>
          </VStack>
        </Box>

        {/* Scrollable list of leads */}
        <ScrollView maxH={400}>
          {leads.length > 0 ? (
            <VStack divider={<Divider />}>
              {leads.map((lead, index) => {
                const isSelected = selectedLeads.find(item => item.id === index)?.selected;
                
                return (
                  <Pressable 
                    key={index}
                    onPress={() => handleToggleSelection(index)}
                    _pressed={{ bg: 'gray.100' }}
                  >
                    <Box p={4} bg={isSelected ? 'blue.50' : 'white'}>
                      <HStack space={3} alignItems="flex-start">
                        <Checkbox
                          value="selected"
                          isChecked={isSelected}
                          onChange={() => handleToggleSelection(index)}
                          accessibilityLabel={`Select ${lead.companyName}`}
                        />
                        
                        <VStack space={2} flex={1}>
                          <HStack justifyContent="space-between" alignItems="center">
                            <Text fontWeight="bold" fontSize="md">
                              {lead.companyName}
                            </Text>
                            <Badge colorScheme="blue" variant="subtle" rounded="md">
                              {lead.industry || 'Unknown Industry'}
                            </Badge>
                          </HStack>
                          
                          {lead.contactName && (
                            <HStack space={2} alignItems="center">
                              <Icon as={MaterialIcons} name="person" size="xs" color="gray.500" />
                              <Text fontSize="sm">{lead.contactName}</Text>
                            </HStack>
                          )}
                          
                          {lead.website && (
                            <HStack space={2} alignItems="center">
                              <Icon as={MaterialIcons} name="link" size="xs" color="gray.500" />
                              <Link href={lead.website} isExternal fontSize="sm">
                                {lead.website.replace(/^https?:\/\//, '')}
                              </Link>
                            </HStack>
                          )}
                          
                          {(lead.city || lead.state) && (
                            <HStack space={2} alignItems="center">
                              <Icon as={MaterialIcons} name="location-on" size="xs" color="gray.500" />
                              <Text fontSize="sm">
                                {[lead.city, lead.state].filter(Boolean).join(', ')}
                              </Text>
                            </HStack>
                          )}
                          
                          {lead.description && (
                            <Text fontSize="sm" color="gray.600" mt={1}>
                              {lead.description}
                            </Text>
                          )}
                          
                          {lead.sources && lead.sources.length > 0 && (
                            <Box mt={2}>
                              <Text fontSize="xs" color="gray.500">Sources:</Text>
                              {lead.sources.map((source, i) => (
                                <Link key={i} href={source} isExternal fontSize="xs" color="blue.600">
                                  {source}
                                </Link>
                              ))}
                            </Box>
                          )}
                        </VStack>
                      </HStack>
                    </Box>
                  </Pressable>
                );
              })}
            </VStack>
          ) : (
            <Box p={4} alignItems="center">
              <Text color="gray.500">No leads found matching your criteria</Text>
            </Box>
          )}
        </ScrollView>

        {/* Action buttons */}
        <Box p={4}>
          <VStack space={3}>
            {/* "More Leads" button (if applicable) */}
            {onRequestMoreLeads && (
              <Box>
                {noMoreRecordsAvailable ? (
                  <Text fontSize="sm" color="gray.500" textAlign="center">
                    No more leads available matching your criteria
                  </Text>
                ) : (
                  <Button
                    variant="outline"
                    colorScheme="blue"
                    leftIcon={<Icon as={MaterialIcons} name="refresh" size="sm" />}
                    onPress={onRequestMoreLeads}
                    isLoading={isLoadingMoreLeads}
                    isLoadingText="Searching..."
                    isDisabled={isLoadingMoreLeads || noMoreRecordsAvailable}
                    width="full"
                  >
                    Find More Leads (up to 15)
                  </Button>
                )}
              </Box>
            )}
            
            <HStack space={2} justifyContent="flex-end">
              <Button
                variant="ghost"
                onPress={onCancel}
              >
                Cancel
              </Button>
              <Button
                colorScheme="blue"
                isDisabled={selectedCount === 0}
                onPress={handleImport}
              >
                Import {selectedCount} {selectedCount === 1 ? 'Lead' : 'Leads'}
              </Button>
            </HStack>
          </VStack>
        </Box>
      </VStack>
    </Box>
  );
};

export default LeadApprovalList;