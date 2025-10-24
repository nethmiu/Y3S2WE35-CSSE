import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert,
  Modal,
  TextInput,
  ScrollView
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import config from '../config';

const API_URL = `http://${config.IP}:${config.PORT}/api/collector`;

export default function QRScannerScreen({ route, navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [wasteLevel, setWasteLevel] = useState('');
  const [notes, setNotes] = useState('');
  const { userDetails, schedule } = route.params || {};

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  const handleBarCodeScanned = async ({ type, data }) => {
    setScanned(true);
    
    try {
      // Verify the scanned QR code with backend
      const response = await axios.post(`${API_URL}/verify-bin`, {
        qrCode: data,
        collectorId: userDetails._id
      });

      setScanResult({
        success: true,
        data: response.data,
        qrCode: data
      });
      
    } catch (error) {
      setScanResult({
        success: false,
        error: error.response?.data?.message || 'Invalid QR Code',
        qrCode: data
      });
    }
    
    setShowResult(true);
  };

  const resetScanner = () => {
    setScanned(false);
    setShowResult(false);
    setScanResult(null);
  };

  const handleCompleteCollection = (scheduleData) => {
    setSelectedSchedule(scheduleData);
    setShowCompleteModal(true);
    setShowResult(false); // Close the scan result modal
  };

  const submitCollection = async () => {
    if (!wasteLevel || wasteLevel < 0 || wasteLevel > 100) {
      Alert.alert('Error', 'Please enter a valid waste level (0-100)');
      return;
    }

    try {
      const response = await axios.put(`${API_URL}/complete-collection`, {
        scheduleId: selectedSchedule._id,
        wasteLevel: parseInt(wasteLevel),
        notes: notes
      });

      if (response.data.success) {
        Alert.alert('Success', 'Collection completed successfully!');
        setShowCompleteModal(false);
        setWasteLevel('');
        setNotes('');
        resetScanner();
        navigation.goBack(); // Go back to dashboard
      } else {
        Alert.alert('Error', response.data.message || 'Failed to complete collection');
      }
    } catch (error) {
      console.error('Error completing collection:', error.response?.data || error.message);
      Alert.alert('Error', 'Failed to complete collection. Please try again.');
    }
  };

  // Helper functions for multiple bins
  const getBinNames = (scheduleData) => {
    if (!scheduleData.bins || scheduleData.bins.length === 0) {
      return 'Unknown Bin';
    }
    
    if (scheduleData.bins.length === 1) {
      return scheduleData.bins[0].binName || 'Unknown Bin';
    }
    
    return `${scheduleData.bins.length} Bins`;
  };

  const getBinTypes = (scheduleData) => {
    if (!scheduleData.bins || scheduleData.bins.length === 0) {
      return 'Unknown';
    }
    
    const types = [...new Set(scheduleData.bins.map(bin => bin.binType))];
    return types.join(', ');
  };

  const getFirstBinLocation = (scheduleData) => {
    if (!scheduleData.bins || scheduleData.bins.length === 0) {
      return 'No address specified';
    }
    
    return scheduleData.bins[0].location?.address || 'No address specified';
  };

  const getTotalCapacity = (scheduleData) => {
    if (!scheduleData.bins || scheduleData.bins.length === 0) {
      return 0;
    }
    
    return scheduleData.bins.reduce((total, bin) => total + (bin.capacity || 0), 0);
  };

  const formatTimeSlot = (timeSlot) => {
    return timeSlot || 'Not specified';
  };

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to use the camera</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr", "pdf417"],
        }}
      >
        <View style={styles.overlay}>
          <View style={styles.scanFrame} />
          <Text style={styles.scanText}>Align QR code within frame</Text>
          
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Scan QR Code</Text>
            <View style={styles.placeholder} />
          </View>
        </View>
      </CameraView>

      {/* Scan Result Modal */}
      <Modal
        visible={showResult}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {scanResult?.success ? 'QR Code Verified' : 'Scan Failed'}
              </Text>
              <TouchableOpacity onPress={resetScanner}>
                <Ionicons name="close" size={24} color="#7f8c8d" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {scanResult?.success ? (
                <>
                  <Ionicons 
                    name="checkmark-circle" 
                    size={64} 
                    color="#27ae60" 
                    style={styles.successIcon}
                  />
                  <Text style={styles.successText}>
                    Bin Verified Successfully!
                  </Text>
                  
                  <View style={styles.resultDetails}>
                    <Text style={styles.detailLabel}>Customer:</Text>
                    <Text style={styles.detailText}>
                      {scanResult.data.user?.email}
                    </Text>
                    
                    <Text style={styles.detailLabel}>Address:</Text>
                    <Text style={styles.detailText}>
                      {scanResult.data.bin?.location?.address}
                    </Text>
                    
                    <Text style={styles.detailLabel}>Bin Type:</Text>
                    <Text style={styles.detailText}>
                      {scanResult.data.bin?.binType} • {scanResult.data.bin?.capacity}L
                    </Text>
                  </View>

                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => handleCompleteCollection(scanResult.data.schedule)}
                  >
                    <Ionicons name="checkmark" size={20} color="#fff" />
                    <Text style={styles.actionButtonText}>Complete Collection</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Ionicons 
                    name="close-circle" 
                    size={64} 
                    color="#e74c3c" 
                    style={styles.errorIcon}
                  />
                  <Text style={styles.errorText}>
                    {scanResult?.error || 'Invalid QR Code'}
                  </Text>
                  <Text style={styles.errorSubtext}>
                    Scanned Code: {scanResult?.qrCode}
                  </Text>
                </>
              )}

              <TouchableOpacity 
                style={styles.scanAgainButton}
                onPress={resetScanner}
              >
                <Text style={styles.scanAgainText}>Scan Again</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Complete Collection Modal */}
      <Modal
        visible={showCompleteModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCompleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.completeModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Complete Collection</Text>
              <TouchableOpacity onPress={() => setShowCompleteModal(false)}>
                <Ionicons name="close" size={24} color="#7f8c8d" />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.modalBody}
              contentContainerStyle={styles.modalBodyContent} // FIXED: Added contentContainerStyle
            >
              {selectedSchedule && (
                <View style={styles.collectionInfo}>
                  <Text style={styles.infoLabel}>Customer:</Text>
                  <Text style={styles.infoText}>{selectedSchedule.user?.email}</Text>
                  
                  <Text style={styles.infoLabel}>Bin Details:</Text>
                  <Text style={styles.infoText}>
                    {getBinNames(selectedSchedule)} • {getBinTypes(selectedSchedule)} • {getTotalCapacity(selectedSchedule)}L
                  </Text>
                  
                  <Text style={styles.infoLabel}>Address:</Text>
                  <Text style={styles.infoText}>
                    {getFirstBinLocation(selectedSchedule)}
                  </Text>
                  
                  <Text style={styles.infoLabel}>Time Slot:</Text>
                  <Text style={styles.infoText}>
                    {formatTimeSlot(selectedSchedule.timeSlot)}
                  </Text>
                </View>
              )}

              <Text style={styles.label}>Waste Level (%) *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter waste level (0-100)"
                keyboardType="numeric"
                value={wasteLevel}
                onChangeText={setWasteLevel}
                maxLength={3}
              />

              <Text style={styles.label}>Notes (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Add any notes about the collection..."
                multiline
                numberOfLines={3}
                value={notes}
                onChangeText={setNotes}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={() => setShowCompleteModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.submitButton,
                    (!wasteLevel || wasteLevel < 0 || wasteLevel > 100) && styles.submitButtonDisabled
                  ]}
                  onPress={submitCollection}
                  disabled={!wasteLevel || wasteLevel < 0 || wasteLevel > 100}
                >
                  <Ionicons name="checkmark" size={20} color="#fff" />
                  <Text style={styles.submitButtonText}>Complete Collection</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: 'transparent',
    borderRadius: 12,
  },
  scanText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 20,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 8,
    borderRadius: 8,
  },
  header: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    maxHeight: '80%',
  },
  completeModalContent: {
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
    padding: 24,
  },
  modalBodyContent: {
    // FIXED: Add any layout styles for modal body content here
  },
  successIcon: {
    marginBottom: 16,
  },
  errorIcon: {
    marginBottom: 16,
  },
  successText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#27ae60',
    textAlign: 'center',
    marginBottom: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e74c3c',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 20,
  },
  resultDetails: {
    width: '100%',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7f8c8d',
    marginBottom: 2,
  },
  detailText: {
    fontSize: 14,
    color: '#2c3e50',
    marginBottom: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#27ae60',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
  scanAgainButton: {
    padding: 12,
  },
  scanAgainText: {
    color: '#3498db',
    fontWeight: '600',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
  },
  button: {
    backgroundColor: '#0e5cecff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  // Complete Collection Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  collectionInfo: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7f8c8d',
    marginBottom: 2,
  },
  infoText: {
    fontSize: 14,
    color: '#2c3e50',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 14,
    backgroundColor: '#fafafa',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7f8c8d',
  },
  submitButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#27ae60',
    padding: 16,
    borderRadius: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});