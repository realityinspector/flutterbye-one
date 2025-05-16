import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import OrganizationsScreen from '../screens/Organizations';
import OrganizationDetailsScreen from '../screens/OrganizationDetails';

// Define the navigation parameters
export type TeamStackParamList = {
  Organizations: undefined;
  OrganizationDetails: { orgId: number };
};

const Stack = createStackNavigator<TeamStackParamList>();

/**
 * Team Stack Navigator
 * Navigation stack for organization and team management
 */
const TeamStackNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Organizations"
      screenOptions={{
        headerShown: true,
        headerTitleAlign: 'center',
      }}
    >
      <Stack.Screen 
        name="Organizations" 
        component={OrganizationsScreen} 
        options={{
          title: 'My Teams',
        }}
      />
      <Stack.Screen 
        name="OrganizationDetails" 
        component={OrganizationDetailsScreen}
        options={{
          title: 'Team Details',
        }}
      />
    </Stack.Navigator>
  );
};

export default TeamStackNavigator;