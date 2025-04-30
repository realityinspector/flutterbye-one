import React from 'react';
import { useNavigation } from '@react-navigation/native';
import SetupWizard from '../components/SetupWizard';
import AdminSetupForm from '../components/AdminSetupForm';

const AdminSetupScreen = () => {
  const navigation = useNavigation();

  const handleSetupComplete = () => {
    // Navigate to the main app
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main' }],
    });
  };

  // Define setup steps for admin
  const setupSteps = [
    {
      title: 'Welcome to WALK&TALK',
      description: 'Let\'s set up your sales acceleration platform',
      content: (
        <AdminSetupForm onComplete={handleSetupComplete} />
      ),
    },
  ];

  return (
    <SetupWizard
      steps={setupSteps}
      onComplete={handleSetupComplete}
    />
  );
};

export default AdminSetupScreen;
