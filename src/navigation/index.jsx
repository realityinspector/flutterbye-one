import React, { useEffect } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Icon } from 'native-base';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';

// Import screens
import AuthScreen from '../screens/AuthScreen';
import AdminSetupScreen from '../screens/AdminSetupScreen';
import UserSetupScreen from '../screens/UserSetupScreen';
import CallQueueScreen from '../screens/CallQueueScreen';
import LeadFormScreen from '../screens/LeadFormScreen';

// Create navigators
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Main tab navigator
const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;

          if (route.name === 'CallQueue') {
            iconName = 'phone';
          } else if (route.name === 'Leads') {
            iconName = 'users';
          } else if (route.name === 'Analytics') {
            iconName = 'bar-chart-2';
          } else if (route.name === 'Settings') {
            iconName = 'settings';
          }

          return <Icon as={Feather} name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#0066ff',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="CallQueue" 
        component={CallQueueScreen} 
        options={{ title: 'Call Queue' }}
      />
      <Tab.Screen 
        name="Leads" 
        component={LeadStackNavigator} 
        options={{ title: 'Leads' }}
      />
      <Tab.Screen 
        name="Analytics" 
        component={AnalyticsScreen} 
        options={{ title: 'Analytics' }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen} 
        options={{ title: 'Settings' }}
      />
    </Tab.Navigator>
  );
};

// Leads stack navigator
const LeadStack = createStackNavigator();
const LeadStackNavigator = () => {
  return (
    <LeadStack.Navigator screenOptions={{ headerShown: false }}>
      <LeadStack.Screen name="LeadsList" component={LeadsListScreen} />
      <LeadStack.Screen name="LeadDetail" component={LeadDetailScreen} />
      <LeadStack.Screen name="LeadForm" component={LeadFormScreen} />
    </LeadStack.Navigator>
  );
};

// Placeholder screens
const LeadsListScreen = () => <EmptyScreen title="Leads List" />;
const LeadDetailScreen = () => <EmptyScreen title="Lead Detail" />;
const AnalyticsScreen = () => <EmptyScreen title="Analytics" />;
const SettingsScreen = () => <EmptyScreen title="Settings" />;
const CallScreen = () => <EmptyScreen title="Active Call" />;

// Empty screen component
import { Center, Heading, Box } from 'native-base';
const EmptyScreen = ({ title }) => (
  <Box flex={1} bg="white" safeArea>
    <Center flex={1}>
      <Heading color="gray.500">{title}</Heading>
    </Center>
  </Box>
);

// Main app navigator
const AppNavigator = () => {
  const { user, isLoading, isAuthenticated } = useAuth();
  
  if (isLoading) {
    return (
      <Box flex={1} bg="white" safeArea>
        <Center flex={1}>
          <Heading color="gray.500">Loading...</Heading>
        </Center>
      </Box>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        // Auth screens
        <Stack.Screen name="Auth" component={AuthScreen} />
      ) : (
        // Authenticated screens
        <>
          {user.isAdmin && !user.hasCompletedSetup ? (
            <Stack.Screen name="AdminSetup" component={AdminSetupScreen} />
          ) : !user.hasCompletedSetup ? (
            <Stack.Screen name="UserSetup" component={UserSetupScreen} />
          ) : (
            <>
              <Stack.Screen name="Main" component={TabNavigator} />
              <Stack.Screen name="Call" component={CallScreen} />
            </>
          )}
        </>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
