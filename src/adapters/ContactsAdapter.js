/**
 * Contacts Adapter for React Native
 * 
 * This adapter provides platform-specific implementations for accessing 
 * and managing device contacts, with conversion to lead format.
 */

import * as Contacts from 'expo-contacts';
import { STORAGE_KEYS } from '../config/AppConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

class ContactsAdapter {
  constructor() {
    this.cacheKey = STORAGE_KEYS.CONTACTS_CACHE;
    this.initialized = false;
    this.permissionGranted = false;
  }

  /**
   * Initialize contacts adapter and request permissions
   * @returns {Promise<boolean>} Permission status
   */
  async initialize() {
    if (this.initialized) return this.permissionGranted;
    
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      this.permissionGranted = status === 'granted';
      this.initialized = true;
      
      return this.permissionGranted;
    } catch (error) {
      console.error('Error initializing contacts adapter:', error);
      this.permissionGranted = false;
      this.initialized = true;
      return false;
    }
  }

  /**
   * Get all contacts from the device
   * @returns {Promise<Array>} Array of contact objects
   */
  async getAllContacts() {
    // Ensure adapter is initialized
    if (!this.initialized) {
      await this.initialize();
    }
    
    // Check permissions
    if (!this.permissionGranted) {
      throw new Error('Contacts permission not granted');
    }
    
    try {
      // Get contacts with all available fields
      const { data } = await Contacts.getContactsAsync({
        fields: [
          Contacts.Fields.ID,
          Contacts.Fields.Name,
          Contacts.Fields.FirstName,
          Contacts.Fields.LastName,
          Contacts.Fields.MiddleName,
          Contacts.Fields.PhoneNumbers,
          Contacts.Fields.Emails,
          Contacts.Fields.Addresses,
          Contacts.Fields.Company,
          Contacts.Fields.JobTitle,
          Contacts.Fields.Note,
          Contacts.Fields.ImageAvailable,
          Contacts.Fields.Image
        ],
        sort: Contacts.SortTypes.FirstName
      });
      
      // Cache results
      await this.cacheContacts(data);
      
      return data;
    } catch (error) {
      console.error('Error fetching contacts:', error);
      
      // Try to get from cache
      const cachedContacts = await this.getCachedContacts();
      if (cachedContacts.length > 0) {
        console.log('Using cached contacts');
        return cachedContacts;
      }
      
      throw error;
    }
  }

  /**
   * Get a contact by ID
   * @param {string} id - Contact ID
   * @returns {Promise<Object|null>} Contact object or null
   */
  async getContactById(id) {
    // Ensure adapter is initialized
    if (!this.initialized) {
      await this.initialize();
    }
    
    // Check permissions
    if (!this.permissionGranted) {
      throw new Error('Contacts permission not granted');
    }
    
    try {
      const contact = await Contacts.getContactByIdAsync(id, [
        Contacts.Fields.ID,
        Contacts.Fields.Name,
        Contacts.Fields.FirstName,
        Contacts.Fields.LastName,
        Contacts.Fields.MiddleName,
        Contacts.Fields.PhoneNumbers,
        Contacts.Fields.Emails,
        Contacts.Fields.Addresses,
        Contacts.Fields.Company,
        Contacts.Fields.JobTitle,
        Contacts.Fields.Note,
        Contacts.Fields.ImageAvailable,
        Contacts.Fields.Image
      ]);
      
      return contact;
    } catch (error) {
      console.error(`Error fetching contact ${id}:`, error);
      
      // Try to get from cache
      const cachedContact = await this.getCachedContactById(id);
      if (cachedContact) {
        console.log('Using cached contact');
        return cachedContact;
      }
      
      return null;
    }
  }

  /**
   * Convert a native contact to lead format
   * @param {Object} contact - Native contact object
   * @returns {Object} Lead-formatted contact
   */
  convertContactToLead(contact) {
    // Extract primary phone
    let primaryPhone = null;
    if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
      primaryPhone = contact.phoneNumbers[0].number;
    }
    
    // Extract primary email
    let primaryEmail = null;
    if (contact.emails && contact.emails.length > 0) {
      primaryEmail = contact.emails[0].email;
    }
    
    // Extract address components
    let address = null;
    let city = null;
    let state = null;
    let postalCode = null;
    let country = null;
    
    if (contact.addresses && contact.addresses.length > 0) {
      const primaryAddress = contact.addresses[0];
      address = primaryAddress.street || '';
      city = primaryAddress.city || '';
      state = primaryAddress.region || '';
      postalCode = primaryAddress.postalCode || '';
      country = primaryAddress.country || '';
    }
    
    // Format name fields
    const firstName = contact.firstName || '';
    const lastName = contact.lastName || '';
    
    // Create lead object
    return {
      // Use contact ID as external reference
      externalId: contact.id,
      // Name fields
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`.trim(),
      // Contact details
      email: primaryEmail,
      phone: primaryPhone,
      // Company info
      company: contact.company || '',
      jobTitle: contact.jobTitle || '',
      // Address fields
      address,
      city,
      state,
      postalCode,
      country,
      // Default lead values
      status: 'new',
      source: 'contact-import',
      priority: 3,
      notes: contact.note || '',
      // Metadata
      contactImported: true,
      contactImportDate: new Date().toISOString()
    };
  }

  /**
   * Convert multiple contacts to lead format
   * @param {Array} contacts - Array of native contact objects
   * @returns {Array} Array of lead-formatted contacts
   */
  convertContactsToLeads(contacts) {
    return contacts.map(contact => this.convertContactToLead(contact));
  }

  /**
   * Cache contacts for offline access
   * @param {Array} contacts - Array of contact objects
   */
  async cacheContacts(contacts) {
    try {
      const now = new Date().getTime();
      const cacheData = {
        timestamp: now,
        data: contacts
      };
      
      await AsyncStorage.setItem(this.cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error caching contacts:', error);
    }
  }

  /**
   * Get cached contacts
   * @returns {Promise<Array>} Array of cached contacts or empty array
   */
  async getCachedContacts() {
    try {
      const cachedData = await AsyncStorage.getItem(this.cacheKey);
      if (!cachedData) return [];
      
      const { timestamp, data } = JSON.parse(cachedData);
      const now = new Date().getTime();
      
      // Check if cache is expired (1 day)
      if (now - timestamp > 24 * 60 * 60 * 1000) {
        return [];
      }
      
      return data;
    } catch (error) {
      console.error('Error getting cached contacts:', error);
      return [];
    }
  }

  /**
   * Get a specific contact from cache
   * @param {string} id - Contact ID
   * @returns {Promise<Object|null>} Cached contact or null
   */
  async getCachedContactById(id) {
    try {
      const contacts = await this.getCachedContacts();
      return contacts.find(contact => contact.id === id) || null;
    } catch (error) {
      console.error(`Error getting cached contact ${id}:`, error);
      return null;
    }
  }

  /**
   * Clear the contacts cache
   */
  async clearCache() {
    try {
      await AsyncStorage.removeItem(this.cacheKey);
    } catch (error) {
      console.error('Error clearing contacts cache:', error);
    }
  }

  /**
   * Filter contacts based on search query
   * @param {Array} contacts - Array of contacts
   * @param {string} query - Search query
   * @returns {Array} Filtered contacts
   */
  filterContacts(contacts, query) {
    if (!query || query.trim() === '') {
      return contacts;
    }
    
    const normalizedQuery = query.toLowerCase().trim();
    
    return contacts.filter(contact => {
      // Search by name
      if (contact.name && contact.name.toLowerCase().includes(normalizedQuery)) {
        return true;
      }
      
      // Search by first name
      if (contact.firstName && contact.firstName.toLowerCase().includes(normalizedQuery)) {
        return true;
      }
      
      // Search by last name
      if (contact.lastName && contact.lastName.toLowerCase().includes(normalizedQuery)) {
        return true;
      }
      
      // Search by company
      if (contact.company && contact.company.toLowerCase().includes(normalizedQuery)) {
        return true;
      }
      
      // Search by phone numbers
      if (contact.phoneNumbers && contact.phoneNumbers.some(
        phone => phone.number && phone.number.includes(normalizedQuery)
      )) {
        return true;
      }
      
      // Search by emails
      if (contact.emails && contact.emails.some(
        email => email.email && email.email.toLowerCase().includes(normalizedQuery)
      )) {
        return true;
      }
      
      return false;
    });
  }
}

export default ContactsAdapter;