import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { BodyMetrics } from '../services/HealthTrackingService';

interface BodyMetricsTrackingProps {
  onMetricsLogged: (bodyMetrics: BodyMetrics) => void;
}

export default function BodyMetricsTracking({ onMetricsLogged }: BodyMetricsTrackingProps) {
  const [weight, setWeight] = useState('');
  const [basalBodyTemp, setBasalBodyTemp] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [sleepHours, setSleepHours] = useState('');
  const [sleepQuality, setSleepQuality] = useState<'poor' | 'fair' | 'good' | 'excellent'>('good');
  const [waterIntake, setWaterIntake] = useState(8);

  const sleepQualityOptions = [
    { key: 'poor', label: 'Poor', color: '#f44336' },
    { key: 'fair', label: 'Fair', color: '#ff9800' },
    { key: 'good', label: 'Good', color: '#4caf50' },
    { key: 'excellent', label: 'Excellent', color: '#2196f3' },
  ];

  const logMetrics = () => {
    const bodyMetrics: Omit<BodyMetrics, 'id' | 'userId'> = {
      date: new Date(),
      weight: weight ? parseFloat(weight) : undefined,
      basalBodyTemp: basalBodyTemp ? parseFloat(basalBodyTemp) : undefined,
      heartRate: heartRate ? parseInt(heartRate) : undefined,
      sleepHours: sleepHours ? parseFloat(sleepHours) : undefined,
      sleepQuality,
      waterIntake,
    };

    onMetricsLogged(bodyMetrics as BodyMetrics);
    
    // Reset form
    setWeight('');
    setBasalBodyTemp('');
    setHeartRate('');
    setSleepHours('');
    setSleepQuality('good');
    setWaterIntake(8);
    
    Alert.alert('Success', 'Body metrics logged successfully!');
  };

  const renderWaterIntakeSlider = () => {
    return (
      <View style={styles.sliderContainer}>
        <Text style={styles.sliderLabel}>Water Intake: {waterIntake} glasses</Text>
        <View style={styles.sliderTrack}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((value) => (
            <TouchableOpacity
              key={value}
              style={[
                styles.sliderDot,
                value <= waterIntake && styles.sliderDotActive
              ]}
              onPress={() => setWaterIntake(value)}
            />
          ))}
        </View>
        <View style={styles.sliderLabels}>
          <Text style={styles.sliderLabelText}>1 glass</Text>
          <Text style={styles.sliderLabelText}>12+ glasses</Text>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Body Metrics</Text>
        <Text style={styles.subtitle}>Track your daily health metrics</Text>
      </View>

      {/* Weight */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🏋️‍♀️ Weight</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={weight}
            onChangeText={setWeight}
            placeholder="Enter weight (kg)"
            keyboardType="numeric"
            placeholderTextColor="#999"
          />
          <Text style={styles.inputUnit}>kg</Text>
        </View>
        <Text style={styles.inputNote}>Optional - Track weight changes during cycle</Text>
      </View>

      {/* Basal Body Temperature */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🌡️ Basal Body Temperature</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={basalBodyTemp}
            onChangeText={setBasalBodyTemp}
            placeholder="Enter BBT (°C)"
            keyboardType="numeric"
            placeholderTextColor="#999"
          />
          <Text style={styles.inputUnit}>°C</Text>
        </View>
        <Text style={styles.inputNote}>Take temperature first thing in the morning</Text>
      </View>

      {/* Heart Rate */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>❤️ Heart Rate</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={heartRate}
            onChangeText={setHeartRate}
            placeholder="Enter heart rate (bpm)"
            keyboardType="numeric"
            placeholderTextColor="#999"
          />
          <Text style={styles.inputUnit}>bpm</Text>
        </View>
        <Text style={styles.inputNote}>Resting heart rate (if available via wearables)</Text>
      </View>

      {/* Sleep Hours */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🛌 Sleep Hours</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={sleepHours}
            onChangeText={setSleepHours}
            placeholder="Enter sleep hours"
            keyboardType="numeric"
            placeholderTextColor="#999"
          />
          <Text style={styles.inputUnit}>hours</Text>
        </View>
        <Text style={styles.inputNote}>Total sleep duration last night</Text>
      </View>

      {/* Sleep Quality */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>😴 Sleep Quality</Text>
        <View style={styles.qualityContainer}>
          {sleepQualityOptions.map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.qualityButton,
                sleepQuality === option.key && styles.qualityButtonActive,
                { borderColor: option.color }
              ]}
              onPress={() => setSleepQuality(option.key as any)}
            >
              <Text style={[
                styles.qualityText,
                sleepQuality === option.key && styles.qualityTextActive
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Water Intake */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💧 Water Intake</Text>
        {renderWaterIntakeSlider()}
        <Text style={styles.inputNote}>Recommended: 8-10 glasses per day</Text>
      </View>

      {/* Wellness Tips */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💡 Today's Wellness Tips</Text>
        <View style={styles.tipsContainer}>
          <Text style={styles.tipText}>• Track BBT at the same time daily</Text>
          <Text style={styles.tipText}>• Aim for 7-9 hours of quality sleep</Text>
          <Text style={styles.tipText}>• Stay hydrated throughout the day</Text>
          <Text style={styles.tipText}>• Monitor heart rate trends</Text>
        </View>
      </View>

      {/* Log Button */}
      <TouchableOpacity style={styles.logButton} onPress={logMetrics}>
        <Text style={styles.logButtonText}>Log Metrics</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fef7f7',
  },
  header: {
    backgroundColor: '#e91e63',
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
    fontSize: 14,
    color: 'white',
    marginTop: 5,
    opacity: 0.9,
  },
  section: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  inputUnit: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
    fontWeight: '600',
  },
  inputNote: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
  },
  sliderContainer: {
    marginVertical: 10,
  },
  sliderLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  sliderTrack: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sliderDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ddd',
    borderWidth: 2,
    borderColor: '#ccc',
  },
  sliderDotActive: {
    backgroundColor: '#e91e63',
    borderColor: '#e91e63',
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderLabelText: {
    fontSize: 12,
    color: '#666',
  },
  qualityContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  qualityButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    backgroundColor: '#f8f8f8',
  },
  qualityButtonActive: {
    backgroundColor: '#e91e63',
  },
  qualityText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  qualityTextActive: {
    color: 'white',
  },
  tipsContainer: {
    backgroundColor: '#f8f8f8',
    padding: 16,
    borderRadius: 12,
  },
  tipText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    lineHeight: 20,
  },
  logButton: {
    backgroundColor: '#e91e63',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 30,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  logButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
