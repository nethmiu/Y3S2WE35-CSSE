import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

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
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ title: 'Login' }} 
        />
        <Stack.Screen 
          name="Home" 
          component={HomeScreen}
          options={{ headerShown: false }} // Header එක සඟවමු
        />
        <Stack.Screen 
          name="Manager" 
          component={ManagerScreen} 
          options={{ headerShown: false }} // Header එක සඟවමු
        />

        <Stack.Screen name="AddSpecialCollection" component={AddSpecialCollectionScreen} options={{ title: 'New Schedule' }} />
        <Stack.Screen name="Map" component={MapScreen} options={{ title: 'Select Location' }} />
        <Stack.Screen name="Payment" component={PaymentScreen} options={{ title: 'Payment' }} />
        <Stack.Screen name="Summary" component={SummaryScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}