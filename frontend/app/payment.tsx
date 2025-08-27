import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import Constants from 'expo-constants';

export default function PaymentScreen() {
  const { station_id, amount } = useLocalSearchParams<{
    station_id: string;
    amount: string;
  }>();
  
  const [loading, setLoading] = useState(false);
  
  const baseURL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL;
  
  const formatAmount = (amountInPaise: number) => {
    return (amountInPaise / 100).toFixed(2);
  };

  const handlePayment = async () => {
    if (!station_id || !amount) {
      Alert.alert('Error', 'Invalid payment details');
      return;
    }

    setLoading(true);

    try {
      // Create payment order
      const orderResponse = await fetch(`${baseURL}/api/payment/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          station_id,
          amount: parseInt(amount),
          currency: 'INR',
        }),
      });

      if (!orderResponse.ok) {
        throw new Error('Failed to create payment order');
      }

      const orderData = await orderResponse.json();

      // For demo purposes, simulate payment success
      // In real app, this would integrate with Razorpay SDK
      setTimeout(async () => {
        try {
          // Simulate payment completion
          const paymentResponse = await fetch(`${baseURL}/api/payment/complete`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              order_id: orderData.order_id,
              payment_id: `pay_${Date.now()}`,
              status: 'success',
              station_id,
              amount: parseInt(amount),
            }),
          });

          if (!paymentResponse.ok) {
            throw new Error('Failed to complete payment');
          }

          const paymentData = await paymentResponse.json();

          // Navigate to success screen
          router.replace({
            pathname: '/success',
            params: {
              transaction_id: paymentData.transaction_id,
              station_id,
              amount,
              payment_id: paymentData.payment_id,
            },
          });
        } catch (error) {
          console.error('Payment completion error:', error);
          Alert.alert(
            'Payment Failed',
            'There was an error processing your payment. Please try again.',
            [
              {
                text: 'Retry',
                onPress: () => setLoading(false),
              },
              {
                text: 'Cancel',
                style: 'cancel',
                onPress: () => router.back(),
              },
            ]
          );
        }
      }, 2000); // Simulate processing time

    } catch (error) {
      console.error('Payment error:', error);
      setLoading(false);
      Alert.alert(
        'Payment Error',
        'Unable to process payment. Please check your connection and try again.',
        [
          {
            text: 'Retry',
            onPress: () => handlePayment(),
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => router.back(),
          },
        ]
      );
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1B5E20" />
          <Text style={styles.loadingText}>Processing Payment...</Text>
          <Text style={styles.loadingSubtext}>Please wait while we process your payment securely</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#212121" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Confirm Payment</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Station Info Card */}
        <View style={styles.stationCard}>
          <LinearGradient
            colors={['#2E7D32', '#1B5E20']}
            style={styles.stationGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}>
            <View style={styles.stationIcon}>
              <Ionicons name="flash" size={32} color="white" />
            </View>
            <View style={styles.stationInfo}>
              <Text style={styles.stationTitle}>EV Charging Station</Text>
              <Text style={styles.stationId}>Station ID: #{station_id}</Text>
              <Text style={styles.stationLocation}>Location: Demo Station</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Payment Details */}
        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Payment Details</Text>
          
          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Charging Amount</Text>
              <Text style={styles.detailValue}>₹{formatAmount(parseInt(amount || '0'))}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Service Fee</Text>
              <Text style={styles.detailValue}>₹0.00</Text>
            </View>
            
            <View style={styles.separator} />
            
            <View style={styles.detailRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>₹{formatAmount(parseInt(amount || '0'))}</Text>
            </View>
          </View>
        </View>

        {/* Payment Method */}
        <View style={styles.paymentMethodSection}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          
          <View style={styles.paymentMethodCard}>
            <View style={styles.paymentMethodRow}>
              <View style={styles.upiIcon}>
                <Ionicons name="card" size={24} color="#1B5E20" />
              </View>
              <View style={styles.paymentMethodInfo}>
                <Text style={styles.paymentMethodName}>UPI Payment</Text>
                <Text style={styles.paymentMethodDesc}>
                  Pay securely using UPI, Cards, Net Banking & more
                </Text>
              </View>
              <Ionicons name="checkmark-circle" size={24} color="#2E7D32" />
            </View>
          </View>
        </View>

        {/* Security Notice */}
        <View style={styles.securityNotice}>
          <Ionicons name="shield-checkmark" size={20} color="#2E7D32" />
          <Text style={styles.securityText}>
            Your payment is secured with bank-level encryption
          </Text>
        </View>
      </ScrollView>

      {/* Pay Button */}
      <View style={styles.payButtonContainer}>
        <TouchableOpacity
          style={styles.payButton}
          onPress={handlePayment}
          activeOpacity={0.8}>
          <LinearGradient
            colors={['#2E7D32', '#1B5E20']}
            style={styles.payGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}>
            <Ionicons name="card" size={24} color="white" />
            <Text style={styles.payButtonText}>
              Pay ₹{formatAmount(parseInt(amount || '0'))}
            </Text>
          </LinearGradient>
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
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    marginTop: 16,
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
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
  stationCard: {
    margin: 16,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#1B5E20',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  stationGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
  },
  stationIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  stationInfo: {
    flex: 1,
  },
  stationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  stationId: {
    fontSize: 14,
    color: '#E8F5E8',
    marginBottom: 2,
  },
  stationLocation: {
    fontSize: 14,
    color: '#E8F5E8',
  },
  detailsSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 12,
  },
  detailsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 16,
    color: '#757575',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
  },
  separator: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1B5E20',
  },
  paymentMethodSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  paymentMethodCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  paymentMethodRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  upiIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F5E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  paymentMethodInfo: {
    flex: 1,
  },
  paymentMethodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 4,
  },
  paymentMethodDesc: {
    fontSize: 14,
    color: '#757575',
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  securityText: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '500',
    marginLeft: 8,
  },
  payButtonContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  payButton: {
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#1B5E20',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  payGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  payButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 12,
  },
});