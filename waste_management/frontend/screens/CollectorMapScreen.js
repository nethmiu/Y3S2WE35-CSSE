import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import axios from 'axios';
import config from '../config';
import { Linking } from 'react-native';

const { width, height } = Dimensions.get('window');
const API_URL = `http://${config.IP}:${config.PORT}/api/collector`;

export default function CollectorMapScreen({ route, navigation }) {
  const { userDetails, schedule } = route.params;
  const mapRef = useRef(null);
  
  const [currentLocation, setCurrentLocation] = useState(null);
  const [binLocation, setBinLocation] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [distance, setDistance] = useState(null);
  const [estimatedTime, setEstimatedTime] = useState(null);

  // Get current location
  const getCurrentLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please enable location permissions to use this feature.');
        return;
      }

      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });

      const { latitude, longitude } = location.coords;
      setCurrentLocation({
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });

      return { latitude, longitude };
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Unable to get your current location');
    }
  };

  // Get bin location from schedule
  const getBinLocation = () => {
    if (!schedule || !schedule.bins || schedule.bins.length === 0) {
      Alert.alert('Error', 'No bin location information available');
      return null;
    }

    // Use the first bin's location
    const firstBin = schedule.bins[0];
    if (!firstBin.location || !firstBin.location.latitude || !firstBin.location.longitude) {
      Alert.alert('Error', 'Bin location coordinates not available');
      return null;
    }

    const binLoc = {
      latitude: firstBin.location.latitude,
      longitude: firstBin.location.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };

    setBinLocation(binLoc);
    return binLoc;
  };

  // Calculate route between current location and bin
  const calculateRoute = async (startLoc, endLoc) => {
    try {
      // Using OpenStreetMap Nominatim for route calculation (free)
      const response = await axios.get(
        `https://router.project-osrm.org/route/v1/driving/${startLoc.longitude},${startLoc.latitude};${endLoc.longitude},${endLoc.latitude}?overview=full&geometries=geojson`
      );

      if (response.data.routes && response.data.routes.length > 0) {
        const route = response.data.routes[0];
        const coordinates = route.geometry.coordinates.map(coord => ({
          latitude: coord[1],
          longitude: coord[0],
        }));

        setRouteCoordinates(coordinates);
        setDistance((route.distance / 1000).toFixed(1)); // Convert to km
        setEstimatedTime(Math.ceil(route.duration / 60)); // Convert to minutes

        // Fit map to show entire route
        if (mapRef.current) {
          mapRef.current.fitToCoordinates(coordinates, {
            edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
            animated: true,
          });
        }
      }
    } catch (error) {
      console.error('Error calculating route:', error);
      // Fallback: draw straight line if routing fails
      setRouteCoordinates([startLoc, endLoc]);
      calculateStraightLineDistance(startLoc, endLoc);
    }
  };

  // Calculate straight line distance as fallback
  const calculateStraightLineDistance = (startLoc, endLoc) => {
    const R = 6371; // Earth's radius in km
    const dLat = (endLoc.latitude - startLoc.latitude) * Math.PI / 180;
    const dLon = (endLoc.longitude - startLoc.longitude) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(startLoc.latitude * Math.PI / 180) * Math.cos(endLoc.latitude * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    setDistance(distance.toFixed(1));
    setEstimatedTime(Math.ceil(distance * 2)); // Rough estimate: 2 min per km
  };

  // Initialize map
  const initializeMap = async () => {
    setLoading(true);
    
    const currentLoc = await getCurrentLocation();
    const binLoc = getBinLocation();

    if (currentLoc && binLoc) {
      await calculateRoute(currentLoc, binLoc);
    }

    setLoading(false);
  };

  // Start navigation in external app
  const startExternalNavigation = () => {
    if (!binLocation) return;

    const { latitude, longitude } = binLocation;
    
    // Open in Google Maps
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
    
    // Open in Apple Maps (iOS)
    const appleMapsUrl = `http://maps.apple.com/?daddr=${latitude},${longitude}&dirflg=d`;

    Alert.alert(
      'Open Navigation',
      'Choose navigation app:',
      [
        {
          text: 'Google Maps',
          onPress: () => Linking.openURL(googleMapsUrl).catch(() => 
            Alert.alert('Error', 'Could not open Google Maps')
          ),
        },
        {
          text: 'Apple Maps',
          onPress: () => Linking.openURL(appleMapsUrl).catch(() => 
            Alert.alert('Error', 'Could not open Apple Maps')
          ),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  // Refresh location
  const refreshLocation = async () => {
    setLoading(true);
    await getCurrentLocation();
    setLoading(false);
  };

  useEffect(() => {
    initializeMap();
    
    // Update location every 30 seconds
    const locationInterval = setInterval(() => {
      getCurrentLocation();
    }, 30000);

    return () => clearInterval(locationInterval);
  }, []);

  // Helper functions
  const getBinNames = (schedule) => {
    if (!schedule.bins || schedule.bins.length === 0) return 'Unknown Bin';
    if (schedule.bins.length === 1) return schedule.bins[0].binName || 'Unknown Bin';
    return `${schedule.bins.length} Bins`;
  };

  const getFirstBinAddress = (schedule) => {
    if (!schedule.bins || schedule.bins.length === 0) return 'No address';
    return schedule.bins[0].location?.address || 'No address specified';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Navigation</Text>
          <Text style={styles.subtitle}>{getBinNames(schedule)}</Text>
        </View>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={refreshLocation}
          disabled={loading}
        >
          <Ionicons 
            name="refresh" 
            size={20} 
            color="#fff" 
          />
        </TouchableOpacity>
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        {currentLocation && (
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={currentLocation}
            showsUserLocation={true}
            showsMyLocationButton={true}
            followsUserLocation={true}
          >
            {/* Current Location Marker */}
            {currentLocation && (
              <Marker
                coordinate={currentLocation}
                title="Your Location"
                description="You are here"
              >
                <View style={styles.currentLocationMarker}>
                  <Ionicons name="location" size={20} color="#3498db" />
                </View>
              </Marker>
            )}

            {/* Bin Location Marker */}
            {binLocation && (
              <Marker
                coordinate={binLocation}
                title={getBinNames(schedule)}
                description={getFirstBinAddress(schedule)}
                pinColor="#27ae60"
              >
                <View style={styles.binLocationMarker}>
                  <Ionicons name="trash" size={16} color="#fff" />
                </View>
              </Marker>
            )}

            {/* Route Polyline */}
            {routeCoordinates.length > 0 && (
              <Polyline
                coordinates={routeCoordinates}
                strokeColor="#3498db"
                strokeWidth={4}
                lineDashPattern={[1]}
              />
            )}
          </MapView>
        )}

        {loading && (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingBox}>
              <Ionicons name="navigate" size={32} color="#3498db" />
              <Text style={styles.loadingText}>Calculating route...</Text>
            </View>
          </View>
        )}
      </View>

      {/* Bottom Info Panel */}
      <View style={styles.infoPanel}>
        <View style={styles.routeInfo}>
          <View style={styles.infoItem}>
            <Ionicons name="distance" size={20} color="#3498db" />
            <Text style={styles.infoText}>
              {distance ? `${distance} km` : 'Calculating...'}
            </Text>
          </View>
          
          <View style={styles.infoItem}>
            <Ionicons name="time" size={20} color="#f39c12" />
            <Text style={styles.infoText}>
              {estimatedTime ? `~${estimatedTime} min` : 'Calculating...'}
            </Text>
          </View>
          
          <View style={styles.infoItem}>
            <Ionicons name="location" size={20} color="#27ae60" />
            <Text style={styles.infoText} numberOfLines={1}>
              {getFirstBinAddress(schedule)}
            </Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.navButton}
            onPress={startExternalNavigation}
            disabled={!binLocation}
          >
            <Ionicons name="navigate" size={20} color="#fff" />
            <Text style={styles.navButtonText}>Start Navigation</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('QRScanner', { 
              userDetails,
              preSelectedSchedule: schedule 
            })}
          >
            <Ionicons name="qr-code" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Scan QR</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#0e5cecff',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    padding: 4,
  },
  headerContent: {
    flex: 1,
    marginHorizontal: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
    marginTop: 2,
  },
  refreshButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingBox: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
  },
  currentLocationMarker: {
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#3498db',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  binLocationMarker: {
    backgroundColor: '#27ae60',
    padding: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  infoPanel: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  routeInfo: {
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#2c3e50',
    marginLeft: 8,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  navButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#27ae60',
    padding: 16,
    borderRadius: 12,
  },
  navButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3498db',
    padding: 16,
    borderRadius: 12,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
});