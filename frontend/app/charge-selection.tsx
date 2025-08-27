import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

export default function ChargeSelectionScreen() {
  const { station_id } = useLocalSearchParams<{
    station_id: string;
  }>();

  const [activeTab, setActiveTab] = useState<'money' | 'units'>('money');
  const [moneyAmount, setMoneyAmount] = useState('');
  const [unitsAmount, setUnitsAmount] = useState('');
  const [calculatedUnits, setCalculatedUnits] = useState(0);
  const [calculatedMoney, setCalculatedMoney] = useState(0);

  // Demo rates - ₹22 per kWh (realistic Indian EV charging rates)
  const RATE_PER_KWH = 22;
  const MIN_CHARGE_AMOUNT = 50; // Minimum ₹50
  const MAX_CHARGE_AMOUNT = 2000; // Maximum ₹2000

  useEffect(() => {
    if (activeTab === 'money' && moneyAmount) {
      const money = parseFloat(moneyAmount);
      if (!isNaN(money) && money > 0) {
        const units = money / RATE_PER_KWH;
        setCalculatedUnits(Math.round(units * 100) / 100); // Round to 2 decimal places
      } else {
        setCalculatedUnits(0);
      }
    }
  }, [moneyAmount, activeTab]);

  useEffect(() => {
    if (activeTab === 'units' && unitsAmount) {
      const units = parseFloat(unitsAmount);
      if (!isNaN(units) && units > 0) {
        const money = units * RATE_PER_KWH;
        setCalculatedMoney(Math.round(money * 100) / 100); // Round to 2 decimal places
      } else {
        setCalculatedMoney(0);
      }
    }
  }, [unitsAmount, activeTab]);

  const handlePresetAmount = (amount: number) => {
    if (activeTab === 'money') {
      setMoneyAmount(amount.toString());
    } else {
      const money = amount * RATE_PER_KWH;
      setMoneyAmount(money.toString());
      setUnitsAmount(amount.toString());
    }
  };

  const handleProceedToPayment = () => {
    let finalAmount = 0;

    if (activeTab === 'money') {
      const money = parseFloat(moneyAmount);
      if (!money || money < MIN_CHARGE_AMOUNT || money > MAX_CHARGE_AMOUNT) {
        Alert.alert(
          'Invalid Amount',
          `Please enter an amount between ₹${MIN_CHARGE_AMOUNT} and ₹${MAX_CHARGE_AMOUNT}`
        );
        return;
      }
      finalAmount = money;
    } else {
      const units = parseFloat(unitsAmount);
      if (!units || units <= 0 || units > (MAX_CHARGE_AMOUNT / RATE_PER_KWH)) {
        Alert.alert(
          'Invalid Units',
          `Please enter units between 1 and ${Math.floor(MAX_CHARGE_AMOUNT / RATE_PER_KWH)} kWh`
        );
        return;
      }
      finalAmount = calculatedMoney;
    }

    // Navigate to payment with selected amount
    router.push({
      pathname: '/payment',
      params: {
        station_id,
        amount: (finalAmount * 100).toString(), // Convert to paise
        units: activeTab === 'money' ? calculatedUnits.toString() : unitsAmount,
      },
    });
  };

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
          <Text style={styles.headerTitle}>Select Charging Amount</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Station Info */}
        <View style={styles.stationCard}>
          <LinearGradient
            colors={['#2E7D32', '#1B5E20']}
            style={styles.stationGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}>
            <View style={styles.stationIcon}>
              <Ionicons name="flash" size={24} color="white" />
            </View>
            <View style={styles.stationInfo}>
              <Text style={styles.stationName}>EV Charging Station</Text>
              <Text style={styles.stationId}>Station ID: #{station_id}</Text>
              <Text style={styles.stationRate}>Rate: ₹{RATE_PER_KWH}/kWh</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Tab Selector */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'money' && styles.activeTab]}
            onPress={() => setActiveTab('money')}>
            <Ionicons 
              name="cash" 
              size={20} 
              color={activeTab === 'money' ? 'white' : '#1B5E20'} 
            />
            <Text style={[
              styles.tabText, 
              activeTab === 'money' && styles.activeTabText
            ]}>
              By Money
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'units' && styles.activeTab]}
            onPress={() => setActiveTab('units')}>
            <Ionicons 
              name="battery-charging" 
              size={20} 
              color={activeTab === 'units' ? 'white' : '#1B5E20'} 
            />
            <Text style={[
              styles.tabText, 
              activeTab === 'units' && styles.activeTabText
            ]}>
              By Units
            </Text>
          </TouchableOpacity>
        </View>

        {/* Input Section */}
        <View style={styles.inputSection}>
          {activeTab === 'money' ? (
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Enter Amount (₹)</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.currencySymbol}>₹</Text>
                <TextInput
                  style={styles.input}
                  value={moneyAmount}
                  onChangeText={setMoneyAmount}
                  placeholder="0"
                  keyboardType="numeric"
                  maxLength={5}
                />
              </View>
              {calculatedUnits > 0 && (
                <View style={styles.calculationResult}>
                  <Ionicons name="calculator" size={16} color="#1B5E20" />
                  <Text style={styles.calculationText}>
                    = {calculatedUnits} kWh
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Enter Units (kWh)</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={unitsAmount}
                  onChangeText={setUnitsAmount}
                  placeholder="0"
                  keyboardType="numeric"
                  maxLength={5}
                />
                <Text style={styles.unitSymbol}>kWh</Text>
              </View>
              {calculatedMoney > 0 && (
                <View style={styles.calculationResult}>
                  <Ionicons name="calculator" size={16} color="#1B5E20" />
                  <Text style={styles.calculationText}>
                    = ₹{calculatedMoney}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Preset Options */}
        <View style={styles.presetsSection}>
          <Text style={styles.presetsTitle}>Quick Select</Text>
          
          <View style={styles.presetsGrid}>
            {activeTab === 'money' ? (
              <>
                <TouchableOpacity 
                  style={styles.presetCard}
                  onPress={() => handlePresetAmount(100)}>
                  <Text style={styles.presetAmount}>₹100</Text>
                  <Text style={styles.presetUnits}>~{Math.round((100/RATE_PER_KWH)*100)/100} kWh</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.presetCard}
                  onPress={() => handlePresetAmount(200)}>
                  <Text style={styles.presetAmount}>₹200</Text>
                  <Text style={styles.presetUnits}>~{Math.round((200/RATE_PER_KWH)*100)/100} kWh</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.presetCard}
                  onPress={() => handlePresetAmount(500)}>
                  <Text style={styles.presetAmount}>₹500</Text>
                  <Text style={styles.presetUnits}>~{Math.round((500/RATE_PER_KWH)*100)/100} kWh</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.presetCard}
                  onPress={() => handlePresetAmount(1000)}>
                  <Text style={styles.presetAmount}>₹1000</Text>
                  <Text style={styles.presetUnits}>~{Math.round((1000/RATE_PER_KWH)*100)/100} kWh</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity 
                  style={styles.presetCard}
                  onPress={() => handlePresetAmount(5)}>
                  <Text style={styles.presetAmount}>5 kWh</Text>
                  <Text style={styles.presetUnits}>₹{5 * RATE_PER_KWH}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.presetCard}
                  onPress={() => handlePresetAmount(10)}>
                  <Text style={styles.presetAmount}>10 kWh</Text>
                  <Text style={styles.presetUnits}>₹{10 * RATE_PER_KWH}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.presetCard}
                  onPress={() => handlePresetAmount(20)}>
                  <Text style={styles.presetAmount}>20 kWh</Text>
                  <Text style={styles.presetUnits}>₹{20 * RATE_PER_KWH}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.presetCard}
                  onPress={() => handlePresetAmount(50)}>
                  <Text style={styles.presetAmount}>50 kWh</Text>
                  <Text style={styles.presetUnits}>₹{50 * RATE_PER_KWH}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle" size={20} color="#1B5E20" />
            <Text style={styles.infoTitle}>Charging Info</Text>
          </View>
          <View style={styles.infoContent}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Rate per kWh:</Text>
              <Text style={styles.infoValue}>₹{RATE_PER_KWH}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Minimum charge:</Text>
              <Text style={styles.infoValue}>₹{MIN_CHARGE_AMOUNT}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Maximum charge:</Text>
              <Text style={styles.infoValue}>₹{MAX_CHARGE_AMOUNT}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Average car range:</Text>
              <Text style={styles.infoValue}>4-5 km/kWh</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Proceed Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.proceedButton}
          onPress={handleProceedToPayment}
          activeOpacity={0.8}>
          <LinearGradient
            colors={['#2E7D32', '#1B5E20']}
            style={styles.proceedGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}>
            <Text style={styles.proceedButtonText}>
              Proceed to Payment
            </Text>
            <Ionicons name="arrow-forward" size={20} color="white" />
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
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#1B5E20',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  stationGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  stationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stationInfo: {
    flex: 1,
  },
  stationName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 2,
  },
  stationId: {
    fontSize: 14,
    color: '#E8F5E8',
    marginBottom: 2,
  },
  stationRate: {
    fontSize: 14,
    color: '#E8F5E8',
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: '#E8F5E8',
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: '#1B5E20',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1B5E20',
    marginLeft: 6,
  },
  activeTabText: {
    color: 'white',
  },
  inputSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  inputContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1B5E20',
    marginRight: 8,
  },
  unitSymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: '#757575',
    marginLeft: 8,
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    textAlign: 'center',
  },
  calculationResult: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  calculationText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1B5E20',
    marginLeft: 6,
  },
  presetsSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  presetsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 12,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  presetCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  presetAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 4,
  },
  presetUnits: {
    fontSize: 12,
    color: '#757575',
  },
  infoCard: {
    backgroundColor: '#E8F5E8',
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 12,
    padding: 16,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1B5E20',
    marginLeft: 6,
  },
  infoContent: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: '#2E7D32',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1B5E20',
  },
  buttonContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  proceedButton: {
    borderRadius: 8,
    elevation: 4,
    shadowColor: '#1B5E20',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  proceedGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
  },
  proceedButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginRight: 8,
  },
});