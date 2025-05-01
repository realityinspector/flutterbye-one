import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { Icon } from 'native-base';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';

// Import screens
import AuthScreen from '../screens/AuthScreen';
import AdminSetupScreen from '../screens/AdminSetupScreen';
import UserSetupScreen from '../screens/UserSetupScreen';
import HomeScreen from '../screens/HomeScreen';

// Import lead screens
import LeadsListScreen from '../screens/leads/LeadsListScreen';
import LeadDetailScreen from '../screens/leads/LeadDetailScreen';
import AddLeadScreen from '../screens/leads/AddLeadScreen';

// Import call screens
import CallScreen from '../screens/calls/CallScreen';
import CallHistoryScreen from '../screens/calls/CallHistoryScreen';

// Empty screen component
import { Center, Heading, Box, VStack, Text, Badge } from 'native-base';

// Create navigator
const Stack = createStackNavigator();

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

// Main app navigator with flattened structure
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
    <Stack.Navigator 
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#0066ff',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      {!isAuthenticated ? (
        // Auth screens
        <Stack.Screen 
          name="Auth" 
          component={AuthScreen} 
          options={{ headerShown: false }}
        />
      ) : (
        // Authenticated screens
        <>
          {user.isAdmin && !user.hasCompletedSetup ? (
            <Stack.Screen 
              name="AdminSetup" 
              component={AdminSetupScreen} 
              options={{ title: 'Admin Setup', headerShown: false }}
            />
          ) : !user.hasCompletedSetup ? (
            <Stack.Screen 
              name="UserSetup" 
              component={UserSetupScreen} 
              options={{ title: 'Setup Your Account', headerShown: false }}
            />
          ) : (
            <>
              {/* Core Screens in the walking slice */}
              <Stack.Screen 
                name="Home" 
                component={HomeScreen} 
                options={{ title: 'Walk N Talk CRM' }}
              />
              <Stack.Screen 
                name="Leads" 
                component={LeadsListScreen} 
                options={{ title: 'Your Leads' }}
              />
              <Stack.Screen 
                name="LeadDetail" 
                component={LeadDetailScreen} 
                options={{ title: 'Lead Details' }}
              />
              <Stack.Screen 
                name="CallLog" 
                component={CallHistoryScreen} 
                options={{ title: 'Call History' }}
              />
              <Stack.Screen 
                name="Call" 
                component={CallScreen} 
                options={{ title: 'New Call' }}
              />
              <Stack.Screen 
                name="AddLead" 
                component={AddLeadScreen} 
                options={{ title: 'Add New Lead' }}
              />
              
              {/* Coming Soon screens */}
              <Stack.Screen 
                name="Reminders" 
                component={RemindersScreen} 
                options={{ title: 'Reminders' }}
              />
              <Stack.Screen 
                name="GenerateLeads" 
                component={GenerateLeadsScreen} 
                options={{ title: 'Generate Leads' }}
              />
              <Stack.Screen 
                name="Profile" 
                component={ProfileScreen} 
                options={{ title: 'Your Profile' }}
              />
              <Stack.Screen 
                name="Reports" 
                component={AnalyticsScreen} 
                options={{ title: 'Analytics' }}
              />
            </>
          )}
        </>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
