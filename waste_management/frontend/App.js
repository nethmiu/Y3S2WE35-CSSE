import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StripeProvider } from '@stripe/stripe-react-native';
import { Ionicons } from '@expo/vector-icons';

import config from './config';

// Screens
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import ManagerScreen from './screens/ManagerScreen';
import AddSpecialCollectionScreen from './screens/AddSpecialCollectionScreen';
import MapScreen from './screens/MapScreen';
import PaymentScreen from './screens/PaymentScreen';
import SummaryScreen from './screens/SummaryScreen';
import ScheduleScreen from './screens/ScheduleScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Bottom Tab Navigator එක නිර්මාණය කිරීම
function MainUserTabs({ route }) {
  // Route parameters ලබාගන්න
  const userDetails = route?.params?.userDetails;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Schedule') {
            iconName = focused ? 'list' : 'list-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2ecc71',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        initialParams={{ userDetails }} 
      />
      <Tab.Screen 
        name="Schedule" 
        component={ScheduleScreen}
        initialParams={{ userDetails }}
      />
    </Tab.Navigator>
  );
}

// ප්‍රධාන App Component එක
export default function App() {
  return (
    <StripeProvider publishableKey={config.STRIPE_PUBLISHABLE_KEY}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Login">
          {/* Login සහ අනෙකුත් ප්‍රධාන තිර */}
          <Stack.Screen 
            name="Login" 
            component={LoginScreen} 
            options={{ headerShown: false }} 
          />
          
          {/* MainUserTabs - userDetails parameters සමග */}
          <Stack.Screen 
            name="MainUserTabs" 
            component={MainUserTabs} 
            options={{ headerShown: false }} 
          />
          
          {/* අනෙකුත් screens සඳහා header පෙන්වනවා */}
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