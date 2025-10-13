import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StripeProvider } from '@stripe/stripe-react-native';

// config ගොනුව import කිරීම අත්‍යවශ්‍ය වේ
import config from './config';

import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import ManagerScreen from './screens/ManagerScreen';
import AddSpecialCollectionScreen from './screens/AddSpecialCollectionScreen';
import MapScreen from './screens/MapScreen';
import PaymentScreen from './screens/PaymentScreen';
import SummaryScreen from './screens/SummaryScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    // StripeProvider wrap with my publishable key
    <StripeProvider publishableKey={config.STRIPE_PUBLISHABLE_KEY}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Login">
          <Stack.Screen 
            name="Login" 
            component={LoginScreen} 
            // remove header for Login screen
            options={{ headerShown: false }} 
          />
          <Stack.Screen 
            name="Home" 
            component={HomeScreen}
            options={{ title: 'Home' }}
          />
          <Stack.Screen 
            name="Manager" 
            component={ManagerScreen} 
            options={{ title: 'Manager Dashboard' }}
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