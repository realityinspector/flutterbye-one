import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Import shared Lead model
import { Lead } from '../../shared/models/Lead';
import { ReactNativeUIAdapters } from '../../shared/adapters/ReactNativeAdapter';

/**
 * Lead Card Component for React Native
 * Uses the shared Lead model across platforms
 */
const LeadCard = ({ 
  lead, 
  onPress, 
  onCall, 
  onEdit,
  onDelete,
  compact = false 
}) => {
  // Ensure we're working with a Lead model instance
  const leadModel = lead instanceof Lead ? lead : new Lead(lead);
  
  // Get formatted status from UI adapter
  const statusStyle = ReactNativeUIAdapters.formatStatus(leadModel.status);
  
  // Format priority as stars
  const formatPriority = (priority) => {
    return Array(5)
      .fill(0)
      .map((_, index) => (
        <Ionicons
          key={index}
          name={index < priority ? 'star' : 'star-outline'}
          size={14}
          color={index < priority ? '#f39c12' : '#ccc'}
          style={styles.priorityStar}
        />
      ));
  };
  
  // Compact mode for list views
  if (compact) {
    return (
      <TouchableOpacity 
        style={styles.compactContainer}
        onPress={() => onPress && onPress(leadModel)}
      >
        <View style={styles.compactContent}>
          <Text style={styles.compactCompanyName} numberOfLines={1}>
            {leadModel.getDisplayName()}
          </Text>
          
          {leadModel.getContactName() && (
            <Text style={styles.compactContactName} numberOfLines={1}>
              {leadModel.getContactName()}
            </Text>
          )}
        </View>
        
        <View style={[styles.statusBadge, { backgroundColor: statusStyle.color }]}>
          <Text style={styles.statusText}>{statusStyle.text}</Text>
        </View>
      </TouchableOpacity>
    );
  }
  
  // Full lead card
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.companyName}>{leadModel.getDisplayName()}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusStyle.color }]}>
          <Text style={styles.statusText}>{statusStyle.text}</Text>
        </View>
      </View>
      
      <View style={styles.content}>
        {leadModel.getContactName() && (
          <View style={styles.infoRow}>
            <Ionicons name="person" size={16} color="#555" />
            <Text style={styles.infoText}>{leadModel.getContactName()}</Text>
          </View>
        )}
        
        {leadModel.getPhoneNumber() && (
          <View style={styles.infoRow}>
            <Ionicons name="call" size={16} color="#555" />
            <Text style={styles.infoText}>
              {ReactNativeUIAdapters.formatPhoneNumber(leadModel.getPhoneNumber())}
            </Text>
          </View>
        )}
        
        {leadModel.getEmail() && (
          <View style={styles.infoRow}>
            <Ionicons name="mail" size={16} color="#555" />
            <Text style={styles.infoText}>{leadModel.getEmail()}</Text>
          </View>
        )}
        
        <View style={styles.priorityContainer}>
          <Text style={styles.priorityLabel}>Priority: </Text>
          <View style={styles.priorityStars}>
            {formatPriority(leadModel.priority)}
          </View>
        </View>
        
        {leadModel.lastContact && (
          <Text style={styles.lastContact}>
            Last Contact: {ReactNativeUIAdapters.formatDate(leadModel.lastContact)}
          </Text>
        )}
      </View>
      
      <View style={styles.actions}>
        {leadModel.canMakeCall() && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.callButton]}
            onPress={() => onCall && onCall(leadModel)}
          >
            <Ionicons name="call" size={18} color="white" />
            <Text style={styles.actionButtonText}>Call</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.editButton]}
          onPress={() => onEdit && onEdit(leadModel)}
        >
          <Ionicons name="create" size={18} color="white" />
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => onDelete && onDelete(leadModel)}
        >
          <Ionicons name="trash" size={18} color="white" />
          <Text style={styles.actionButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 8,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
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
  content: {
    padding: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  priorityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  priorityLabel: {
    fontSize: 14,
    color: '#555',
  },
  priorityStars: {
    flexDirection: 'row',
  },
  priorityStar: {
    marginHorizontal: 1,
  },
  lastContact: {
    fontSize: 12,
    color: '#777',
    marginTop: 8,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
  callButton: {
    backgroundColor: '#27ae60',
  },
  editButton: {
    backgroundColor: '#3498db',
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  // Compact styles
  compactContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  compactContent: {
    flex: 1,
  },
  compactCompanyName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  compactContactName: {
    fontSize: 14,
    color: '#555',
  },
});

export default LeadCard;