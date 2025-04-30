import { Alert, Linking, Platform } from 'react-native';
import * as Contacts from 'expo-contacts';

// Function to make a phone call
export const makePhoneCall = async (phoneNumber) => {
  try {
    // Format the phone number
    const formattedPhoneNumber = phoneNumber.replace(/[^\d+]/g, '');
    const url = `tel:${formattedPhoneNumber}`;
    
    // Check if the URL can be opened
    const canOpen = await Linking.canOpenURL(url);
    
    if (canOpen) {
      await Linking.openURL(url);
      return true;
    } else {
      Alert.alert('Error', 'Cannot make a phone call at this time');
      return false;
    }
  } catch (error) {
    console.error('Error making phone call:', error);
    Alert.alert('Error', 'Failed to make a phone call');
    return false;
  }
};

// Function to request contacts permission
export const requestContactsPermission = async () => {
  try {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status === 'granted') {
      return true;
    } else {
      Alert.alert(
        'Permission Required',
        'This feature requires contacts permission. Please enable it in your settings.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Settings',
            onPress: () => Linking.openSettings(),
          },
        ]
      );
      return false;
    }
  } catch (error) {
    console.error('Error requesting contacts permission:', error);
    return false;
  }
};

// Function to get contacts from device
export const getContacts = async () => {
  try {
    const hasPermission = await requestContactsPermission();
    
    if (hasPermission) {
      const { data } = await Contacts.getContactsAsync({
        fields: [
          Contacts.Fields.Name,
          Contacts.Fields.PhoneNumbers,
          Contacts.Fields.Emails,
          Contacts.Fields.Company,
        ],
      });
      
      return data.filter(contact => contact.phoneNumbers && contact.phoneNumbers.length > 0);
    }
    
    return [];
  } catch (error) {
    console.error('Error retrieving contacts:', error);
    return [];
  }
};
