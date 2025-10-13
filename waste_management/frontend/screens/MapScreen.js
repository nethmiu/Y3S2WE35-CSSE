import React, { useState, useRef } from 'react';
import { View, StyleSheet, Button, Text, Alert, ActivityIndicator } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';

const MapScreen = ({ route, navigation }) => {
    const { onLocationSelect } = route.params;
    const mapRef = useRef(null); // MapView එක control කිරීමට ref එකක්

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

    // --- "Find Me" බොත්තම සඳහා නව function එක ---
    const handleFindMe = async () => {
        setIsFindingLocation(true);
        // 1. ස්ථානයට පිවිසීමට අවසර ඉල්ලීම
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Permission to access location was denied.');
            setIsFindingLocation(false);
            return;
        }

        try {
            // 2. වත්මන් ස්ථානය ලබාගැනීම
            const location = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = location.coords;
            const newLocation = { latitude, longitude };
            
            // 3. State එක update කර සිතියම එම ස්ථානයට ගෙනයාම
            setSelectedLocation(newLocation);
            if (mapRef.current) {
                mapRef.current.animateToRegion({
                    ...newLocation,
                    latitudeDelta: 0.01, // Zoom level එක
                    longitudeDelta: 0.01,
                }, 1000); // 1 second animation
            }
        } catch (error) {
            Alert.alert('Error', 'Could not fetch your location. Please ensure your GPS is enabled.');
        } finally {
            setIsFindingLocation(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.instruction}>Tap on the map or use "Find Me" to select the location</Text>
            <MapView
                ref={mapRef}
                style={styles.map}
                initialRegion={region}
                onPress={handleMapPress}
            >
                {selectedLocation && <Marker coordinate={selectedLocation} />}
            </MapView>
            <View style={styles.buttonContainer}>
                {isFindingLocation ? (
                    <ActivityIndicator size="large" color="#007bff" />
                ) : (
                    <View style={styles.buttonsRow}>
                        <View style={styles.button}>
                            <Button title="Find Me" onPress={handleFindMe} />
                        </View>
                        <View style={styles.button}>
                            <Button title="Confirm Location" onPress={handleConfirmLocation} />
                        </View>
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    instruction: { padding: 15, fontSize: 16, textAlign: 'center', backgroundColor: '#fff' },
    map: { flex: 1 },
    buttonContainer: { 
        paddingVertical: 10,
        paddingHorizontal: 15, 
        backgroundColor: '#fff' 
    },
    buttonsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    button: {
        flex: 1,
        marginHorizontal: 5,
    }
});

export default MapScreen;