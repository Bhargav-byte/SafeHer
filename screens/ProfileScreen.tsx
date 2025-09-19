import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { HealthTrackingService } from '../services/HealthTrackingService';

interface HealthStatus {
  periodDay: number;
  cycleLength: number;
  nextPeriod: string;
  symptoms: string[];
  mood: string;
  energy: string;
}

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  isActive: boolean;
}

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const navigation = useNavigation();
  const healthService = HealthTrackingService.getInstance();
  const [isLiveTracking, setIsLiveTracking] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [userProfile, setUserProfile] = useState({
    name: user?.email?.split('@')[0] || 'User',
    height: '165', // cm
    weight: '60', // kg
    phoneNumber: '+1 (555) 000-0000',
  });
  const [editForm, setEditForm] = useState({
    name: '',
    height: '',
    weight: '',
    phoneNumber: '',
  });
  const [healthStatus, setHealthStatus] = useState<HealthStatus>({
    periodDay: 1,
    cycleLength: 28,
    nextPeriod: '2025-02-15',
    symptoms: ['Cramps', 'Bloating'],
    mood: 'Tired',
    energy: 'Low',
  });
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([
    { id: '1', name: 'Mom', phone: '+1 (555) 123-4567', relationship: 'Family', isActive: true },
    { id: '2', name: 'Sarah', phone: '+1 (555) 987-6543', relationship: 'Friend', isActive: true },
    { id: '3', name: 'Emergency Services', phone: '100', relationship: 'Emergency', isActive: true },
  ]);

  const handleEditProfile = () => {
    setEditForm({
      name: userProfile.name,
      height: userProfile.height,
      weight: userProfile.weight,
      phoneNumber: userProfile.phoneNumber,
    });
    setShowEditModal(true);
  };

  const handleSaveProfile = () => {
    // Validate inputs
    if (!editForm.name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }
    if (!editForm.height.trim() || isNaN(Number(editForm.height)) || Number(editForm.height) <= 0) {
      Alert.alert('Error', 'Please enter a valid height');
      return;
    }
    if (!editForm.weight.trim() || isNaN(Number(editForm.weight)) || Number(editForm.weight) <= 0) {
      Alert.alert('Error', 'Please enter a valid weight');
      return;
    }
    if (!editForm.phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }

    // Update profile
    setUserProfile({
      name: editForm.name.trim(),
      height: editForm.height.trim(),
      weight: editForm.weight.trim(),
      phoneNumber: editForm.phoneNumber.trim(),
    });

    setShowEditModal(false);
    Alert.alert('Success', 'Profile updated successfully!');
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
  };

  const handleEmergencyContacts = () => {
    Alert.alert('Emergency Contacts', 'Contact management feature coming soon!');
  };

  const handleSettings = () => {
    navigation.navigate('Settings' as never);
  };

  const handleHelp = () => {
    Alert.alert('Help', 'Help feature coming soon!');
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: signOut },
      ]
    );
  };

  const toggleLiveTracking = (value: boolean) => {
    setIsLiveTracking(value);
    Alert.alert(
      'Live Tracking',
      value ? 'Live tracking enabled' : 'Live tracking disabled'
    );
  };

  const getCycleStatus = () => {
    const lastPeriodDate = new Date("2025-01-15");
    const cycleInfo = healthService.calculateCurrentCycleDay('user1', lastPeriodDate, 28);
    
    // Get phase color
    let color: string;
    switch (cycleInfo.phase) {
      case 'Menstrual':
        color = '#1E90FF';
        break;
      case 'Follicular':
        color = '#4caf50';
        break;
      case 'Ovulation':
        color = '#ff9800';
        break;
      case 'Luteal':
        color = '#9c27b0';
        break;
      default:
        color = '#666';
    }
    
    return { 
      phase: cycleInfo.phase, 
      color, 
      day: cycleInfo.cycleDay 
    };
  };

  const cycleStatus = getCycleStatus();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#2094fc" translucent={true} hidden={false} />
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {userProfile.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.userName}>{userProfile.name}</Text>
          <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
        </View>

      {/* Personal Information */}
      <View style={styles.statusCard}>
        <Text style={styles.cardTitle}>Personal Information</Text>
        
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Name</Text>
          <Text style={styles.infoValue}>{userProfile.name}</Text>
        </View>

        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Height</Text>
          <Text style={styles.infoValue}>{userProfile.height} cm</Text>
        </View>

        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Weight</Text>
          <Text style={styles.infoValue}>{userProfile.weight} kg</Text>
        </View>

        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Phone Number</Text>
          <Text style={styles.infoValue}>{userProfile.phoneNumber}</Text>
        </View>

        <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Health Status Overview */}
      <View style={styles.statusCard}>
        <Text style={styles.cardTitle}>Health Status</Text>
        <View style={styles.cycleInfo}>
          <View style={[styles.phaseIndicator, { backgroundColor: cycleStatus.color }]}>
            <Text style={styles.phaseText}>{cycleStatus.phase}</Text>
          </View>
          <View style={styles.cycleDetails}>
            <Text style={styles.cycleDay}>Day {cycleStatus.day}</Text>
            <Text style={styles.cycleDescription}>
              {cycleStatus.phase === 'Menstrual' && 'Your period is active'}
              {cycleStatus.phase === 'Follicular' && 'Building up for ovulation'}
              {cycleStatus.phase === 'Ovulation' && 'Most fertile period'}
              {cycleStatus.phase === 'Luteal' && 'Preparing for next cycle'}
            </Text>
          </View>
        </View>
        
        <View style={styles.moodContainer}>
          <View style={styles.moodItem}>
            <Text style={styles.moodLabel}>Mood</Text>
            <Text style={styles.moodValue}>{healthStatus.mood}</Text>
          </View>
          <View style={styles.moodItem}>
            <Text style={styles.moodLabel}>Energy</Text>
            <Text style={styles.moodValue}>{healthStatus.energy}</Text>
          </View>
        </View>
      </View>

      {/* Emergency Contacts */}
      <View style={styles.statusCard}>
        <Text style={styles.cardTitle}>Emergency Contacts</Text>
        <Text style={styles.cardSubtitle}>
          {emergencyContacts.filter(c => c.isActive).length} active contacts
        </Text>
        
        {emergencyContacts.slice(0, 3).map((contact) => (
          <View key={contact.id} style={styles.contactItem}>
            <View style={styles.contactInfo}>
              <Text style={styles.contactName}>{contact.name}</Text>
              <Text style={styles.contactPhone}>{contact.phone}</Text>
            </View>
            <View style={[
              styles.statusDot,
              { backgroundColor: contact.isActive ? '#4CAF50' : '#f44336' }
            ]} />
          </View>
        ))}
        
        <TouchableOpacity style={styles.viewAllButton} onPress={handleEmergencyContacts}>
          <Text style={styles.viewAllText}>View All Contacts</Text>
        </TouchableOpacity>
      </View>

      {/* Live Tracking Status */}
      <View style={styles.statusCard}>
        <Text style={styles.cardTitle}>Location Sharing</Text>
        <View style={styles.trackingStatus}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>
              {isLiveTracking ? 'Active' : 'Inactive'}
            </Text>
            <View style={[
              styles.statusIndicator,
              { backgroundColor: isLiveTracking ? '#4CAF50' : '#f44336' }
            ]} />
          </View>
          <Text style={styles.statusDescription}>
            {isLiveTracking 
              ? 'Your location is being shared every 15 seconds'
              : 'Location sharing is turned off'
            }
          </Text>
        </View>
        
        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>Enable Live Tracking</Text>
          <Switch
            value={isLiveTracking}
            onValueChange={toggleLiveTracking}
            trackColor={{ false: '#767577', true: '#1E90FF' }}
            thumbColor={isLiveTracking ? '#f5dd4b' : '#f4f3f4'}
          />
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.statusCard}>
        <Text style={styles.cardTitle}>Quick Stats</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>28</Text>
            <Text style={styles.statLabel}>Avg Cycle</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>5</Text>
            <Text style={styles.statLabel}>Days Period</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Months Tracked</Text>
          </View>
        </View>
      </View>

      {/* Account Settings */}
      <View style={styles.statusCard}>
        <Text style={styles.cardTitle}>Account Settings</Text>
        
        <TouchableOpacity style={styles.optionItem} onPress={handleSettings}>
          <Text style={styles.optionText}>App Settings</Text>
          <Text style={styles.optionArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionItem} onPress={handleHelp}>
          <Text style={styles.optionText}>Help & FAQ</Text>
          <Text style={styles.optionArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* App Information */}
      <View style={styles.statusCard}>
        <Text style={styles.cardTitle}>App Information</Text>
        
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>App Version</Text>
          <Text style={styles.infoValue}>1.0.0</Text>
        </View>

        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>User ID</Text>
          <Text style={styles.infoValue}>{user?.id?.substring(0, 8) || 'N/A'}</Text>
        </View>

        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Last Login</Text>
          <Text style={styles.infoValue}>Today</Text>
        </View>
      </View>

      {/* Emergency Information */}
      <View style={styles.emergencySection}>
        <Text style={styles.emergencyTitle}>Emergency Information</Text>
        <Text style={styles.emergencyText}>
          In case of emergency, use the SOS button on the home screen. 
          Your location will be sent to emergency contacts automatically.
        </Text>
        <Text style={styles.emergencyText}>
          📞 Emergency Helplines (India):
        </Text>
        <Text style={styles.emergencyText}>
          • Women Helpline: 1091{'\n'}
          • Domestic Violence: 181{'\n'}
          • Police: 100{'\n'}
          • Ambulance: 108{'\n'}
          • National Emergency: 112{'\n'}
          • Child Helpline: 1098{'\n'}
          • Mental Health Support: +91 9152987821{'\n'}
          • National Women's Helpline: 7827-170-170
        </Text>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCancelEdit}
      >
        <KeyboardAvoidingView 
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={handleCancelEdit} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={editForm.name}
                  onChangeText={(text) => setEditForm(prev => ({ ...prev, name: text }))}
                  placeholder="Enter your name"
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Height (cm)</Text>
                <TextInput
                  style={styles.textInput}
                  value={editForm.height}
                  onChangeText={(text) => setEditForm(prev => ({ ...prev, height: text }))}
                  placeholder="Enter height in cm"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Weight (kg)</Text>
                <TextInput
                  style={styles.textInput}
                  value={editForm.weight}
                  onChangeText={(text) => setEditForm(prev => ({ ...prev, weight: text }))}
                  placeholder="Enter weight in kg"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <TextInput
                  style={styles.textInput}
                  value={editForm.phoneNumber}
                  onChangeText={(text) => setEditForm(prev => ({ ...prev, phoneNumber: text }))}
                  placeholder="Enter phone number"
                  keyboardType="phone-pad"
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancelEdit}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile}>
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fef7f7',
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    backgroundColor: '#2094fc',
    paddingTop: Platform.OS === 'ios' ? 44 : 0,
    paddingBottom: 20,
    paddingHorizontal: 0,
    alignItems: 'center',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    marginTop: 20,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 16,
    color: 'white',
    opacity: 0.8,
  },
  statusCard: {
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
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  cycleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  phaseIndicator: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 16,
  },
  phaseText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  cycleDetails: {
    flex: 1,
  },
  cycleDay: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  cycleDescription: {
    fontSize: 14,
    color: '#666',
  },
  moodContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  moodItem: {
    alignItems: 'center',
  },
  moodLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  moodValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  contactItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  contactPhone: {
    fontSize: 14,
    color: '#666',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  viewAllButton: {
    backgroundColor: '#e6f3ff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignSelf: 'center',
    marginTop: 12,
  },
  viewAllText: {
    color: '#1E90FF',
    fontWeight: '600',
  },
  trackingStatus: {
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 10,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusDescription: {
    fontSize: 14,
    color: '#666',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabel: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E90FF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  optionArrow: {
    fontSize: 20,
    color: '#999',
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  emergencySection: {
    backgroundColor: '#fff3cd',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  emergencyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 10,
  },
  emergencyText: {
    fontSize: 14,
    color: '#856404',
    marginBottom: 8,
    lineHeight: 20,
  },
  logoutButton: {
    backgroundColor: '#f44336',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 30,
    padding: 15,
    borderRadius: 16,
    alignItems: 'center',
  },
  logoutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  editButton: {
    backgroundColor: '#1E90FF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignSelf: 'center',
    marginTop: 16,
  },
  editButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
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
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: 'bold',
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    borderRadius: 12,
    marginRight: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#1E90FF',
    paddingVertical: 12,
    borderRadius: 12,
    marginLeft: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});