import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function StationsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#212121" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Find Stations</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <Ionicons name="location-outline" size={64} color="#BDBDBD" />
        <Text style={styles.comingSoonText}>Coming Soon!</Text>
        <Text style={styles.comingSoonSubtext}>
          We're working on adding nearby charging station locations to help you find the perfect charging spot.
        </Text>
        
        <TouchableOpacity 
          style={styles.scanButton}
          onPress={() => router.push('/(tabs)/scan')}>
          <Text style={styles.scanButtonText}>Scan QR Code Instead</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  comingSoonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212121',
    marginTop: 16,
    marginBottom: 12,
  },
  comingSoonSubtext: {
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  scanButton: {
    backgroundColor: '#1B5E20',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 8,
  },
  scanButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});