import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StripeProvider } from '@stripe/stripe-react-native';

import config from './config';

// Import navigation components
import { MainUserTabs, CollectorTabs } from './navigation';

// Import screens
import LoginScreen from './screens/LoginScreen';
import ManagerScreen from './screens/ManagerScreen';
import AddSpecialCollectionScreen from './screens/AddSpecialCollectionScreen';
import MapScreen from './screens/MapScreen';
import PaymentScreen from './screens/PaymentScreen';
import SummaryScreen from './screens/SummaryScreen';
import CollectionScheduleScreen from './screens/CollectionScheduleScreen';

const Stack = createStackNavigator();

// Main App Component
export default function App() {
  return (
    <StripeProvider publishableKey={config.STRIPE_PUBLISHABLE_KEY}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Login">
          {/* Login Screen */}
          <Stack.Screen 
            name="Login" 
            component={LoginScreen} 
            options={{ headerShown: false }} 
          />
          
          {/* Regular User Tabs */}
          <Stack.Screen 
            name="MainUserTabs" 
            component={MainUserTabs} 
            options={{ headerShown: false }} 
          />

          {/* Collector Tabs */}
          <Stack.Screen 
            name="CollectorTabs" 
            component={CollectorTabs} 
            options={{ headerShown: false }} 
          />
          
          {/* Other Screens */}
          <Stack.Screen 
            name="Manager" 
            component={ManagerScreen} 
            options={{ title: 'Manager Dashboard' }} 
          />
          <Stack.Screen 
            name="CollectionSchedule" 
            component={CollectionScheduleScreen} 
            options={{ title: 'Collection Schedule' }} 
          />
          <Stack.Screen 
            name="AddSpecialCollection" 
            component={AddSpecialCollectionScreen} 
            options={{ title: 'New Schedule' }} 
          />
          <Stack.Screen 
            name="Map" 
            component={MapScreen} 
            options={{ title: 'Select Location' }} 
          />
          <Stack.Screen 
            name="Payment" 
            component={PaymentScreen} 
            options={{ title: 'Payment' }} 
          />
          <Stack.Screen 
            name="Summary" 
            component={SummaryScreen} 
            options={{ headerShown: false }} 
          />
        </Stack.Navigator>
      </NavigationContainer>
    </StripeProvider>
  );
}