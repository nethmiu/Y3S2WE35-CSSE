import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import ManagerScreen from './screens/ManagerScreen';

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
      </Stack.Navigator>
    </NavigationContainer>
  );
}