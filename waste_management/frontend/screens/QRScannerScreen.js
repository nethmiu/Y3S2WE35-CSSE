import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert,
  Modal 
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
  const [scanResult, setScanResult] = useState(null);
  const { userDetails } = route.params;

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

  const handleCompleteCollection = async (scheduleId) => {
    try {
      navigation.navigate('CompleteCollection', { 
        scheduleId,
        userDetails 
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to process collection');
    }
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
                    onPress={() => handleCompleteCollection(scanResult.data.schedule?._id)}
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
    alignItems: 'center',
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
});