import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

// Import our shared models and React Native adapters
import { Lead } from '../../shared/models/Lead';
import { 
  ReactNativeAPIAdapter,
  ReactNativeStorageAdapter,
  ReactNativeUIAdapters
} from '../../shared/adapters/ReactNativeAdapter';

// Create our API and storage instances
const apiClient = new ReactNativeAPIAdapter('https://api.flutterbye.com');
const storageManager = new ReactNativeStorageAdapter('flutterbye');

const LeadScreen = () => {
  const navigation = useNavigation();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    // Load leads when the component mounts
    loadLeads();
    
    // Set up a navigation listener to refresh when returning to this screen
    const unsubscribe = navigation.addListener('focus', () => {
      loadLeads();
    });
    
    return unsubscribe;
  }, [navigation]);
  
  /**
   * Load leads from API or cache
   */
  const loadLeads = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check for authentication token
      const authToken = await storageManager.get('authToken');
      if (authToken) {
        apiClient.setAuthToken(authToken);
      } else {
        // Redirect to login if not authenticated
        navigation.navigate('Login');
        return;
      }
      
      // Try to get leads from cache first for instant display
      const cachedLeads = await storageManager.get('leads');
      if (cachedLeads) {
        // Convert to Lead objects
        setLeads(cachedLeads.map(leadData => new Lead(leadData)));
      }
      
      // Fetch from API
      const response = await apiClient.getLeads();
      
      // Update with fresh data
      const leadObjects = response.map(leadData => new Lead(leadData));
      setLeads(leadObjects);
      
      // Update cache
      await storageManager.set('leads', leadObjects.map(lead => lead.toJSON()));
      
      setLoading(false);
    } catch (err) {
      setError('Failed to load leads: ' + err.message);
      setLoading(false);
    }
  };
  
  /**
   * Navigate to lead details screen
   */
  const handleLeadPress = (lead) => {
    navigation.navigate('LeadDetails', { leadId: lead.id });
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
  const renderLeadItem = ({ item }) => {
    // Use the Lead model's methods to get consistent display data
    const statusStyle = ReactNativeUIAdapters.formatStatus(item.status);
    
    return (
      <TouchableOpacity
        style={styles.leadCard}
        onPress={() => handleLeadPress(item)}
      >
        <View style={styles.leadHeader}>
          <Text style={styles.companyName}>{item.getDisplayName()}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.color }]}>
            <Text style={styles.statusText}>{statusStyle.text}</Text>
          </View>
        </View>
        
        <View style={styles.contactInfo}>
          {item.getContactName() && (
            <Text style={styles.contactName}>{item.getContactName()}</Text>
          )}
          
          {item.getPhoneNumber() && (
            <Text style={styles.phoneNumber}>
              {ReactNativeUIAdapters.formatPhoneNumber(item.getPhoneNumber())}
            </Text>
          )}
          
          {item.getEmail() && (
            <Text style={styles.email}>{item.getEmail()}</Text>
          )}
        </View>
        
        <View style={styles.leadFooter}>
          <Text style={styles.priorityText}>
            Priority: {'\u2605'.repeat(item.priority)}{'\u2606'.repeat(5 - item.priority)}
          </Text>
          
          {item.lastContact && (
            <Text style={styles.lastContact}>
              Last Contact: {ReactNativeUIAdapters.formatDate(item.lastContact)}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Leads</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={handleAddLead}
        >
          <Text style={styles.addButtonText}>+ Add Lead</Text>
        </TouchableOpacity>
      </View>
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={loadLeads}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {loading && !leads.length ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>Loading leads...</Text>
        </View>
      ) : (
        <FlatList
          data={leads}
          renderItem={renderLeadItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.leadList}
          refreshing={loading}
          onRefresh={loadLeads}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No leads found</Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={handleAddLead}
              >
                <Text style={styles.emptyButtonText}>Add your first lead</Text>
              </TouchableOpacity>
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
    padding: 8,
    borderRadius: 4,
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  leadList: {
    padding: 16,
  },
  leadCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  leadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  contactInfo: {
    marginBottom: 8,
  },
  contactName: {
    fontSize: 16,
    marginBottom: 4,
  },
  phoneNumber: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#555',
  },
  leadFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 8,
    marginTop: 8,
  },
  priorityText: {
    fontSize: 14,
    color: '#f39c12',
  },
  lastContact: {
    fontSize: 12,
    color: '#777',
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
    padding: 16,
    backgroundColor: '#ffebee',
    margin: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  errorText: {
    color: '#c62828',
    marginBottom: 8,
  },
  retryText: {
    color: '#2196f3',
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#777',
    marginBottom: 16,
  },
  emptyButton: {
    backgroundColor: '#3498db',
    padding: 12,
    borderRadius: 4,
  },
  emptyButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default LeadScreen;