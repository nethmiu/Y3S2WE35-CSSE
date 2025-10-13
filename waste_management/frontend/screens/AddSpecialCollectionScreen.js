import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, Platform, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import config from '../config';

const API_URL = `http://${config.IP}:${config.PORT}/api/collections`;
const FIXED_FEE = 200;
const PRICE_PER_KG = 100;

const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);

const AddSpecialCollectionScreen = ({ route, navigation }) => {
    const { userDetails } = route.params;

    const [date, setDate] = useState(tomorrow);
    const [isDateSelected, setIsDateSelected] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    
    const [availableSlots, setAvailableSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);

    const [wasteType, setWasteType] = useState('E-Waste');
    const [location, setLocation] = useState(null);
    const [remarks, setRemarks] = useState('');

    const [weight, setWeight] = useState('');
    const [totalAmount, setTotalAmount] = useState(FIXED_FEE);

    const handleDateChange = (event, selectedDate) => {
        setShowDatePicker(Platform.OS === 'ios');
        // "Cancel" කළ විට, event.type එක 'dismissed' වේ (Android)
        if (event.type === 'set' && selectedDate) {
            setDate(selectedDate);
            setIsDateSelected(true);
            fetchAvailableSlots(selectedDate);
        } else {
            // Cancel කළ විට කිසිවක් නොකිරීම හෝ අවශ්‍ය නම් state reset කිරීම
            // දැනට පවතින ක්‍රමය cancel logic එක නිවැරදිව හසුරුවයි
        }
    };

    const fetchAvailableSlots = async (queryDate) => {
        setIsLoadingSlots(true);
        setSelectedSlot(null);
        setAvailableSlots([]);
        const dateString = queryDate.toISOString().split('T')[0];

        try {
            const { data } = await axios.get(`${API_URL}/availability?date=${dateString}`);
            setAvailableSlots(data);
        } catch (error) {
            alert('Failed to load available slots.');
        } finally {
            setIsLoadingSlots(false);
        }
    };

    const handleWeightChange = (text) => {
        const numericWeight = parseFloat(text) || 0;
        setWeight(text);
        const calculatedAmount = FIXED_FEE + (numericWeight * PRICE_PER_KG);
        setTotalAmount(calculatedAmount);
    };

    // සියලුම fields සම්පූර්ණදැයි පරීක්ෂා කිරීම
    const isFormComplete = selectedSlot && location && weight && parseFloat(weight) > 0;

    const handleContinueToPayment = () => {
        if (!isFormComplete) {
            Alert.alert(
                'Incomplete Details', 
                'Please select a date, time slot, location, and enter a valid weight to continue.'
            );
            return;
        }

        const scheduleDetails = {
            userId: userDetails._id,
            date: date.toISOString().split('T')[0],
            timeSlot: selectedSlot,
            wasteType,
            location,
            remarks,
            weight: parseFloat(weight),
            totalAmount: totalAmount,
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
                {isDateSelected && (
                    <Text style={styles.infoText}>Selected Date: {date.toDateString()}</Text>
                )}
                {showDatePicker && (
                    <DateTimePicker
                        value={date}
                        mode="date"
                        display="default"
                        onChange={handleDateChange}
                        minimumDate={tomorrow}
                    />
                )}
            </View>

            {/* Time Slots */}
            {isDateSelected && (
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
            )}

            {/* Other Details */}
            {selectedSlot && (
                <View style={styles.section}>
                    <Text style={styles.label}>3. Enter Collection Details</Text>
                    
                    <Text style={styles.subLabel}>Waste Type</Text>
                    <Picker selectedValue={wasteType} onValueChange={(itemValue) => setWasteType(itemValue)} style={styles.picker}>
                        <Picker.Item label="E-Waste (Electronics)" value="E-Waste" />
                        <Picker.Item label="Furniture" value="Furniture" />
                        <Picker.Item label="Garden Waste" value="Garden Waste" />
                        <Picker.Item label="Other Bulky Items" value="Other" />
                    </Picker>

                    <Text style={styles.subLabel}>Location</Text>
                    <Button title="Select Location on Map" onPress={() => navigation.navigate('Map', { onLocationSelect: (loc) => setLocation(loc) })} />
                    {location && <Text style={styles.infoText}>Location Selected: Lat: {location.latitude.toFixed(4)}, Lon: {location.longitude.toFixed(4)}</Text>}

                    <Text style={styles.subLabel}>Estimated Weight (kg)</Text>
                    <TextInput style={styles.textInput} placeholder="e.g., 5.5" value={weight} onChangeText={handleWeightChange} keyboardType="numeric" />

                    <Text style={styles.subLabel}>Special Remarks (Optional)</Text>
                    <TextInput style={styles.textInput} placeholder="e.g., At the back gate" value={remarks} onChangeText={setRemarks} />

                    <View style={styles.totalAmountContainer}>
                        <Text style={styles.totalAmountText}>Total Amount:</Text>
                        <Text style={styles.totalAmountValue}>LKR {totalAmount.toFixed(2)}</Text>
                    </View>
                </View>
            )}

            {/* Continue Button */}
            <TouchableOpacity
                style={[styles.buttonWrapper, !isFormComplete && styles.buttonDisabled]}
                onPress={handleContinueToPayment}
            >
                <Text style={styles.buttonText}>Confirm and Continue to Payment</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 15, backgroundColor: '#f5f5f5' },
    header: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
    section: { marginBottom: 25, backgroundColor: '#fff', padding: 15, borderRadius: 8, elevation: 2 },
    label: { fontSize: 18, fontWeight: '600', marginBottom: 10 },
    subLabel: { fontSize: 16, marginTop: 15, marginBottom: 5, color: '#555' },
    infoText: { textAlign: 'center', marginTop: 10, fontSize: 16 },
    slotButton: { backgroundColor: '#e0e0e0', padding: 15, borderRadius: 5, marginVertical: 5 },
    selectedSlot: { backgroundColor: '#3498db', borderWidth: 2, borderColor: '#2980b9' },
    slotText: { textAlign: 'center', fontSize: 16, color: '#333' },
    picker: { height: 50, width: '100%', backgroundColor: '#f9f9f9', borderRadius: 5 },
    textInput: { borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 5, marginTop: 5, fontSize: 16 },
    totalAmountContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
        padding: 15,
        backgroundColor: '#e8f6ef',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#a3d9b8'
    },
    totalAmountText: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    totalAmountValue: { fontSize: 18, fontWeight: 'bold', color: '#27ae60' },
    buttonWrapper: {
        backgroundColor: '#007bff',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 40,
        marginTop: 10,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    buttonDisabled: {
        backgroundColor: '#a0c8f0', // Faded color
    },
});

export default AddSpecialCollectionScreen;