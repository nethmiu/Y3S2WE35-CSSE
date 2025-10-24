import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Platform, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  Modal
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import config from '../config';
import { Ionicons } from '@expo/vector-icons';

const API_URL = `http://${config.IP}:${config.PORT}/api`;

const AddRegularCollectionScreen = ({ route, navigation }) => {
    const { userDetails, preSelectedBin } = route.params;

    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    
    const [availableSlots, setAvailableSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState('8:00 AM - 11:00 AM');
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);

    const [userBins, setUserBins] = useState([]);
    const [selectedBins, setSelectedBins] = useState(preSelectedBin ? [preSelectedBin._id] : []);
    const [collectionType, setCollectionType] = useState('regular');
    
    const [isLoadingBins, setIsLoadingBins] = useState(false);
    const [showBinModal, setShowBinModal] = useState(false);

    // Available time slots for regular collections
    const timeSlots = [
        '8:00 AM - 11:00 AM',
        '11:00 AM - 2:00 PM', 
        '2:00 PM - 5:00 PM',
        '5:00 PM - 8:00 PM'
    ];

    // Load user's bins
    const loadUserBins = async () => {
        if (!userDetails._id) return;
        
        setIsLoadingBins(true);
        try {
            const response = await axios.get(`${API_URL}/bins/user/${userDetails._id}`);
            let binsData = [];
            
            if (response.data.success && response.data.data) {
                binsData = response.data.data;
            } else if (response.data.bins) {
                binsData = response.data.bins;
            } else if (Array.isArray(response.data)) {
                binsData = response.data;
            }
            
            setUserBins(binsData);
            
            // Auto-select first bin if none pre-selected
            if (!preSelectedBin && binsData.length > 0 && selectedBins.length === 0) {
                setSelectedBins([binsData[0]._id]);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to load your bins');
            console.error('Error loading bins:', error);
        } finally {
            setIsLoadingBins(false);
        }
    };

    const handleDateChange = (event, selectedDate) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (event.type === 'set' && selectedDate) {
            setDate(selectedDate);
        }
    };

    const toggleBinSelection = (binId) => {
        setSelectedBins(prev => {
            if (prev.includes(binId)) {
                return prev.filter(id => id !== binId);
            } else {
                return [...prev, binId];
            }
        });
    };

    const isFormComplete = selectedBins.length > 0 && selectedSlot;

    const handleScheduleCollection = async () => {
        if (!isFormComplete) {
            Alert.alert(
                'Incomplete Details', 
                'Please select at least one bin and a time slot to continue.'
            );
            return;
        }

        if (!userDetails._id) {
            Alert.alert('Error', 'User information not available');
            return;
        }

        try {
            const collectionData = {
                userId: userDetails._id,
                binIds: selectedBins,
                scheduledDate: date.toISOString(),
                timeSlot: selectedSlot,
                collectionType: collectionType
            };

            console.log('Scheduling regular collection:', collectionData);
            
            const response = await axios.post(`${API_URL}/regular-collections`, collectionData);
            
            if (response.data.success) {
                Alert.alert(
                    'Success', 
                    'Regular collection scheduled successfully!',
                    [{ text: 'OK', onPress: () => navigation.goBack() }]
                );
            } else {
                Alert.alert('Error', response.data.message || 'Failed to schedule collection');
            }
        } catch (error) {
            console.error('Error scheduling collection:', error);
            Alert.alert(
                'Error', 
                'Failed to schedule collection: ' + (error.response?.data?.message || error.message)
            );
        }
    };

    const getSelectedBinsDetails = () => {
        return userBins.filter(bin => selectedBins.includes(bin._id));
    };

    const getTotalCapacity = () => {
        return getSelectedBinsDetails().reduce((total, bin) => total + (bin.capacity || 0), 0);
    };

    const getBinTypes = () => {
        const types = [...new Set(getSelectedBinsDetails().map(bin => bin.binType))];
        return types.join(', ');
    };

    useEffect(() => {
        loadUserBins();
    }, []);

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.header}>Schedule</Text>
            <Text style={styles.subHeader}>Add Regular Collection</Text>

            {/* Bin Selection */}
            <View style={styles.card}>
                <View style={styles.labelContainer}>
                    <Ionicons name="trash-outline" size={20} color="#099928ff" style={styles.labelIcon} />
                    <Text style={styles.label}>Select Bins</Text>
                    <Text style={styles.selectedCount}>({selectedBins.length} selected)</Text>
                </View>
                
                {isLoadingBins ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#099928ff" />
                        <Text style={styles.loadingText}>Loading your bins...</Text>
                    </View>
                ) : userBins.length === 0 ? (
                    <View style={styles.noBinsContainer}>
                        <Ionicons name="trash-outline" size={40} color="#9CA3AF" />
                        <Text style={styles.noBinsText}>No bins available</Text>
                        <Text style={styles.noBinsSubtext}>
                            You need to add bins before scheduling a collection
                        </Text>
                        <TouchableOpacity 
                            style={styles.addBinButton}
                            onPress={() => navigation.navigate('AddBin')}
                        >
                            <Text style={styles.addBinButtonText}>Add Bin First</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <>
                        <TouchableOpacity 
                            style={styles.binSelectorButton}
                            onPress={() => setShowBinModal(true)}
                        >
                            <View style={styles.binSelectorContent}>
                                <Ionicons name="options-outline" size={20} color="#099928ff" />
                                <Text style={styles.binSelectorText}>
                                    {selectedBins.length} bin(s) selected - Tap to change
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
                        </TouchableOpacity>

                        {/* Selected Bins Preview */}
                        {selectedBins.length > 0 && (
                            <View style={styles.selectedBinsPreview}>
                                <Text style={styles.previewTitle}>Selected Bins:</Text>
                                {getSelectedBinsDetails().map(bin => (
                                    <View key={bin._id} style={styles.binPreviewItem}>
                                        <Ionicons name="checkmark-circle" size={16} color="#099928ff" />
                                        <Text style={styles.binPreviewText}>
                                            {bin.binName} • {bin.binType} • {bin.capacity}L
                                        </Text>
                                    </View>
                                ))}
                                <View style={styles.previewSummary}>
                                    <Text style={styles.summaryText}>
                                        Total Capacity: {getTotalCapacity()}L
                                    </Text>
                                    <Text style={styles.summaryText}>
                                        Types: {getBinTypes()}
                                    </Text>
                                </View>
                            </View>
                        )}
                    </>
                )}
            </View>

            {/* Date Picker */}
            <View style={styles.card}>
                <View style={styles.labelContainer}>
                    <Ionicons name="calendar-outline" size={20} color="#099928ff" style={styles.labelIcon} />
                    <Text style={styles.label}>Collection Date</Text>
                </View>
                <TouchableOpacity 
                    style={styles.inputContainer} 
                    onPress={() => setShowDatePicker(true)}
                >
                    <Text style={styles.inputText}>
                        {date.toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
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
                        minimumDate={new Date()}
                    />
                )}
            </View>

            {/* Time Slot Selection */}
            <View style={styles.card}>
                <View style={styles.labelContainer}>
                    <Ionicons name="time-outline" size={20} color="#099928ff" style={styles.labelIcon} />
                    <Text style={styles.label}>Preferred Time Slot</Text>
                </View>
                <View style={styles.timeSlotGroup}>
                    {timeSlots.map((slot) => (
                        <TouchableOpacity
                            key={slot}
                            style={[
                                styles.timeSlotOption,
                                selectedSlot === slot && styles.selectedTimeSlot
                            ]}
                            onPress={() => setSelectedSlot(slot)}
                        >
                            <Ionicons 
                                name="time" 
                                size={16} 
                                color={selectedSlot === slot ? '#FFFFFF' : '#099928ff'} 
                            />
                            <Text style={[
                                styles.timeSlotText,
                                selectedSlot === slot && styles.selectedTimeSlotText
                            ]}>
                                {slot}
                            </Text>
                            {selectedSlot === slot && (
                                <View style={styles.timeSlotCheckmark}>
                                    <Ionicons name="checkmark" size={12} color="#099928ff" />
                                </View>
                            )}
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            

            {/* Summary Card */}
            {selectedBins.length > 0 && (
                <View style={styles.summaryCard}>
                    <View style={styles.summaryHeader}>
                        <Ionicons name="information-circle-outline" size={24} color="#099928ff" />
                        <Text style={styles.summaryHeaderText}>Collection Summary</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <View style={styles.summaryLabelContainer}>
                            <Ionicons name="trash-outline" size={16} color="#6B7280" />
                            <Text style={styles.summaryLabel}>Bins Selected</Text>
                        </View>
                        <Text style={styles.summaryValue}>{selectedBins.length}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <View style={styles.summaryLabelContainer}>
                            <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                            <Text style={styles.summaryLabel}>Collection Date</Text>
                        </View>
                        <Text style={styles.summaryValue}>
                            {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <View style={styles.summaryLabelContainer}>
                            <Ionicons name="time-outline" size={16} color="#6B7280" />
                            <Text style={styles.summaryLabel}>Time Slot</Text>
                        </View>
                        <Text style={styles.summaryValue}>{selectedSlot}</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.summaryRow}>
                        <View style={styles.summaryLabelContainer}>
                            <Ionicons name="cube-outline" size={20} color="#1F2937" />
                            <Text style={styles.finalSummaryLabel}>Total Capacity</Text>
                        </View>
                        <Text style={styles.finalSummaryValue}>{getTotalCapacity()}L</Text>
                    </View>
                </View>
            )}

            {/* Schedule Button */}
            <TouchableOpacity
                style={[styles.scheduleButton, !isFormComplete && styles.buttonDisabled]}
                onPress={handleScheduleCollection}
                disabled={!isFormComplete}
            >
                <Ionicons name="calendar" size={24} color="#FFFFFF" />
                <Text style={styles.scheduleButtonText}>Schedule Collection</Text>
            </TouchableOpacity>

            <View style={styles.bottomSpacer} />

            {/* Bin Selection Modal */}
            <Modal
                visible={showBinModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowBinModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Bins</Text>
                            <TouchableOpacity 
                                onPress={() => setShowBinModal(false)}
                                style={styles.modalCloseButton}
                            >
                                <Ionicons name="close" size={24} color="#6B7280" />
                            </TouchableOpacity>
                        </View>
                        
                        <ScrollView style={styles.modalBody}>
                            <Text style={styles.modalSubtitle}>
                                Select one or more bins for collection
                            </Text>
                            
                            {userBins.map((bin) => (
                                <TouchableOpacity
                                    key={bin._id}
                                    style={[
                                        styles.binModalOption,
                                        selectedBins.includes(bin._id) && styles.binModalOptionSelected
                                    ]}
                                    onPress={() => toggleBinSelection(bin._id)}
                                >
                                    <View style={styles.binModalInfo}>
                                        <Text style={styles.binModalName}>{bin.binName}</Text>
                                        <Text style={styles.binModalDetails}>
                                            {bin.binType} • {bin.capacity}L • {bin.location?.address || 'No address'}
                                        </Text>
                                    </View>
                                    {selectedBins.includes(bin._id) && (
                                        <Ionicons name="checkmark-circle" size={24} color="#099928ff" />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <View style={styles.modalActions}>
                            <TouchableOpacity 
                                style={styles.modalCancelButton}
                                onPress={() => setShowBinModal(false)}
                            >
                                <Text style={styles.modalCancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                style={styles.modalConfirmButton}
                                onPress={() => setShowBinModal(false)}
                            >
                                <Text style={styles.modalConfirmButtonText}>
                                    Confirm ({selectedBins.length})
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
    selectedCount: {
        fontSize: 14,
        color: '#099928ff',
        fontWeight: '500',
        marginLeft: 8,
    },
    loadingContainer: {
        paddingVertical: 30,
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 8,
        fontSize: 14,
        color: '#6B7280',
    },
    noBinsContainer: {
        alignItems: 'center',
        padding: 30,
    },
    noBinsText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginTop: 12,
        marginBottom: 6,
    },
    noBinsSubtext: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 20,
    },
    addBinButton: {
        backgroundColor: '#099928ff',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
    },
    addBinButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 14,
    },
    binSelectorButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        padding: 16,
    },
    binSelectorContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    binSelectorText: {
        fontSize: 16,
        color: '#1F2937',
        marginLeft: 12,
    },
    selectedBinsPreview: {
        marginTop: 16,
        padding: 12,
        backgroundColor: '#F8FAFC',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    previewTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 8,
    },
    binPreviewItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    binPreviewText: {
        fontSize: 13,
        color: '#4B5563',
        marginLeft: 8,
    },
    previewSummary: {
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    summaryText: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 2,
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
    iconPlaceholder: {
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    timeSlotGroup: {
        gap: 8,
    },
    timeSlotOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        backgroundColor: '#F9FAFB',
        position: 'relative',
    },
    selectedTimeSlot: {
        backgroundColor: '#099928ff',
        borderColor: '#099928ff',
    },
    timeSlotText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#1F2937',
        marginLeft: 8,
        flex: 1,
    },
    selectedTimeSlotText: {
        color: '#FFFFFF',
    },
    timeSlotCheckmark: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 16,
        height: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pickerContainer: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        overflow: 'hidden',
    },
    picker: { 
        height: 50,
        width: '100%',
    },
    summaryCard: {
        backgroundColor: '#ECFDF5',
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 16,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#099928ff',
    },
    summaryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    summaryHeaderText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        marginLeft: 8,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    summaryLabelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    summaryLabel: {
        fontSize: 14,
        color: '#6B7280',
        marginLeft: 6,
    },
    summaryValue: {
        fontSize: 14,
        color: '#1F2937',
        fontWeight: '500',
    },
    divider: {
        height: 1,
        backgroundColor: '#099928ff',
        marginVertical: 8,
    },
    finalSummaryLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937',
        marginLeft: 6,
    },
    finalSummaryValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#099928ff',
    },
    scheduleButton: {
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
    scheduleButtonText: {
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
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    modalCloseButton: {
        padding: 4,
    },
    modalBody: {
        padding: 24,
        maxHeight: 400,
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 16,
    },
    binModalOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        marginBottom: 8,
        backgroundColor: '#F9FAFB',
    },
    binModalOptionSelected: {
        borderColor: '#099928ff',
        backgroundColor: '#ECFDF5',
        borderWidth: 2,
    },
    binModalInfo: {
        flex: 1,
    },
    binModalName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 4,
    },
    binModalDetails: {
        fontSize: 12,
        color: '#6B7280',
        lineHeight: 14,
    },
    modalActions: {
        flexDirection: 'row',
        padding: 24,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        gap: 12,
    },
    modalCancelButton: {
        flex: 1,
        padding: 16,
        borderRadius: 8,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
    },
    modalCancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6B7280',
    },
    modalConfirmButton: {
        flex: 2,
        padding: 16,
        borderRadius: 8,
        backgroundColor: '#099928ff',
        alignItems: 'center',
    },
    modalConfirmButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});

export default AddRegularCollectionScreen;