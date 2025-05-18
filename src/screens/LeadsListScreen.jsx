import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  TextInput,
  ActivityIndicator,
  Alert 
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

// Import shared components, models and services
import { Lead } from '../../shared/models/Lead';
import { LeadService } from '../../shared/services/LeadService';
import { 
  ReactNativeAPIAdapter,
  ReactNativeStorageAdapter
} from '../../shared/adapters/ReactNativeAdapter';
import LeadCard from '../components/LeadCard';

// Create platform-specific adapters
const apiClient = new ReactNativeAPIAdapter('https://api.flutterbye.com');
const storageManager = new ReactNativeStorageAdapter('flutterbye');

// Initialize the lead service with our adapters
const leadService = new LeadService(apiClient, storageManager);

const LeadsListScreen = () => {
  const navigation = useNavigation();
  
  // State management
  const [leads, setLeads] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(null);
  const [error, setError] = useState(null);
  
  // Load leads when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadLeads();
      return () => {}; // Cleanup when screen loses focus
    }, [])
  );
  
  // Apply filters when leads, search query, or status filter changes
  useEffect(() => {
    applyFilters();
  }, [leads, searchQuery, statusFilter]);
  
  /**
   * Load leads from the service
   */
  const loadLeads = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get leads from service
      const leadsList = await leadService.list();
      setLeads(leadsList);
      
      setLoading(false);
    } catch (err) {
      setError(`Failed to load leads: ${err.message}`);
      setLoading(false);
    }
  };
  
  /**
   * Handle pull-to-refresh
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadLeads();
    setRefreshing(false);
  };
  
  /**
   * Apply filters to leads
   */
  const applyFilters = () => {
    let filtered = [...leads];
    
    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(lead => lead.status === statusFilter);
    }
    
    // Apply search filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(lead => {
        const companyName = lead.getDisplayName().toLowerCase();
        const contactName = (lead.getContactName() || '').toLowerCase();
        return companyName.includes(query) || contactName.includes(query);
      });
    }
    
    setFilteredLeads(filtered);
  };
  
  /**
   * Clear all filters
   */
  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter(null);
  };
  
  /**
   * Navigate to lead details
   */
  const handleLeadPress = (lead) => {
    navigation.navigate('LeadDetails', { leadId: lead.id });
  };
  
  /**
   * Call a lead
   */
  const handleCallLead = (lead) => {
    if (lead.canMakeCall()) {
      navigation.navigate('CallDetails', { leadId: lead.id });
    } else {
      Alert.alert(
        'Cannot Make Call',
        'This lead does not have a phone number.',
        [{ text: 'OK' }]
      );
    }
  };
  
  /**
   * Edit a lead
   */
  const handleEditLead = (lead) => {
    navigation.navigate('EditLead', { leadId: lead.id });
  };
  
  /**
   * Delete a lead
   */
  const handleDeleteLead = (lead) => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete ${lead.getDisplayName()}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await leadService.delete(lead.id);
              // Refresh the list
              loadLeads();
            } catch (error) {
              Alert.alert('Error', `Failed to delete lead: ${error.message}`);
            }
          }
        }
      ]
    );
  };
  
  /**
   * Add a new lead
   */
  const handleAddLead = () => {
    navigation.navigate('AddLead');
  };
  
  /**
   * Render a lead item
   */
  const renderLeadItem = ({ item }) => (
    <LeadCard
      lead={item}
      onPress={handleLeadPress}
      onCall={handleCallLead}
      onEdit={handleEditLead}
      onDelete={handleDeleteLead}
    />
  );
  
  /**
   * Render a status filter button
   */
  const renderStatusFilter = (status, label) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        statusFilter === status && styles.filterButtonActive
      ]}
      onPress={() => setStatusFilter(statusFilter === status ? null : status)}
    >
      <Text
        style={[
          styles.filterButtonText,
          statusFilter === status && styles.filterButtonTextActive
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Leads</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={handleAddLead}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#777" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search leads..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => setSearchQuery('')}
            >
              <Ionicons name="close-circle" size={18} color="#777" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScrollContent}>
          {renderStatusFilter('new', 'New')}
          {renderStatusFilter('contacted', 'Contacted')}
          {renderStatusFilter('qualified', 'Qualified')}
          {renderStatusFilter('proposal', 'Proposal')}
          {renderStatusFilter('closed-won', 'Closed (Won)')}
          {renderStatusFilter('closed-lost', 'Closed (Lost)')}
        </ScrollView>
        
        {(statusFilter || searchQuery) && (
          <TouchableOpacity
            style={styles.clearFiltersButton}
            onPress={clearFilters}
          >
            <Text style={styles.clearFiltersText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadLeads}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>Loading leads...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredLeads}
          renderItem={renderLeadItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.list}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="folder-open-outline" size={64} color="#ccc" />
              <Text style={styles.emptyTitle}>No Leads Found</Text>
              <Text style={styles.emptyText}>
                {(statusFilter || searchQuery) 
                  ? 'Try clearing your filters'
                  : 'Add your first lead to get started'}
              </Text>
              
              {!(statusFilter || searchQuery) && (
                <TouchableOpacity
                  style={styles.emptyAddButton}
                  onPress={handleAddLead}
                >
                  <Text style={styles.emptyAddButtonText}>Add Lead</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#3498db',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  clearButton: {
    padding: 4,
  },
  filtersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filtersScrollContent: {
    paddingRight: 16,
  },
  filterButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#3498db',
  },
  filterButtonText: {
    color: '#555',
  },
  filterButtonTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
  clearFiltersButton: {
    padding: 8,
  },
  clearFiltersText: {
    color: '#3498db',
    fontWeight: 'bold',
  },
  list: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#555',
  },
  errorContainer: {
    margin: 16,
    padding: 16,
    backgroundColor: '#ffebee',
    borderRadius: 8,
    alignItems: 'center',
  },
  errorText: {
    color: '#c62828',
    marginBottom: 8,
  },
  retryButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  retryText: {
    color: 'white',
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    marginTop: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyAddButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyAddButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default LeadsListScreen;