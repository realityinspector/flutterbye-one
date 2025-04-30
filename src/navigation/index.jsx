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
import HomeScreen from '../screens/HomeScreen';
import CallQueueScreen from '../screens/CallQueueScreen';
import LeadFormScreen from '../screens/LeadFormScreen';

// Import lead screens
import LeadsListScreen from '../screens/leads/LeadsListScreen';
import LeadDetailScreen from '../screens/leads/LeadDetailScreen';

// Import call screens
import CallScreen from '../screens/calls/CallScreen';
import CallHistoryScreen from '../screens/calls/CallHistoryScreen';

// Import settings screens
import ProfileScreen from '../screens/settings/ProfileScreen';

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

          if (route.name === 'Home') {
            iconName = 'home';
          } else if (route.name === 'CallQueue') {
            iconName = 'phone';
          } else if (route.name === 'Leads') {
            iconName = 'users';
          } else if (route.name === 'Reports') {
            iconName = 'bar-chart-2';
          } else if (route.name === 'Profile') {
            iconName = 'user';
          }

          return <Icon as={Feather} name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#0066ff',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ title: 'Home' }}
      />
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
        name="Reports" 
        component={ReportsStackNavigator} 
        options={{ title: 'Reports' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileStackNavigator} 
        options={{ title: 'Profile' }}
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

// Reports stack navigator
const ReportsStack = createStackNavigator();
const ReportsStackNavigator = () => {
  return (
    <ReportsStack.Navigator screenOptions={{ headerShown: false }}>
      <ReportsStack.Screen name="ReportsDashboard" component={AnalyticsScreen} />
    </ReportsStack.Navigator>
  );
};

// Profile stack navigator
const ProfileStack = createStackNavigator();
const ProfileStackNavigator = () => {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileScreen" component={ProfileScreen} />
    </ProfileStack.Navigator>
  );
};

// Placeholder screens for incomplete features
const AnalyticsScreen = () => <EmptyScreen title="Analytics Dashboard" />;
const RemindersScreen = () => <EmptyScreen title="Reminders" />;
const GenerateLeadsScreen = () => <EmptyScreen title="Generate Leads" />;

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
              <Stack.Screen name="CallHistory" component={CallHistoryScreen} />
              <Stack.Screen name="LeadForm" component={LeadFormScreen} />
              <Stack.Screen name="LeadDetail" component={LeadDetailScreen} />
              <Stack.Screen name="Reminders" component={RemindersScreen} />
              <Stack.Screen name="GenerateLeads" component={GenerateLeadsScreen} />
            </>
          )}
        </>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
