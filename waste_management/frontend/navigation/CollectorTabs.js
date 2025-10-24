import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Import screens
import CollectorDashboard from '../screens/CollectorDashboard';
import QRScannerScreen from '../screens/QRScannerScreen';
import CollectorProfileScreen from '../screens/CollectorProfileScreen';

const Tab = createBottomTabNavigator();

function CollectorTabs({ route }) {
  const userDetails = route?.params?.userDetails;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          
          if (route.name === 'CollectorDashboard') {
            iconName = focused ? 'speedometer' : 'speedometer-outline';
          } else if (route.name === 'QRScanner') {
            iconName = focused ? 'qr-code' : 'qr-code-outline';
          } else if (route.name === 'CollectorProfile') {
            iconName = focused ? 'person' : 'person-outline';
          }
          
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#0e5cecff',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
        
      })}
    >
      <Tab.Screen 
        name="CollectorDashboard" 
        component={CollectorDashboard}
        initialParams={{ userDetails }} 
        options={{ 
          title: 'Dashboard',
          tabBarLabel: 'Dashboard'
        }}
      />
      <Tab.Screen 
        name="QRScanner" 
        component={QRScannerScreen}
        initialParams={{ userDetails }}
        options={{ 
          title: 'Scan QR',
          tabBarLabel: 'Scan QR'
        }}
      />
      <Tab.Screen 
        name="CollectorProfile" 
        component={CollectorProfileScreen}
        initialParams={{ userDetails }}
        options={{ 
          title: 'Profile',
          tabBarLabel: 'Profile'
        }}
      />
    </Tab.Navigator>
  );
}

export default CollectorTabs;