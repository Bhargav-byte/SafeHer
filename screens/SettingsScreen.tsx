import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  TextInput,
} from 'react-native';
import { UnusualActivityDetectionService, UserSettings } from '../services/UnusualActivityDetectionService';

export default function SettingsScreen() {
  const [settings, setSettings] = useState<UserSettings>({
    id: 'default',
    userId: 'user1',
    trackLateNightExit: true,
    trackRouteDeviation: true,
    trackMissedCheckin: true,
    trackRepeatedSos: true,
    trackHealthAnomaly: true,
    safeZoneRadius: 1000,
    lateNightStart: '22:00',
    lateNightEnd: '05:00',
    sosThreshold: 2,
    healthAnomalyThreshold: 3,
    autoSosEnabled: true,
    notificationEnabled: true
  });

  const [editingRadius, setEditingRadius] = useState(false);
  const [editingSosThreshold, setEditingSosThreshold] = useState(false);
  const [editingHealthThreshold, setEditingHealthThreshold] = useState(false);

  const detectionService = UnusualActivityDetectionService.getInstance();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // Load settings from service
      await detectionService.initialize('user1');
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const updateSetting = async (key: keyof UserSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    
    try {
      await detectionService.updateUserSettings(newSettings);
    } catch (error) {
      console.error('Error updating settings:', error);
      Alert.alert('Error', 'Failed to update settings');
    }
  };

  const toggleSetting = (key: keyof UserSettings) => {
    updateSetting(key, !settings[key]);
  };

  const updateRadius = () => {
    setEditingRadius(false);
  };

  const updateSosThreshold = () => {
    setEditingSosThreshold(false);
  };

  const updateHealthThreshold = () => {
    setEditingHealthThreshold(false);
  };

  const resetToDefaults = () => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset all settings to defaults?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            const defaultSettings: UserSettings = {
              id: 'default',
              userId: 'user1',
              trackLateNightExit: true,
              trackRouteDeviation: true,
              trackMissedCheckin: true,
              trackRepeatedSos: true,
              trackHealthAnomaly: true,
              safeZoneRadius: 1000,
              lateNightStart: '22:00',
              lateNightEnd: '05:00',
              sosThreshold: 2,
              healthAnomalyThreshold: 3,
              autoSosEnabled: true,
              notificationEnabled: true
            };
            setSettings(defaultSettings);
            detectionService.updateUserSettings(defaultSettings);
          }
        }
      ]
    );
  };

  const renderSettingRow = (
    title: string,
    description: string,
    value: boolean,
    onToggle: () => void,
    icon: string
  ) => (
    <View style={styles.settingRow}>
      <View style={styles.settingInfo}>
        <Text style={styles.settingIcon}>{icon}</Text>
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          <Text style={styles.settingDescription}>{description}</Text>
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#767577', true: '#e91e63' }}
        thumbColor={value ? '#f5dd4b' : '#f4f3f4'}
      />
    </View>
  );

  const renderNumericSetting = (
    title: string,
    description: string,
    value: number,
    unit: string,
    isEditing: boolean,
    onEdit: () => void,
    onSave: () => void,
    onChangeText: (text: string) => void,
    icon: string
  ) => (
    <View style={styles.settingRow}>
      <View style={styles.settingInfo}>
        <Text style={styles.settingIcon}>{icon}</Text>
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          <Text style={styles.settingDescription}>{description}</Text>
        </View>
      </View>
      <View style={styles.numericSetting}>
        {isEditing ? (
          <View style={styles.editContainer}>
            <TextInput
              style={styles.editInput}
              value={value.toString()}
              onChangeText={onChangeText}
              keyboardType="numeric"
              autoFocus
            />
            <TouchableOpacity style={styles.saveButton} onPress={onSave}>
              <Text style={styles.saveButtonText}>✓</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.valueButton} onPress={onEdit}>
            <Text style={styles.valueText}>{value} {unit}</Text>
            <Text style={styles.editIcon}>✏️</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Safety Settings</Text>
        <Text style={styles.subtitle}>Configure unusual activity detection</Text>
      </View>

      {/* Activity Tracking Toggles */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔍 Activity Tracking</Text>
        <Text style={styles.sectionDescription}>
          Enable or disable different types of unusual activity detection
        </Text>
        
        {renderSettingRow(
          'Late Night Exit Detection',
          'Alert when user leaves safe zone during late night hours',
          settings.trackLateNightExit,
          () => toggleSetting('trackLateNightExit'),
          '🌙'
        )}
        
        {renderSettingRow(
          'Route Deviation Detection',
          'Detect when user deviates from normal travel routes',
          settings.trackRouteDeviation,
          () => toggleSetting('trackRouteDeviation'),
          '🛣️'
        )}
        
        {renderSettingRow(
          'Missed Check-in Detection',
          'Alert when user misses expected check-ins',
          settings.trackMissedCheckin,
          () => toggleSetting('trackMissedCheckin'),
          '⏰'
        )}
        
        {renderSettingRow(
          'Repeated SOS Detection',
          'Flag when user triggers SOS multiple times per day',
          settings.trackRepeatedSos,
          () => toggleSetting('trackRepeatedSos'),
          '🚨'
        )}
        
        {renderSettingRow(
          'Health Anomaly Detection',
          'Detect multiple health anomalies within short time',
          settings.trackHealthAnomaly,
          () => toggleSetting('trackHealthAnomaly'),
          '❤️'
        )}
      </View>

      {/* Detection Parameters */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚙️ Detection Parameters</Text>
        <Text style={styles.sectionDescription}>
          Customize sensitivity and thresholds for detection
        </Text>
        
        {renderNumericSetting(
          'Safe Zone Radius',
          'Distance from home considered safe (in meters)',
          settings.safeZoneRadius,
          'm',
          editingRadius,
          () => setEditingRadius(true),
          updateRadius,
          (text) => updateSetting('safeZoneRadius', parseInt(text) || 1000),
          '🏠'
        )}
        
        {renderNumericSetting(
          'SOS Threshold',
          'Maximum SOS triggers per day before flagging',
          settings.sosThreshold,
          'per day',
          editingSosThreshold,
          () => setEditingSosThreshold(true),
          updateSosThreshold,
          (text) => updateSetting('sosThreshold', parseInt(text) || 2),
          '🚨'
        )}
        
        {renderNumericSetting(
          'Health Anomaly Threshold',
          'Maximum health anomalies per hour before flagging',
          settings.healthAnomalyThreshold,
          'per hour',
          editingHealthThreshold,
          () => setEditingHealthThreshold(true),
          updateHealthThreshold,
          (text) => updateSetting('healthAnomalyThreshold', parseInt(text) || 3),
          '❤️'
        )}
      </View>

      {/* Time Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🕐 Time Settings</Text>
        <Text style={styles.sectionDescription}>
          Configure late night hours for safety detection
        </Text>
        
        <View style={styles.timeSettingRow}>
          <Text style={styles.timeLabel}>Late Night Start</Text>
          <TouchableOpacity style={styles.timeButton}>
            <Text style={styles.timeText}>{settings.lateNightStart}</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.timeSettingRow}>
          <Text style={styles.timeLabel}>Late Night End</Text>
          <TouchableOpacity style={styles.timeButton}>
            <Text style={styles.timeText}>{settings.lateNightEnd}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Safety Features */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🛡️ Safety Features</Text>
        <Text style={styles.sectionDescription}>
          Configure automatic safety responses
        </Text>
        
        {renderSettingRow(
          'Auto-SOS Trigger',
          'Automatically trigger SOS when 3+ unusual events occur within 30 minutes',
          settings.autoSosEnabled,
          () => toggleSetting('autoSosEnabled'),
          '🚨'
        )}
        
        {renderSettingRow(
          'Push Notifications',
          'Receive notifications for unusual activities',
          settings.notificationEnabled,
          () => toggleSetting('notificationEnabled'),
          '🔔'
        )}
      </View>

      {/* Reset Button */}
      <TouchableOpacity style={styles.resetButton} onPress={resetToDefaults}>
        <Text style={styles.resetButtonText}>Reset to Defaults</Text>
      </TouchableOpacity>

      {/* Info Section */}
      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>ℹ️ How It Works</Text>
        <Text style={styles.infoText}>
          • Late Night Exit: Detects when you leave your safe zone during late night hours
        </Text>
        <Text style={styles.infoText}>
          • Route Deviation: Compares your current route to your last 5 normal routes
        </Text>
        <Text style={styles.infoText}>
          • Missed Check-ins: Flags when you miss expected check-in times
        </Text>
        <Text style={styles.infoText}>
          • Repeated SOS: Alerts when you trigger SOS multiple times per day
        </Text>
        <Text style={styles.infoText}>
          • Health Anomalies: Detects multiple health issues within short time periods
        </Text>
        <Text style={styles.infoText}>
          • Auto-SOS: Automatically alerts emergency contacts for multiple events
        </Text>
      </View>
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
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 24,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  numericSetting: {
    alignItems: 'flex-end',
  },
  valueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  valueText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    marginRight: 4,
  },
  editIcon: {
    fontSize: 12,
  },
  editContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editInput: {
    backgroundColor: '#f8f8f8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    fontSize: 14,
    color: '#333',
    minWidth: 60,
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: '#e91e63',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 4,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  timeSettingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  timeLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  timeButton: {
    backgroundColor: '#f8f8f8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  timeText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  resetButton: {
    backgroundColor: '#f44336',
    marginHorizontal: 20,
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  resetButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoSection: {
    backgroundColor: '#e3f2fd',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 30,
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#2196f3',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#1976d2',
    marginBottom: 6,
    lineHeight: 20,
  },
});
