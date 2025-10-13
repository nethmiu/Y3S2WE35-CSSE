import React, { useState } from 'react';
import { View, StyleSheet, Button, Text } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

const MapScreen = ({ route, navigation }) => {
    const { onLocationSelect } = route.params;

    // Default location (Colombo)
    const [region, setRegion] = useState({
        latitude: 6.9271,
        longitude: 79.8612,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
    });
    const [selectedLocation, setSelectedLocation] = useState(null);

    const handleMapPress = (event) => {
        setSelectedLocation(event.nativeEvent.coordinate);
    };

    const handleConfirmLocation = () => {
        if (selectedLocation) {
            onLocationSelect(selectedLocation);
            navigation.goBack();
        } else {
            alert('Please tap on the map to select a location.');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.instruction}>Tap on the map to select the collection location</Text>
            <MapView
                style={styles.map}
                initialRegion={region}
                onPress={handleMapPress}
            >
                {selectedLocation && <Marker coordinate={selectedLocation} />}
            </MapView>
            <View style={styles.buttonContainer}>
                <Button title="Confirm Location" onPress={handleConfirmLocation} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    instruction: { padding: 15, fontSize: 16, textAlign: 'center', backgroundColor: '#fff' },
    map: { flex: 1 },
    buttonContainer: { padding: 15, backgroundColor: '#fff' }
});

export default MapScreen;