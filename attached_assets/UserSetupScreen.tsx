import React from 'react';
import { useNavigation } from '@react-navigation/native';
import SetupWizard from '../components/SetupWizard';
import UserSetupForm from '../components/UserSetupForm';

const UserSetupScreen = () => {
  const navigation = useNavigation();

  const handleSetupComplete = () => {
    // Navigate to the main app
    navigation.reset({
      index: 0,
      routes: [{ name: 'App' as never }],
    });
  };

  const handleSkipSetup = () => {
    // Navigate to the main app but mark that setup was skipped
    navigation.reset({
      index: 0,
      routes: [{ name: 'App' as never }],
    });
  };

  // Define setup steps for regular users
  const setupSteps = [
    {
      title: 'Complete Your Profile',
      description: 'Personalize your WALK&TALK experience',
      content: (
        <UserSetupForm onComplete={handleSetupComplete} />
      ),
    },
  ];

  return (
    <SetupWizard
      steps={setupSteps}
      onComplete={handleSetupComplete}
      onSkip={handleSkipSetup}
      allowSkip={true}
    />
  );
};

export default UserSetupScreen;
