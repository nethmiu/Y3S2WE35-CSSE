import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Image,
  Modal,
  TextInput,
  ActivityIndicator,
  Platform
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import axios from 'axios';
import config from '../config';

const API_URL = `http://${config.IP}:${config.PORT}/api`;

export default function DashboardScreen({ route, navigation }) {
  // Safe access to userDetails with fallback
  const userDetails = route?.params?.userDetails || {};
  const [refreshing, setRefreshing] = useState(false);
  const [userBins, setUserBins] = useState([]);
  const [collectionSummary, setCollectionSummary] = useState({});
  const [recentCollections, setRecentCollections] = useState([]);
  const [showAddBinModal, setShowAddBinModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedBin, setSelectedBin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  
  // Individual loading states
  const [loadingStates, setLoadingStates] = useState({
    bins: false,
    summary: false,
    collections: false
  });

  // New bin form state
  const [newBin, setNewBin] = useState({
    binName: '',
    binType: 'general',
    capacity: '',
    address: '',
    latitude: '',
    longitude: ''
  });

  // Load user data
  const loadUserData = async () => {
    if (!userDetails._id) {
      console.log('No user ID available');
      setLoading(false);
      return;
    }

    setLoading(true);
    console.log('Loading data for user:', userDetails._id);
    
    try {
      // Load all data in parallel for better performance
      await Promise.all([
        loadUserBins(),
        loadCollectionSummary(),
        loadRecentCollections()
      ]);

    } catch (error) {
      console.log('Error loading data:', error.response?.data || error.message);
      Alert.alert('Error', 'Failed to load data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // Load user's bins
  const loadUserBins = async () => {
    setLoadingStates(prev => ({ ...prev, bins: true }));
    
    try {
      const binsResponse = await axios.get(`${API_URL}/bins/user/${userDetails._id}`);
      console.log('Bins response:', binsResponse.data);
      
      // Handle different response formats
      let binsData = [];
      if (binsResponse.data.success && binsResponse.data.data) {
        binsData = binsResponse.data.data;
      } else if (binsResponse.data.bins) {
        binsData = binsResponse.data.bins;
      } else if (Array.isArray(binsResponse.data)) {
        binsData = binsResponse.data;
      }
      
      setUserBins(binsData);
      return binsData;
    } catch (error) {
      console.error('Error loading bins:', error.response?.data || error.message);
      setUserBins([]);
      throw error;
    } finally {
      setLoadingStates(prev => ({ ...prev, bins: false }));
    }
  };

  // Load collection summary
  const loadCollectionSummary = async () => {
    setLoadingStates(prev => ({ ...prev, summary: true }));
    
    try {
      
      const summaryResponse = await axios.get(`${API_URL}/regular-collections/summary/${userDetails._id}`);
      console.log('Summary response:', summaryResponse.data);
      
      let summaryData = {};
      if (summaryResponse.data.success && summaryResponse.data.data) {
        summaryData = summaryResponse.data.data;
      } else {
        summaryData = summaryResponse.data;
      }
      
      setCollectionSummary(summaryData);
      return summaryData;
    } catch (error) {
      console.error('Error loading collection summary:', error.response?.data || error.message);
      setCollectionSummary({});
      throw error;
    } finally {
      setLoadingStates(prev => ({ ...prev, summary: false }));
    }
  };

  // Load recent collections
  const loadRecentCollections = async () => {
    setLoadingStates(prev => ({ ...prev, collections: true }));
    
    try {
       
      const collectionsResponse = await axios.get(`${API_URL}/regular-collections/user/${userDetails._id}`);
      console.log('Collections response:', collectionsResponse.data);
      
      let collectionsData = [];
      if (collectionsResponse.data.success && collectionsResponse.data.data) {
        collectionsData = collectionsResponse.data.data;
      } else if (Array.isArray(collectionsResponse.data)) {
        collectionsData = collectionsResponse.data;
      }
      
      const recentCollectionsData = collectionsData.slice(0, 5);
      setRecentCollections(recentCollectionsData);
      return recentCollectionsData;
    } catch (error) {
      console.error('Error loading recent collections:', error.response?.data || error.message);
      setRecentCollections([]);
      throw error;
    } finally {
      setLoadingStates(prev => ({ ...prev, collections: false }));
    }
  };

  // Load specific data individually (for selective refreshing)
  const refreshBins = async () => {
    try {
      const bins = await loadUserBins();
      return bins;
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh bins data');
      return [];
    }
  };

  const refreshCollections = async () => {
    try {
      const [summary, recent] = await Promise.all([
        loadCollectionSummary(),
        loadRecentCollections()
      ]);
      return { summary, recent };
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh collections data');
      return { summary: {}, recent: [] };
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserData();
    setRefreshing(false);
  };

  useEffect(() => {
    loadUserData();
  }, []);

  // Location functions
  const getCurrentLocation = async () => {
    try {
      setIsGettingLocation(true);
      
      // Request location permissions
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Please enable location permissions to use this feature.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Get current location
      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeout: 15000,
      });

      const { latitude, longitude } = location.coords;
      
      // Update bin form with coordinates
      setNewBin(prev => ({
        ...prev,
        latitude: latitude.toString(),
        longitude: longitude.toString()
      }));

      // Optionally reverse geocode to get address
      try {
        let [address] = await Location.reverseGeocodeAsync({
          latitude,
          longitude
        });
        
        if (address) {
          const formattedAddress = `${address.street || ''} ${address.name || ''}, ${address.city || ''}, ${address.region || ''}`.trim();
          if (formattedAddress && !newBin.address) {
            setNewBin(prev => ({
              ...prev,
              address: formattedAddress
            }));
          }
        }
      } catch (geocodeError) {
        console.log('Reverse geocoding failed:', geocodeError);
      }

      Alert.alert(
        'Location Found',
        `Coordinates set: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
        [{ text: 'OK' }]
      );

    } catch (error) {
      console.log('Error getting location:', error);
      Alert.alert(
        'Location Error',
        'Unable to get your current location. Please try again or select manually.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsGettingLocation(false);
    }
  };

  const openMapForLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please enable location permissions.');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      
      
      Alert.alert(
        'Current Location',
        `Use current location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Use This', 
            onPress: () => {
              setNewBin(prev => ({
                ...prev,
                latitude: latitude.toString(),
                longitude: longitude.toString()
              }));
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Unable to access location services.');
    }
  };

  // Add new bin
  const handleAddBin = async () => {
    if (!userDetails._id) {
      Alert.alert('Error', 'User information not available');
      return;
    }

    if (!newBin.binName || !newBin.capacity || !newBin.address) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    try {
      const binData = {
        userId: userDetails._id,
        binName: newBin.binName,
        binType: newBin.binType,
        capacity: parseInt(newBin.capacity),
        location: {
          address: newBin.address,
          latitude: newBin.latitude ? parseFloat(newBin.latitude) : 6.9271,
          longitude: newBin.longitude ? parseFloat(newBin.longitude) : 79.8612
        }
      };

      const response = await axios.post(`${API_URL}/bins`, binData);
      
      Alert.alert('Success', 'Bin added successfully!');
      setShowAddBinModal(false);
      resetBinForm();
      await refreshBins(); // Refresh bins data
    } catch (error) {
      console.log('Error adding bin:', error.response?.data || error.message);
      Alert.alert('Error', 'Failed to add bin. Please try again.');
    }
  };

  // Generate QR code for bin
  const handleGenerateQR = async (binId) => {
    try {
      const response = await axios.get(`${API_URL}/bins/${binId}/qrcode`);
      setSelectedBin(response.data);
      setShowQRModal(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to generate QR code');
    }
  };

  // Schedule collection for bin
  const handleScheduleCollection = (bin) => {
    navigation.navigate('CollectionSchedule', { 
      userDetails,
      preSelectedBin: bin 
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#27ae60';
      case 'scheduled': return '#3498db';
      case 'in-progress': return '#f39c12';
      case 'rejected': return '#e74c3c';
      default: return '#7f8c8d';
    }
  };

  const getBinTypeColor = (type) => {
    switch (type) {
      case 'general': return '#95a5a6';
      case 'Food': return '#27ae60';
      case 'Paper': return '#8e44ad';
      case 'Plastic': return '#e74c3c';
      default: return '#7f8c8d';
    }
  };

  const resetBinForm = () => {
    setNewBin({
      binName: '',
      binType: 'general',
      capacity: '',
      address: '',
      latitude: '',
      longitude: ''
    });
    setShowAddBinModal(false);
  };

  // Show loading or error if no user details
  if (!userDetails._id) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="warning" size={64} color="#e74c3c" />
        <Text style={styles.errorTitle}>User Information Missing</Text>
        <Text style={styles.errorText}>
          Unable to load your dashboard. Please try logging in again.
        </Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.retryButtonText}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        
        <Text style={styles.subtitle}>Welcome back, {userDetails?.email}</Text>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={['#3498db']}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3498db" />
            <Text style={styles.loadingText}>Loading your dashboard...</Text>
          </View>
        ) : (
          <>
            {/* Quick Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Ionicons name="trash" size={24} color="#3498db" />
                <Text style={styles.statNumber}>{collectionSummary.totalCollections || 0}</Text>
                <Text style={styles.statLabel}>Total Collections</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="checkmark-circle" size={24} color="#27ae60" />
                <Text style={styles.statNumber}>{collectionSummary.completed || 0}</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="time" size={24} color="#f39c12" />
                <Text style={styles.statNumber}>{collectionSummary.upcoming || 0}</Text>
                <Text style={styles.statLabel}>Upcoming</Text>
              </View>
            </View>

            {/* My Bins Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>My Bins ({userBins.length})</Text>
                <TouchableOpacity 
                  style={styles.addButton}
                  onPress={() => setShowAddBinModal(true)}
                >
                  <Ionicons name="add" size={20} color="#fff" />
                  <Text style={styles.addButtonText}>Add Bin</Text>
                </TouchableOpacity>
              </View>

              {userBins.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="trash-outline" size={48} color="#bdc3c7" />
                  <Text style={styles.emptyStateText}>No bins yet</Text>
                  <Text style={styles.emptyStateSubtext}>Add your first bin to get started</Text>
                  <TouchableOpacity 
                    style={styles.addFirstBinButton}
                    onPress={() => setShowAddBinModal(true)}
                  >
                    <Text style={styles.addFirstBinText}>Add Your First Bin</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                userBins.map((bin) => (
                  <View key={bin._id} style={styles.binCard}>
                    <View style={styles.binHeader}>
                      <View style={styles.binInfo}>
                        <Text style={styles.binName}>{bin.binName}</Text>
                        <View style={[styles.binTypeBadge, { backgroundColor: getBinTypeColor(bin.binType) }]}>
                          <Text style={styles.binTypeText}>{bin.binType}</Text>
                        </View>
                      </View>
                      <Text style={styles.binCapacity}>{bin.capacity}L</Text>
                    </View>
                    
                    <Text style={styles.binAddress}>{bin.location?.address}</Text>
                    
                    <View style={styles.binActions}>
                      <TouchableOpacity 
                        style={styles.binActionButton}
                        onPress={() => handleGenerateQR(bin._id)}
                      >
                        <Ionicons name="qr-code" size={16} color="#3498db" />
                        <Text style={styles.binActionText}>QR Code</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={styles.binActionButton}
                        onPress={() => handleScheduleCollection(bin)}
                      >
                        <Ionicons name="calendar" size={16} color="#27ae60" />
                        <Text style={styles.binActionText}>Schedule</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={styles.binActionButton}
                        onPress={() => navigation.navigate('CollectionSchedule', { userDetails })}
                      >
                        <Ionicons name="list" size={16} color="#f39c12" />
                        <Text style={styles.binActionText}>History</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>

            {/* Recent Activity */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              {recentCollections.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="time-outline" size={32} color="#bdc3c7" />
                  <Text style={styles.emptyStateText}>No recent activity</Text>
                  <Text style={styles.emptyStateSubtext}>
                    Schedule your first collection to see activity here
                  </Text>
                </View>
              ) : (
                recentCollections.map((collection) => (
                  <View key={collection._id} style={styles.activityItem}>
                    <View style={styles.activityIcon}>
                      <Ionicons name="trash" size={16} color="#fff" />
                    </View>
                    <View style={styles.activityDetails}>
                      <Text style={styles.activityTitle}>
                        {collection.bin?.binName || 'Bin'} Collection
                      </Text>
                      <Text style={styles.activityDate}>
                        {new Date(collection.scheduledDate).toLocaleDateString()} • {collection.timeSlot}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(collection.status) }]}>
                      <Text style={styles.statusText}>{collection.status}</Text>
                    </View>
                  </View>
                ))
              )}
            </View>

            {/* Quick Actions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <View style={styles.actionsGrid}>
                <TouchableOpacity 
                  style={styles.actionCard}
                  onPress={() => setShowAddBinModal(true)}
                >
                  <Ionicons name="add-circle" size={32} color="#3498db" />
                  <Text style={styles.actionCardText}>Add New Bin</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.actionCard}
                  onPress={() => navigation.navigate('CollectionSchedule', { userDetails })}
                >
                  <Ionicons name="calendar" size={32} color="#27ae60" />
                  <Text style={styles.actionCardText}>Schedule Pickup</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* Add Bin Modal */}
      <Modal
        visible={showAddBinModal}
        animationType="slide"
        transparent={true}
        onRequestClose={resetBinForm}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Bin</Text>
              <TouchableOpacity onPress={resetBinForm}>
                <Ionicons name="close" size={24} color="#7f8c8d" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <TextInput
                style={styles.input}
                placeholder="Bin Name (e.g., Kitchen Bin)"
                value={newBin.binName}
                onChangeText={(text) => setNewBin({...newBin, binName: text})}
                placeholderTextColor="#999"
              />
              
              <Text style={styles.label}>Bin Type</Text>
              <View style={styles.radioGroup}>
                {['general', 'Food', 'Paper', 'Plastic'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={styles.radioOption}
                    onPress={() => setNewBin({...newBin, binType: type})}
                  >
                    <View style={styles.radioCircle}>
                      {newBin.binType === type && <View style={styles.radioSelected} />}
                    </View>
                    <Text style={styles.radioText}>{type.charAt(0).toUpperCase() + type.slice(1)}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={styles.input}
                placeholder="Capacity (liters)"
                keyboardType="numeric"
                value={newBin.capacity}
                onChangeText={(text) => setNewBin({...newBin, capacity: text})}
                placeholderTextColor="#999"
              />

              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Full Address"
                multiline
                numberOfLines={3}
                value={newBin.address}
                onChangeText={(text) => setNewBin({...newBin, address: text})}
                placeholderTextColor="#999"
              />

              {/* Location Selection Section */}
              <Text style={styles.label}>Location Coordinates</Text>
              
              {/* Current Location Button */}
              <TouchableOpacity 
                style={styles.locationButton}
                onPress={getCurrentLocation}
                disabled={isGettingLocation}
              >
                {isGettingLocation ? (
                  <ActivityIndicator size="small" color="#3498db" />
                ) : (
                  <Ionicons name="locate" size={20} color="#3498db" />
                )}
                <Text style={styles.locationButtonText}>
                  {isGettingLocation ? 'Getting Location...' : 'Use My Current Location'}
                </Text>
              </TouchableOpacity>

              {/* Map Selection Button */}
              <TouchableOpacity 
                style={styles.locationButton}
                onPress={openMapForLocation}
              >
                <Ionicons name="map" size={20} color="#27ae60" />
                <Text style={styles.locationButtonText}>Select Location on Map</Text>
              </TouchableOpacity>

              {/* Coordinates Display */}
              <View style={styles.coordinatesDisplay}>
                <View style={styles.coordinateItem}>
                  <Ionicons name="location" size={16} color="#7f8c8d" />
                  <Text style={styles.coordinateText}>
                    Lat: {newBin.latitude || 'Not set'}
                  </Text>
                </View>
                <View style={styles.coordinateItem}>
                  <Ionicons name="location" size={16} color="#7f8c8d" />
                  <Text style={styles.coordinateText}>
                    Lon: {newBin.longitude || 'Not set'}
                  </Text>
                </View>
              </View>

              {/* Manual Coordinates Input */}
              <Text style={styles.sectionSubtitle}>Or enter coordinates manually:</Text>
              <View style={styles.coordinatesRow}>
                <TextInput
                  style={[styles.input, styles.coordinateInput]}
                  placeholder="Latitude"
                  value={newBin.latitude}
                  onChangeText={(text) => setNewBin({...newBin, latitude: text})}
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                />
                <TextInput
                  style={[styles.input, styles.coordinateInput]}
                  placeholder="Longitude"
                  value={newBin.longitude}
                  onChangeText={(text) => setNewBin({...newBin, longitude: text})}
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                />
              </View>

              <Text style={styles.helperText}>
                * Location will be auto-detected from address if coordinates not provided
              </Text>

              <TouchableOpacity 
                style={[
                  styles.submitButton,
                  (!newBin.binName || !newBin.capacity || !newBin.address) && styles.submitButtonDisabled
                ]} 
                onPress={handleAddBin}
                disabled={!newBin.binName || !newBin.capacity || !newBin.address}
              >
                <Text style={styles.submitButtonText}>Add Bin</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* QR Code Modal */}
      <Modal
        visible={showQRModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowQRModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Bin QR Code</Text>
              <TouchableOpacity onPress={() => setShowQRModal(false)}>
                <Ionicons name="close" size={24} color="#7f8c8d" />
              </TouchableOpacity>
            </View>

            <View style={styles.qrContent}>
              {selectedBin?.qrCodeImage ? (
                <>
                  <Image 
                    source={{ uri: selectedBin.qrCodeImage }} 
                    style={styles.qrImage}
                  />
                  <Text style={styles.qrText}>QR Code: {selectedBin.qrCode}</Text>
                  <Text style={styles.binInfoText}>
                    {selectedBin.binDetails?.binName} • {selectedBin.binDetails?.type}
                  </Text>
                  <TouchableOpacity style={styles.printButton}>
                    <Ionicons name="download" size={20} color="#fff" />
                    <Text style={styles.printButtonText}>Save QR Code</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.qrLoading}>
                  <ActivityIndicator size="large" color="#3498db" />
                  <Text style={styles.qrLoadingText}>Generating QR Code...</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: 'white',
    paddingTop: 40,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e8ecef',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
},
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    opacity: 0.8,
    marginTop: 4,
    paddingHorizontal: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  // Error and Loading Styles
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 40,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  retryButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#7f8c8d',
  },
  // Stats Section
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 4,
  },
  // Section Styles
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3498db',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 4,
    fontSize: 12,
  },
  // Bin Card Styles
  binCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  binHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  binInfo: {
    flex: 1,
  },
  binName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  binTypeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  binTypeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  binCapacity: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7f8c8d',
  },
  binAddress: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 12,
  },
  binActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  binActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  binActionText: {
    fontSize: 12,
    color: '#2c3e50',
    marginLeft: 4,
  },
  // Empty State Styles
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#7f8c8d',
    marginTop: 8,
  },
  emptyStateSubtext: {
    fontSize: 12,
    color: '#bdc3c7',
    marginTop: 4,
    textAlign: 'center',
  },
  addFirstBinButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 12,
  },
  addFirstBinText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  // Activity Styles
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityDetails: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  activityDate: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  // Location Button Styles
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  locationButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
  },
  coordinatesDisplay: {
    backgroundColor: '#ecf0f1',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  coordinateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  coordinateText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#7f8c8d',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  // Quick Actions
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionCardText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2c3e50',
    marginTop: 8,
    textAlign: 'center',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  modalBody: {
    padding: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 14,
    backgroundColor: '#fafafa',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  radioGroup: {
    marginBottom: 16,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#3498db',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3498db',
  },
  radioText: {
    fontSize: 14,
    color: '#2c3e50',
    textTransform: 'capitalize',
  },
  coordinatesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  coordinateInput: {
    width: '48%',
  },
  helperText: {
    fontSize: 11,
    color: '#7f8c8d',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  submitButton: {
    backgroundColor: '#3498db',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // QR Code Styles
  qrContent: {
    padding: 24,
    alignItems: 'center',
  },
  qrImage: {
    width: 200,
    height: 200,
    marginBottom: 16,
  },
  qrText: {
    fontSize: 14,
    color: '#2c3e50',
    marginBottom: 8,
    textAlign: 'center',
  },
  binInfoText: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 16,
  },
  printButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#27ae60',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  printButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
  qrLoading: {
    padding: 40,
    alignItems: 'center',
  },
  qrLoadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#7f8c8d',
  },
});