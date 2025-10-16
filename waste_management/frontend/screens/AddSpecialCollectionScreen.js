import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, Platform, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import config from '../config';
import { Ionicons } from '@expo/vector-icons';

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
        if (event.type === 'set' && selectedDate) {
            setDate(selectedDate);
            setIsDateSelected(true);
            fetchAvailableSlots(selectedDate);
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
            <Text style={styles.header}>Schedule</Text>
            <Text style={styles.subHeader}>Add Special Collection Schedule</Text>

            {/* Date Picker */}
            <View style={styles.card}>
                <View style={styles.labelContainer}>
                    <Ionicons name="calendar-outline" size={20} color="#099928ff" style={styles.labelIcon} />
                    <Text style={styles.label}>Date</Text>
                </View>
                <TouchableOpacity 
                    style={styles.inputContainer} 
                    onPress={() => setShowDatePicker(true)}
                >
                    <Text style={styles.inputText}>
                        {isDateSelected ? date.toLocaleDateString('en-GB') : 'DD/MM/YY'}
                    </Text>
                    <View style={styles.iconPlaceholder}>
                        <Ionicons name="chevron-down" size={20} color="#6B7280" />
                    </View>
                </TouchableOpacity>
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
                <View style={styles.card}>
                    <View style={styles.labelContainer}>
                        <Ionicons name="time-outline" size={20} color="#099928ff" style={styles.labelIcon} />
                        <Text style={styles.label}>Time</Text>
                    </View>
                    <Text>Select one time slot among these.</Text>
                    <Text></Text>
                    {isLoadingSlots ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#099928ff" />
                        </View>
                    ) : availableSlots.length > 0 ? (
                        <View style={styles.slotsContainer}>
                            {availableSlots.map((slot) => (
                                <TouchableOpacity
                                    key={slot}
                                    style={[
                                        styles.slotButton, 
                                        selectedSlot === slot && styles.selectedSlot
                                    ]}
                                    onPress={() => setSelectedSlot(slot)}
                                >
                                    <Text style={[
                                        styles.slotText,
                                        selectedSlot === slot && styles.selectedSlotText
                                    ]}>
                                        {slot}
                                    </Text>
                                    {selectedSlot === slot && (
                                        <View style={styles.checkmark}>
                                            <Ionicons name="checkmark" size={12} color="#099928ff" />
                                        </View>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    ) : (
                        <View style={styles.noSlotsContainer}>
                            <Ionicons name="time-outline" size={40} color="#9CA3AF" />
                            <Text style={styles.noSlotsText}>
                                No available slots for the selected date. Please choose another date.
                            </Text>
                        </View>
                    )}
                </View>
            )}

            {/* Waste Type */}
            {selectedSlot && (
                <>
                    <View style={styles.card}>
                        <View style={styles.labelContainer}>
                            <Ionicons name="trash-outline" size={20} color="#099928ff" style={styles.labelIcon} />
                            <Text style={styles.label}>Waste Type</Text>
                        </View>
                        <View style={styles.pickerContainer}>
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
                            <View style={styles.pickerIconPlaceholder}>
                                
                            </View>
                        </View>
                    </View>

                    {/* Location */}
                    <View style={styles.card}>
                        <View style={styles.labelContainer}>
                            <Ionicons name="location-outline" size={20} color="#099928ff" style={styles.labelIcon} />
                            <Text style={styles.label}>Location</Text>
                        </View>
                        <TouchableOpacity 
                            style={styles.inputContainer}
                            onPress={() => navigation.navigate('Map', { onLocationSelect: (loc) => setLocation(loc) })}
                        >
                            <Text style={[styles.inputText, !location && styles.placeholderText]}>
                                {location 
                                    ? `Lat: ${location.latitude.toFixed(4)}, Lon: ${location.longitude.toFixed(4)}` 
                                    : 'Tap to select location on map'}
                            </Text>
                            <View style={styles.iconPlaceholder}>
                                <Ionicons name="map-outline" size={20} color="#6B7280" />
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Weight */}
                    <View style={styles.card}>
                        <View style={styles.labelContainer}>
                            <Ionicons name="barbell-outline" size={20} color="#099928ff" style={styles.labelIcon} />
                            <Text style={styles.label}>Estimated Weight (kg)</Text>
                        </View>
                        <View style={styles.inputContainer}>
                            <TextInput 
                                style={styles.textInput} 
                                placeholder="Enter weight" 
                                placeholderTextColor="#9CA3AF"
                                value={weight} 
                                onChangeText={handleWeightChange} 
                                keyboardType="numeric" 
                            />
                            <View style={styles.iconPlaceholder}>
                                <Ionicons name="scale-outline" size={20} color="#6B7280" />
                            </View>
                        </View>
                    </View>

                    {/* Special Remarks */}
                    <View style={styles.card}>
                        <View style={styles.labelContainer}>
                            <Ionicons name="document-text-outline" size={20} color="#099928ff" style={styles.labelIcon} />
                            <Text style={styles.label}>Special Remarks</Text>
                            <Text style={styles.optionalText}>(Optional)</Text>
                        </View>
                        <View style={styles.textAreaContainer}>
                            <TextInput 
                                style={styles.textAreaInput} 
                                placeholder="Add any special instructions..." 
                                placeholderTextColor="#9CA3AF"
                                value={remarks} 
                                onChangeText={setRemarks}
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                            />
                            <View style={styles.textAreaIcon}>
                                <Ionicons name="create-outline" size={20} color="#6B7280" />
                            </View>
                        </View>
                    </View>

                    {/* Total Amount */}
                    <View style={styles.totalCard}>
                        <View style={styles.totalHeader}>
                            <Ionicons name="calculator-outline" size={24} color="#099928ff" />
                            <Text style={styles.totalHeaderText}>Payment Summary</Text>
                        </View>
                        <View style={styles.totalRow}>
                            <View style={styles.totalLabelContainer}>
                                <Ionicons name="card-outline" size={16} color="#6B7280" />
                                <Text style={styles.totalLabel}>Fixed Fee</Text>
                            </View>
                            <Text style={styles.totalValue}>LKR {FIXED_FEE.toFixed(2)}</Text>
                        </View>
                        <View style={styles.totalRow}>
                            <View style={styles.totalLabelContainer}>
                                <Ionicons name="barbell-outline" size={16} color="#6B7280" />
                                <Text style={styles.totalLabel}>Weight Charge</Text>
                            </View>
                            <Text style={styles.totalValue}>
                                LKR {((parseFloat(weight) || 0) * PRICE_PER_KG).toFixed(2)}
                            </Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.totalRow}>
                            <View style={styles.totalLabelContainer}>
                                <Ionicons name="wallet-outline" size={20} color="#1F2937" />
                                <Text style={styles.grandTotalLabel}>Total Amount</Text>
                            </View>
                            <Text style={styles.grandTotalValue}>LKR {totalAmount.toFixed(2)}</Text>
                        </View>
                    </View>
                </>
            )}

            {/* Continue Button */}
            <TouchableOpacity
                style={[styles.continueButton, !isFormComplete && styles.buttonDisabled]}
                onPress={handleContinueToPayment}
                disabled={!isFormComplete}
            >
                <Ionicons name="arrow-forward-circle" size={24} color="#FFFFFF" />
                <Text style={styles.continueButtonText}>Confirm & Continue</Text>
            </TouchableOpacity>

            <View style={styles.bottomSpacer} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: '#F0FDF4',
    },
    header: { 
        fontSize: 24, 
        fontWeight: 'bold', 
        textAlign: 'center', 
        marginTop: 20,
        marginBottom: 5,
        color: '#1F2937'
    },
    subHeader: {
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
        color: '#099928ff',
        marginBottom: 25
    },
    card: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    labelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    labelIcon: {
        marginRight: 8,
    },
    label: { 
        fontSize: 16, 
        fontWeight: '600', 
        color: '#1F2937'
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 14,
    },
    inputText: {
        fontSize: 16,
        color: '#1F2937',
        flex: 1,
    },
    placeholderText: {
        color: '#9CA3AF',
    },
    iconPlaceholder: {
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingContainer: {
        paddingVertical: 30,
        alignItems: 'center',
    },
    slotsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    slotButton: { 
        backgroundColor: '#F9FAFB',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        minWidth: '30%',
        alignItems: 'center',
        position: 'relative',
    },
    selectedSlot: { 
        backgroundColor: '#099928ff',
        borderColor: '#099928ff',
    },
    slotText: { 
        fontSize: 14,
        fontWeight: '500',
        color: '#1F2937',
    },
    selectedSlotText: {
        color: '#FFFFFF',
    },
    checkmark: {
        position: 'absolute',
        top: 4,
        right: 4,
        width: 16,
        height: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    noSlotsContainer: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    noSlotsText: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        marginTop: 8,
    },
    pickerContainer: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        overflow: 'hidden',
        position: 'relative',
    },
    picker: { 
        height: 50,
        width: '100%',
    },
    pickerIconPlaceholder: {
        position: 'absolute',
        right: 12,
        top: 15,
        width: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    textInput: { 
        backgroundColor: 'transparent',
        borderWidth: 0,
        padding: 0,
        fontSize: 16,
        color: '#1F2937',
        flex: 1,
    },
    optionalText: {
        fontSize: 12,
        color: '#9CA3AF',
        marginLeft: 8,
    },
    textAreaContainer: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        position: 'relative',
    },
    textAreaInput: {
        padding: 14,
        fontSize: 16,
        color: '#1F2937',
        minHeight: 100,
        paddingRight: 40,
    },
    textAreaIcon: {
        position: 'absolute',
        top: 14,
        right: 14,
    },
    totalCard: {
        backgroundColor: '#ECFDF5',
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 16,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#099928ff',
    },
    totalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    totalHeaderText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        marginLeft: 8,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    totalLabelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    totalLabel: {
        fontSize: 14,
        color: '#6B7280',
        marginLeft: 6,
    },
    totalValue: {
        fontSize: 14,
        color: '#1F2937',
        fontWeight: '500',
    },
    divider: {
        height: 1,
        backgroundColor: '#099928ff',
        marginVertical: 8,
    },
    grandTotalLabel: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        marginLeft: 6,
    },
    grandTotalValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#099928ff',
    },
    continueButton: {
        backgroundColor: '#099928ff',
        marginHorizontal: 16,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        shadowColor: '#099928ff',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
        gap: 8,
    },
    continueButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    buttonDisabled: {
        backgroundColor: '#D1FAE5',
        shadowOpacity: 0,
    },
    bottomSpacer: {
        height: 40,
    },
});

export default AddSpecialCollectionScreen;