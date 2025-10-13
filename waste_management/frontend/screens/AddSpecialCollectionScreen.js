import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, Platform, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import config from '../config';

const API_URL = `http://${config.IP}:${config.PORT}/api/collections`;

const AddSpecialCollectionScreen = ({ route, navigation }) => {
    const { userDetails } = route.params;

    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    
    const [availableSlots, setAvailableSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);

    const [wasteType, setWasteType] = useState('E-Waste');
    const [location, setLocation] = useState(null);
    const [remarks, setRemarks] = useState('');

    const handleDateChange = (event, selectedDate) => {
        const currentDate = selectedDate || date;
        setShowDatePicker(Platform.OS === 'ios');
        setDate(currentDate);
        fetchAvailableSlots(currentDate);
    };

    const fetchAvailableSlots = async (queryDate) => {
        setIsLoadingSlots(true);
        setSelectedSlot(null);
        setAvailableSlots([]);
        const dateString = queryDate.toISOString().split('T')[0]; // YYYY-MM-DD

        try {
            const { data } = await axios.get(`${API_URL}/availability?date=${dateString}`);
            setAvailableSlots(data);
        } catch (error) {
            alert('Failed to load available slots.');
        } finally {
            setIsLoadingSlots(false);
        }
    };

    const handleContinueToPayment = () => {
        if (!selectedSlot) {
            alert('Please select a time slot.');
            return;
        }
        if (!location) {
            alert('Please select a location from the map.');
            return;
        }

        const scheduleDetails = {
            userId: userDetails._id,
            date: date.toISOString().split('T')[0],
            timeSlot: selectedSlot,
            wasteType,
            location,
            remarks,
        };
        navigation.navigate('Payment', { scheduleDetails });
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.header}>Schedule a Collection</Text>

            {/* Date Picker */}
            <View style={styles.section}>
                <Text style={styles.label}>1. Select a Date</Text>
                <Button onPress={() => setShowDatePicker(true)} title="Choose Date" />
                <Text style={styles.infoText}>Selected Date: {date.toDateString()}</Text>
                {showDatePicker && (
                    <DateTimePicker
                        value={date}
                        mode="date"
                        display="default"
                        onChange={handleDateChange}
                        minimumDate={new Date()}
                    />
                )}
            </View>

            {/* Time Slots */}
            <View style={styles.section}>
                <Text style={styles.label}>2. Select an Available Time Slot</Text>
                {isLoadingSlots ? (
                    <ActivityIndicator size="large" color="#0000ff" />
                ) : availableSlots.length > 0 ? (
                    availableSlots.map((slot) => (
                        <TouchableOpacity
                            key={slot}
                            style={[styles.slotButton, selectedSlot === slot && styles.selectedSlot]}
                            onPress={() => setSelectedSlot(slot)}
                        >
                            <Text style={styles.slotText}>{slot}</Text>
                        </TouchableOpacity>
                    ))
                ) : (
                    <Text>No available slots for the selected date. Please choose another date.</Text>
                )}
            </View>

            {/* Other Details */}
            {selectedSlot && (
                <View style={styles.section}>
                    <Text style={styles.label}>3. Enter Collection Details</Text>
                    {/* Waste Type Picker */}
                    <Text style={styles.subLabel}>Waste Type</Text>
                    <Picker
                        selectedValue={wasteType}
                        onValueChange={(itemValue) => setWasteType(itemValue)}
                        style={styles.picker}
                    >
                        <Picker.Item label="E-Waste (Electronics)" value="E-Waste" />
                        <Picker.Item label="Furniture" value="Furniture" />
                        <Picker.Item label="Garden Waste" value="Garden Waste" />
                        <Picker.Item label="Other Bulky Items" value="Other" />
                    </Picker>

                    {/* Location Picker */}
                    <Text style={styles.subLabel}>Location</Text>
                    <Button 
                        title="Select Location on Map" 
                        onPress={() => navigation.navigate('Map', {
                            // MapScreen එකෙන් location එක update කිරීමට
                            onLocationSelect: (loc) => setLocation(loc)
                        })} 
                    />
                    {location && <Text style={styles.infoText}>Location Selected: Lat: {location.latitude.toFixed(4)}, Lon: {location.longitude.toFixed(4)}</Text>}

                    {/* Remarks */}
                    <Text style={styles.subLabel}>Special Remarks (Optional)</Text>
                    <TextInput
                        style={styles.textInput}
                        placeholder="e.g., At the back gate"
                        value={remarks}
                        onChangeText={setRemarks}
                    />
                </View>
            )}

            {/* Continue Button */}
            <View style={styles.buttonContainer}>
                 <Button title="Confirm and Continue to Payment" onPress={handleContinueToPayment} disabled={!selectedSlot || !location} />
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 15, backgroundColor: '#f5f5f5' },
    header: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
    section: { marginBottom: 25, backgroundColor: '#fff', padding: 15, borderRadius: 8 },
    label: { fontSize: 18, fontWeight: '600', marginBottom: 10 },
    subLabel: { fontSize: 16, marginTop: 10, marginBottom: 5 },
    infoText: { textAlign: 'center', marginTop: 10, fontSize: 16 },
    slotButton: { backgroundColor: '#e0e0e0', padding: 15, borderRadius: 5, marginVertical: 5 },
    selectedSlot: { backgroundColor: '#3498db', borderWidth: 2, borderColor: '#2980b9' },
    slotText: { textAlign: 'center', fontSize: 16 },
    picker: { height: 50, width: '100%' },
    textInput: { borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 5, marginTop: 5 },
    buttonContainer: { paddingBottom: 40 }
});

export default AddSpecialCollectionScreen;