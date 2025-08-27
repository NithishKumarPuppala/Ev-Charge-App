import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Constants from 'expo-constants';

const { width } = Dimensions.get('window');

export default function ScanScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);

  const baseURL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL;

  useEffect(() => {
    getCameraPermissions();
  }, []);

  const getCameraPermissions = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    if (scanned) return;
    
    setScanned(true);
    setLoading(true);

    try {
      // Parse QR code data
      let qrData;
      try {
        // Try to parse as JSON first
        qrData = JSON.parse(data);
      } catch {
        // If not JSON, treat as string with format "station_id:amount"
        const parts = data.split(':');
        if (parts.length === 2) {
          qrData = {
            station_id: parts[0],
            amount: parseInt(parts[1]) * 100, // Convert to paise
          };
        } else {
          throw new Error('Invalid QR code format');
        }
      }

      // Validate required fields
      if (!qrData.station_id || !qrData.amount) {
        throw new Error('Invalid QR code: Missing station ID or amount');
      }

      // Navigate to charge selection screen
      router.push({
        pathname: '/charge-selection',
        params: {
          station_id: qrData.station_id,
        },
      });
    } catch (error) {
      console.error('QR scan error:', error);
      Alert.alert(
        'Invalid QR Code',
        'This QR code is not valid for charging station payments. Please scan a valid charging station QR code.',
        [
          {
            text: 'Scan Again',
            onPress: () => {
              setScanned(false);
              setLoading(false);
            },
          },
        ]
      );
    }
  };

  if (hasPermission === null) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#1B5E20" />
          <Text style={styles.loadingText}>Requesting camera permission...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Ionicons name="camera-outline" size={64} color="#BDBDBD" />
          <Text style={styles.noPermissionText}>Camera permission not granted</Text>
          <Text style={styles.noPermissionSubtext}>
            Please enable camera access in your device settings to scan QR codes.
          </Text>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={getCameraPermissions}>
            <Text style={styles.settingsButtonText}>Request Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan QR Code</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          facing="back"
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr', 'pdf417'],
          }}
        />

        {/* Overlay */}
        <View style={styles.overlay}>
          {/* Top overlay */}
          <View style={styles.overlayTop} />
          
          {/* Middle section with scanning area */}
          <View style={styles.overlayMiddle}>
            <View style={styles.overlaySide} />
            <View style={styles.scanArea}>
              {/* Corner indicators */}
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
              
              {loading && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color="white" />
                  <Text style={styles.processingText}>Processing...</Text>
                </View>
              )}
            </View>
            <View style={styles.overlaySide} />
          </View>
          
          {/* Bottom overlay */}
          <View style={styles.overlayBottom} />
        </View>
      </View>

      {/* Instructions */}
      <View style={styles.instructions}>
        <Ionicons name="qr-code" size={32} color="#1B5E20" />
        <Text style={styles.instructionText}>
          Point your camera at the QR code on the charging station
        </Text>
        <Text style={styles.instructionSubtext}>
          The QR code will be scanned automatically
        </Text>
      </View>

      {/* Manual Entry Button */}
      <View style={styles.manualEntry}>
        <TouchableOpacity
          style={styles.manualButton}
          onPress={() => {
            // For demo, create a test QR code data
            const testData = {
              station_id: 'DEMO001',
              amount: 50000, // ₹500 in paise
            };
            router.push({
              pathname: '/payment',
              params: {
                station_id: testData.station_id,
                amount: testData.amount.toString(),
              },
            });
          }}>
          <Text style={styles.manualButtonText}>Demo Payment</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    fontSize: 16,
    color: '#757575',
    marginTop: 16,
  },
  noPermissionText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  noPermissionSubtext: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  settingsButton: {
    backgroundColor: '#1B5E20',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  settingsButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  placeholder: {
    width: 40,
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlayTop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  overlayMiddle: {
    flexDirection: 'row',
    height: width * 0.7,
  },
  overlaySide: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  scanArea: {
    width: width * 0.7,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#1B5E20',
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  loadingOverlay: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingText: {
    fontSize: 16,
    color: 'white',
    marginTop: 12,
    fontWeight: '600',
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  instructions: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  instructionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  instructionSubtext: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
  },
  manualEntry: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  manualButton: {
    backgroundColor: '#1B5E20',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  manualButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});