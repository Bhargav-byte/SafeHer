import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  TextInput,
  Modal,
} from 'react-native';
import { Reminder } from '../services/HealthTrackingService';

interface RemindersProps {
  onReminderCreated: (reminder: Reminder) => void;
}

export default function Reminders({ onReminderCreated }: RemindersProps) {
  const [reminders, setReminders] = useState<Reminder[]>([
    {
      id: '1',
      userId: 'user1',
      type: 'period',
      title: 'Period Start Reminder',
      description: 'Your period is predicted to start in 2 days',
      time: '09:00',
      isActive: true,
      daysOfWeek: [1, 2, 3, 4, 5], // Monday to Friday
    },
    {
      id: '2',
      userId: 'user1',
      type: 'water',
      title: 'Water Intake Reminder',
      description: 'Stay hydrated throughout the day',
      time: '10:00',
      isActive: true,
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6], // Every day
    },
    {
      id: '3',
      userId: 'user1',
      type: 'wellness',
      title: 'Wellness Check-in',
      description: 'Take a moment to log your mood and symptoms',
      time: '20:00',
      isActive: true,
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6], // Every day
    },
  ]);

  const [showAddReminder, setShowAddReminder] = useState(false);
  const [newReminder, setNewReminder] = useState({
    type: 'medication' as Reminder['type'],
    title: '',
    description: '',
    time: '09:00',
    daysOfWeek: [1, 2, 3, 4, 5],
  });

  const reminderTypes = [
    { key: 'period', emoji: '🩸', label: 'Period', color: '#e91e63' },
    { key: 'pms', emoji: '😰', label: 'PMS', color: '#ff9800' },
    { key: 'medication', emoji: '💊', label: 'Medication', color: '#4caf50' },
    { key: 'water', emoji: '💧', label: 'Water', color: '#2196f3' },
    { key: 'wellness', emoji: '🧘', label: 'Wellness', color: '#9c27b0' },
    { key: 'stretch', emoji: '🤸', label: 'Stretch/Walk', color: '#00bcd4' },
    { key: 'sleep', emoji: '😴', label: 'Sleep', color: '#673ab7' },
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const toggleReminder = (reminderId: string) => {
    setReminders(prev =>
      prev.map(reminder =>
        reminder.id === reminderId
          ? { ...reminder, isActive: !reminder.isActive }
          : reminder
      )
    );
  };

  const deleteReminder = (reminderId: string) => {
    Alert.alert(
      'Delete Reminder',
      'Are you sure you want to delete this reminder?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setReminders(prev => prev.filter(r => r.id !== reminderId));
          },
        },
      ]
    );
  };

  const addReminder = () => {
    if (!newReminder.title.trim()) {
      Alert.alert('Error', 'Please enter a reminder title');
      return;
    }

    const reminder: Reminder = {
      id: Date.now().toString(),
      userId: 'user1',
      ...newReminder,
    };

    setReminders(prev => [...prev, reminder]);
    onReminderCreated(reminder);
    
    // Reset form
    setNewReminder({
      type: 'medication',
      title: '',
      description: '',
      time: '09:00',
      daysOfWeek: [1, 2, 3, 4, 5],
    });
    setShowAddReminder(false);
    
    Alert.alert('Success', 'Reminder created successfully!');
  };

  const toggleDay = (dayIndex: number) => {
    setNewReminder(prev => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(dayIndex)
        ? prev.daysOfWeek.filter(d => d !== dayIndex)
        : [...prev.daysOfWeek, dayIndex]
    }));
  };

  const getReminderTypeInfo = (type: Reminder['type']) => {
    return reminderTypes.find(t => t.key === type) || reminderTypes[0];
  };

  const renderTimePicker = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
    const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));
    
    return (
      <View style={styles.timePickerContainer}>
        <Text style={styles.timePickerLabel}>Time</Text>
        <View style={styles.timePickerRow}>
          <TextInput
            style={styles.timeInput}
            value={newReminder.time.split(':')[0]}
            onChangeText={(hour) => {
              const currentTime = newReminder.time.split(':');
              setNewReminder(prev => ({
                ...prev,
                time: `${hour.padStart(2, '0')}:${currentTime[1]}`
              }));
            }}
            keyboardType="numeric"
            maxLength={2}
            placeholder="09"
          />
          <Text style={styles.timeSeparator}>:</Text>
          <TextInput
            style={styles.timeInput}
            value={newReminder.time.split(':')[1]}
            onChangeText={(minute) => {
              const currentTime = newReminder.time.split(':');
              setNewReminder(prev => ({
                ...prev,
                time: `${currentTime[0]}:${minute.padStart(2, '0')}`
              }));
            }}
            keyboardType="numeric"
            maxLength={2}
            placeholder="00"
          />
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Reminders & Notifications</Text>
        <Text style={styles.subtitle}>Stay on top of your health routine</Text>
      </View>

      {/* Active Reminders */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔔 Active Reminders</Text>
        {reminders.map((reminder) => {
          const typeInfo = getReminderTypeInfo(reminder.type);
          return (
            <View key={reminder.id} style={styles.reminderCard}>
              <View style={styles.reminderHeader}>
                <View style={styles.reminderType}>
                  <Text style={styles.reminderEmoji}>{typeInfo.emoji}</Text>
                  <Text style={styles.reminderTypeLabel}>{typeInfo.label}</Text>
                </View>
                <Switch
                  value={reminder.isActive}
                  onValueChange={() => toggleReminder(reminder.id)}
                  trackColor={{ false: '#767577', true: typeInfo.color }}
                  thumbColor={reminder.isActive ? '#f5dd4b' : '#f4f3f4'}
                />
              </View>
              
              <Text style={styles.reminderTitle}>{reminder.title}</Text>
              <Text style={styles.reminderDescription}>{reminder.description}</Text>
              
              <View style={styles.reminderDetails}>
                <Text style={styles.reminderTime}>⏰ {reminder.time}</Text>
                <Text style={styles.reminderDays}>
                  📅 {reminder.daysOfWeek.map(day => dayNames[day]).join(', ')}
                </Text>
              </View>
              
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => deleteReminder(reminder.id)}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>

      {/* Quick Reminders */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚡ Quick Reminders</Text>
        <View style={styles.quickRemindersContainer}>
          {reminderTypes.map((type) => (
            <TouchableOpacity
              key={type.key}
              style={[styles.quickReminderButton, { borderColor: type.color }]}
              onPress={() => {
                setNewReminder(prev => ({ ...prev, type: type.key as Reminder['type'] }));
                setShowAddReminder(true);
              }}
            >
              <Text style={styles.quickReminderEmoji}>{type.emoji}</Text>
              <Text style={styles.quickReminderLabel}>{type.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Add Custom Reminder */}
      <TouchableOpacity
        style={styles.addReminderButton}
        onPress={() => setShowAddReminder(true)}
      >
        <Text style={styles.addReminderText}>+ Add Custom Reminder</Text>
      </TouchableOpacity>

      {/* Add Reminder Modal */}
      <Modal
        visible={showAddReminder}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Reminder</Text>
            <TouchableOpacity onPress={() => setShowAddReminder(false)}>
              <Text style={styles.closeButton}>Cancel</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {/* Reminder Type */}
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Type</Text>
              <View style={styles.typeContainer}>
                {reminderTypes.map((type) => (
                  <TouchableOpacity
                    key={type.key}
                    style={[
                      styles.typeButton,
                      newReminder.type === type.key && styles.typeButtonActive,
                      { borderColor: type.color }
                    ]}
                    onPress={() => setNewReminder(prev => ({ ...prev, type: type.key as Reminder['type'] }))}
                  >
                    <Text style={styles.typeEmoji}>{type.emoji}</Text>
                    <Text style={[
                      styles.typeLabel,
                      newReminder.type === type.key && styles.typeLabelActive
                    ]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Title */}
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Title</Text>
              <TextInput
                style={styles.modalInput}
                value={newReminder.title}
                onChangeText={(text) => setNewReminder(prev => ({ ...prev, title: text }))}
                placeholder="Enter reminder title"
                placeholderTextColor="#999"
              />
            </View>

            {/* Description */}
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Description</Text>
              <TextInput
                style={styles.modalInput}
                value={newReminder.description}
                onChangeText={(text) => setNewReminder(prev => ({ ...prev, description: text }))}
                placeholder="Enter reminder description"
                placeholderTextColor="#999"
                multiline
              />
            </View>

            {/* Time */}
            <View style={styles.modalSection}>
              {renderTimePicker()}
            </View>

            {/* Days of Week */}
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Repeat Days</Text>
              <View style={styles.daysContainer}>
                {dayNames.map((day, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.dayButton,
                      newReminder.daysOfWeek.includes(index) && styles.dayButtonActive
                    ]}
                    onPress={() => toggleDay(index)}
                  >
                    <Text style={[
                      styles.dayText,
                      newReminder.daysOfWeek.includes(index) && styles.dayTextActive
                    ]}>
                      {day}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Add Button */}
            <TouchableOpacity style={styles.modalAddButton} onPress={addReminder}>
              <Text style={styles.modalAddButtonText}>Add Reminder</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
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
  reminderCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#e91e63',
  },
  reminderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reminderType: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reminderEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  reminderTypeLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  reminderDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  reminderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  reminderTime: {
    fontSize: 12,
    color: '#666',
  },
  reminderDays: {
    fontSize: 12,
    color: '#666',
  },
  deleteButton: {
    alignSelf: 'flex-end',
    backgroundColor: '#f44336',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  quickRemindersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickReminderButton: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: '#f8f8f8',
    minWidth: 80,
  },
  quickReminderEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  quickReminderLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  addReminderButton: {
    backgroundColor: '#e91e63',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 30,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  addReminderText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    fontSize: 16,
    color: '#e91e63',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalSection: {
    marginBottom: 24,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  typeButton: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: '#f8f8f8',
    minWidth: 80,
  },
  typeButtonActive: {
    backgroundColor: '#e91e63',
  },
  typeEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  typeLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  typeLabelActive: {
    color: 'white',
  },
  modalInput: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
    color: '#333',
  },
  timePickerContainer: {
    alignItems: 'center',
  },
  timePickerLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  timePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeInput: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
    minWidth: 60,
  },
  timeSeparator: {
    fontSize: 18,
    color: '#666',
    marginHorizontal: 8,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f8f8f8',
  },
  dayButtonActive: {
    backgroundColor: '#e91e63',
    borderColor: '#e91e63',
  },
  dayText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  dayTextActive: {
    color: 'white',
  },
  modalAddButton: {
    backgroundColor: '#e91e63',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  modalAddButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
