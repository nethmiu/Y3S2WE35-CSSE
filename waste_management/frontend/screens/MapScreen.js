import React, { useState, useRef } from 'react';
import { View, StyleSheet, Text, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import Icon from 'react-native-vector-icons/MaterialIcons';

const MapScreen = ({ route, navigation }) => {
    const { onLocationSelect } = route.params;
    const mapRef = useRef(null);

    const [region, setRegion] = useState({
        latitude: 6.9271,
        longitude: 79.8612,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
    });
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [isFindingLocation, setIsFindingLocation] = useState(false);

    const handleMapPress = (event) => {
        setSelectedLocation(event.nativeEvent.coordinate);
    };

    const handleConfirmLocation = () => {
        if (selectedLocation) {
            onLocationSelect(selectedLocation);
            navigation.goBack();
        } else {
            Alert.alert('No Location Selected', 'Please tap on the map or use "Find Me" to select a location.');
        }
    };

    const handleFindMe = async () => {
        setIsFindingLocation(true);
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Permission to access location was denied.');
            setIsFindingLocation(false);
            return;
        }

        try {
            const location = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = location.coords;
            const newLocation = { latitude, longitude };
            
            setSelectedLocation(newLocation);
            if (mapRef.current) {
                mapRef.current.animateToRegion({
                    ...newLocation,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                }, 1000);
            }
        } catch (error) {
            Alert.alert('Error', 'Could not fetch your location. Please ensure your GPS is enabled.');
        } finally {
            setIsFindingLocation(false);
        }
    };

    return (
        <View style={styles.container}>
           

            {/* Instruction Card */}
            <View style={styles.instructionCard}>
                <Icon name="info" size={20} color="#4CAF50" style={styles.infoIcon} />
                <Text style={styles.instruction}>Tap on the map or use "Find Me" to select the location</Text>
            </View>

            {/* Map View */}
            <MapView
                ref={mapRef}
                style={styles.map}
                initialRegion={region}
                onPress={handleMapPress}
            >
                {selectedLocation && (
                    <Marker 
                        coordinate={selectedLocation}
                        pinColor="#4CAF50"
                    />
                )}
            </MapView>

            {/* Selected Location Info */}
            {selectedLocation && (
                <View style={styles.locationInfoCard}>
                    <Icon name="place" size={20} color="#4CAF50" />
                    <View style={styles.locationInfo}>
                        <Text style={styles.locationLabel}>Selected Location</Text>
                        <Text style={styles.locationCoords}>
                            Lat: {selectedLocation.latitude.toFixed(6)}, Lon: {selectedLocation.longitude.toFixed(6)}
                        </Text>
                    </View>
                </View>
            )}

            {/* Bottom Button Container */}
            <View style={styles.bottomContainer}>
                {isFindingLocation ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#4CAF50" />
                        <Text style={styles.loadingText}>Finding your location...</Text>
                    </View>
                ) : (
                    <View style={styles.buttonsRow}>
                        <TouchableOpacity style={styles.findMeButton} onPress={handleFindMe}>
                            <Icon name="my-location" size={22} color="#4CAF50" />
                            <Text style={styles.findMeButtonText}>Find Me</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={[styles.confirmButton, !selectedLocation && styles.confirmButtonDisabled]} 
                            onPress={handleConfirmLocation}
                        >
                            <Icon name="check-circle" size={22} color="#fff" />
                            <Text style={styles.confirmButtonText}>Confirm Location</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { 
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        paddingHorizontal: 15,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    backButton: {
        padding: 5,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2C3E50',
        marginLeft: 8,
    },
    placeholder: {
        width: 34,
    },
    instructionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 15,
        paddingVertical: 12,
        marginHorizontal: 15,
        marginVertical: 10,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#4CAF50',
    },
    infoIcon: {
        marginRight: 10,
    },
    instruction: { 
        flex: 1,
        fontSize: 14,
        color: '#2C3E50',
        lineHeight: 20,
    },
    map: { 
        flex: 1,
        marginHorizontal: 15,
        marginBottom: 10,
        borderRadius: 16,
        overflow: 'hidden',
    },
    locationInfoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        marginHorizontal: 15,
        marginBottom: 10,
        paddingHorizontal: 15,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    locationInfo: {
        marginLeft: 10,
        flex: 1,
    },
    locationLabel: {
        fontSize: 12,
        color: '#7F8C8D',
        marginBottom: 2,
        fontWeight: '500',
    },
    locationCoords: {
        fontSize: 13,
        color: '#2C3E50',
        fontWeight: '600',
    },
    bottomContainer: { 
        paddingVertical: 15,
        paddingHorizontal: 15, 
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
    },
    loadingContainer: {
        alignItems: 'center',
        paddingVertical: 10,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#4CAF50',
        fontWeight: '600',
    },
    buttonsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
    },
    findMeButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#4CAF50',
    },
    findMeButtonText: {
        color: '#4CAF50',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    confirmButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4CAF50',
        paddingVertical: 14,
        borderRadius: 12,
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 5,
    },
    confirmButtonDisabled: {
        backgroundColor: '#B0BEC5',
        shadowOpacity: 0,
        elevation: 0,
    },
    confirmButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
});

export default MapScreen;