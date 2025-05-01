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

// Import lead screens
import LeadsListScreen from '../screens/leads/LeadsListScreen';
import LeadDetailScreen from '../screens/leads/LeadDetailScreen';
import AddLeadScreen from '../screens/leads/AddLeadScreen';

// Import call screens
import CallScreen from '../screens/calls/CallScreen';
import CallHistoryScreen from '../screens/calls/CallHistoryScreen';

// Empty screen component
import { Center, Heading, Box, VStack, Text, Badge } from 'native-base';

// Create navigators
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Coming Soon screen component
const ComingSoonScreen = ({ title, feature }) => (
  <Box flex={1} bg="white" safeArea>
    <Center flex={1}>
      <VStack space={4} alignItems="center">
        <Badge colorScheme="info" variant="solid" rounded="full" px={3} py={1}>
          <Text color="white" fontSize="sm" fontWeight="bold">COMING SOON</Text>
        </Badge>
        <Heading color="gray.700" size="lg">{title}</Heading>
        <Text color="gray.500" textAlign="center" px={6}>
          {feature} functionality will be available in an upcoming release.
        </Text>
        <Icon as={Feather} name="clock" size="xl" color="gray.400" mt={4} />
      </VStack>
    </Center>
  </Box>
);

// Placeholder screens for features not in walking slice
const ProfileScreen = () => <ComingSoonScreen title="User Profile" feature="Profile management" />;
const AnalyticsScreen = () => <ComingSoonScreen title="Analytics Dashboard" feature="Reporting and analytics" />;
const RemindersScreen = () => <ComingSoonScreen title="Reminders" feature="Reminder management" />;
const GenerateLeadsScreen = () => <ComingSoonScreen title="Generate Leads" feature="Lead generation" />;

// Main tab navigator - Cut down to essential screens
const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = 'home';
          } else if (route.name === 'Calls') {
            iconName = 'phone';
          } else if (route.name === 'Leads') {
            iconName = 'users';
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
        name="Leads" 
        component={LeadStackNavigator} 
        options={{ title: 'Leads' }}
      />
      <Tab.Screen 
        name="Calls" 
        component={CallHistoryScreen} 
        options={{ title: 'Calls' }}
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
      <LeadStack.Screen name="LeadForm" component={AddLeadScreen} />
    </LeadStack.Navigator>
  );
};

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
              <Stack.Screen name="LeadForm" component={AddLeadScreen} />
              <Stack.Screen name="LeadDetail" component={LeadDetailScreen} />
              <Stack.Screen name="Reminders" component={RemindersScreen} />
              <Stack.Screen name="GenerateLeads" component={GenerateLeadsScreen} />
              <Stack.Screen name="Profile" component={ProfileScreen} />
              <Stack.Screen name="Reports" component={AnalyticsScreen} />
            </>
          )}
        </>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
