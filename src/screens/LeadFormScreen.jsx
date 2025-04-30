import React from 'react';
import { Box } from 'native-base';
import { useNavigation } from '@react-navigation/native';
import LeadForm from '../components/LeadForm';

const LeadFormScreen = ({ route }) => {
  const navigation = useNavigation();
  const leadId = route?.params?.leadId;
  
  const handleSuccess = () => {
    navigation.goBack();
  };
  
  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <Box flex={1} bg="white" safeArea>
      <LeadForm 
        leadId={leadId}
        onSuccess={handleSuccess} 
        onCancel={handleCancel} 
      />
    </Box>
  );
};

export default LeadFormScreen;
