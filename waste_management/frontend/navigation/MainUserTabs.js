import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Import screens
import DashboardScreen from '../screens/DashboardScreen';
import ScheduleScreen from '../screens/ScheduleScreen';
import HomeScreen from '../screens/HomeScreen';

const Tab = createBottomTabNavigator();

function MainUserTabs({ route }) {
  const userDetails = route?.params?.userDetails;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Dashboard') {
            iconName = focused ? 'speedometer' : 'speedometer-outline';
          } else if (route.name === 'Schedule') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Home') {
            iconName = focused ? 'person' : 'person-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#099928ff',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Schedule" 
        component={ScheduleScreen}
        initialParams={{ userDetails }}
        options={{ title: 'My Schedule' }}
      />
      
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        initialParams={{ userDetails }} 
        options={{ title: 'Regular' }}
      />
      
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        initialParams={{ userDetails }}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

export default MainUserTabs;