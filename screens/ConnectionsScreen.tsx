import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Switch,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
  Modal,
  FlatList,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import * as Location from 'expo-location';

// Types and Interfaces
interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  isActive: boolean;
  safetyCircle: 'family' | 'friends' | 'colleagues' | 'emergency';
  priority: number; // 1 = highest priority
  lastSeen?: Date;
  responseTime?: number; // in minutes
}

interface CheckInRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  message: string;
  timestamp: Date;
  expiresAt: Date;
  status: 'pending' | 'responded' | 'expired';
}

interface GhostModeSession {
  id: string;
  contacts: string[];
  duration: number; // in minutes
  startTime: Date;
  endTime: Date;
  isActive: boolean;
}

interface CommunityAlert {
  id: string;
  userId: string;
  type: 'dark_area' | 'suspicious' | 'safe_zone' | 'emergency';
  location: {
    latitude: number;
    longitude: number;
  };
  description: string;
  timestamp: Date;
  isAnonymous: boolean;
}

interface HealthStatusShare {
  id: string;
  userId: string;
  mood: string;
  periodStatus: string;
  symptoms: string[];
  timestamp: Date;
  sharedWith: string[];
}

interface UserProfile {
  id: string;
  name: string;
  age: number;
  location: string;
  interests: string[];
  safetyCircle: 'family' | 'friends' | 'colleagues' | 'community';
  isOnline: boolean;
  lastSeen: Date;
  mutualConnections: number;
  bio: string;
  profileImage?: string;
}

interface FriendRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'declined' | 'blocked';
  timestamp: Date;
  message?: string;
}

export default function ConnectionsScreen() {
  // State Management
  const [isLiveTracking, setIsLiveTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [trackingInterval, setTrackingInterval] = useState<number | null>(null);
  
  // Emergency Contacts with enhanced features
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([
    { id: '1', name: 'Mom', phone: '+1 (555) 123-4567', relationship: 'Family', isActive: true, safetyCircle: 'family', priority: 1, responseTime: 5 },
    { id: '2', name: 'Sarah', phone: '+1 (555) 987-6543', relationship: 'Friend', isActive: true, safetyCircle: 'friends', priority: 2, responseTime: 10 },
    { id: '3', name: 'Emergency Services', phone: '100', relationship: 'Emergency', isActive: true, safetyCircle: 'emergency', priority: 1, responseTime: 0 },
  ]);

  // New Contact Form
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactCircle, setNewContactCircle] = useState<'family' | 'friends' | 'colleagues' | 'emergency'>('friends');
  const [showAddContactModal, setShowAddContactModal] = useState(false);

  // Trusted Network Check-in
  const [checkInRequests, setCheckInRequests] = useState<CheckInRequest[]>([]);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [checkInMessage, setCheckInMessage] = useState('');
  const [selectedCheckInContacts, setSelectedCheckInContacts] = useState<string[]>([]);

  // Safety Circles
  const [activeSafetyCircle, setActiveSafetyCircle] = useState<'all' | 'family' | 'friends' | 'colleagues' | 'emergency'>('all');
  const [showCircleModal, setShowCircleModal] = useState(false);

  // Ghost Mode
  const [ghostModeSession, setGhostModeSession] = useState<GhostModeSession | null>(null);
  const [showGhostModeModal, setShowGhostModeModal] = useState(false);
  const [ghostModeDuration, setGhostModeDuration] = useState(30);
  const [selectedGhostContacts, setSelectedGhostContacts] = useState<string[]>([]);

  // Health Status Share
  const [showHealthShareModal, setShowHealthShareModal] = useState(false);
  const [currentMood, setCurrentMood] = useState('neutral');
  const [currentPeriodStatus, setCurrentPeriodStatus] = useState('normal');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);

  // Community Feed
  const [communityAlerts, setCommunityAlerts] = useState<CommunityAlert[]>([]);
  const [showCommunityModal, setShowCommunityModal] = useState(false);

  // Help Request
  const [showHelpRequestModal, setShowHelpRequestModal] = useState(false);
  const [helpRequestMessage, setHelpRequestMessage] = useState('');

  // Smart Suggestions
  const [smartSuggestions, setSmartSuggestions] = useState<string[]>([]);

  // Search & Connect Features
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [showFriendRequestsModal, setShowFriendRequestsModal] = useState(false);
  const [searchFilters, setSearchFilters] = useState({
    location: '',
    interests: [] as string[],
    ageRange: { min: 18, max: 65 },
    safetyCircle: 'all' as string,
    onlineOnly: false,
  });

  // Conversation Features
  const [showConversationModal, setShowConversationModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState<EmergencyContact | null>(null);
  const [conversationMessages, setConversationMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');

  // Sample users for search (in real app, this would come from backend)
  const [sampleUsers] = useState<UserProfile[]>([
    {
      id: 'user2',
      name: 'Sarah Johnson',
      age: 24,
      location: 'Downtown',
      interests: ['yoga', 'safety', 'health'],
      safetyCircle: 'friends',
      isOnline: true,
      lastSeen: new Date(),
      mutualConnections: 2,
      bio: 'Safety advocate and yoga instructor. Always here to help!',
    },
    {
      id: 'user3',
      name: 'Maria Rodriguez',
      age: 28,
      location: 'University Area',
      interests: ['running', 'safety', 'community'],
      safetyCircle: 'community',
      isOnline: false,
      lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      mutualConnections: 1,
      bio: 'Runner and community safety volunteer. Let\'s keep each other safe!',
    },
    {
      id: 'user4',
      name: 'Emily Chen',
      age: 22,
      location: 'Campus',
      interests: ['studying', 'safety', 'friends'],
      safetyCircle: 'friends',
      isOnline: true,
      lastSeen: new Date(),
      mutualConnections: 3,
      bio: 'College student who believes in supporting each other. Safety first!',
    },
    {
      id: 'user5',
      name: 'Lisa Thompson',
      age: 31,
      location: 'Suburbs',
      interests: ['family', 'safety', 'health'],
      safetyCircle: 'family',
      isOnline: false,
      lastSeen: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      mutualConnections: 0,
      bio: 'Mom of two, always looking out for our community\'s safety.',
    },
  ]);

  useEffect(() => {
    requestPermissions();
    loadInitialData();
  }, []);

  const requestPermissions = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required for safety features');
        return;
      }
    } catch (error) {
      console.error('Permission request error:', error);
    }
  };

  const loadInitialData = async () => {
    // Load community alerts, check-in requests, etc.
    generateSmartSuggestions();
    loadSampleConversations();
  };

  const loadSampleConversations = () => {
    // Sample conversation messages for each contact
    const sampleMessages = {
      '1': [ // Mom
        { id: '1', text: 'Thanks for checking in!', sender: 'contact', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) },
        { id: '2', text: 'How are you feeling today?', sender: 'user', timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000) },
        { id: '3', text: 'I\'m doing well, thanks for asking!', sender: 'contact', timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000) },
      ],
      '2': [ // Sarah
        { id: '4', text: 'All good, thanks!', sender: 'contact', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) },
        { id: '5', text: 'Great to hear! Stay safe out there', sender: 'user', timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000) },
      ],
      '3': [ // Emergency Services
        { id: '6', text: 'Safe and sound', sender: 'contact', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) },
        { id: '7', text: 'Emergency protocol activated', sender: 'system', timestamp: new Date(Date.now() - 14 * 60 * 60 * 1000) },
      ],
    };
    
    // Store sample messages (in real app, this would come from backend)
    setConversationMessages(sampleMessages['1']); // Default to Mom's messages
  };

  const openConversation = (contact: EmergencyContact) => {
    setSelectedContact(contact);
    
    // Load messages for this contact
    const sampleMessages = {
      '1': [ // Mom
        { id: '1', text: 'Thanks for checking in!', sender: 'contact', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) },
        { id: '2', text: 'How are you feeling today?', sender: 'user', timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000) },
        { id: '3', text: 'I\'m doing well, thanks for asking!', sender: 'contact', timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000) },
      ],
      '2': [ // Sarah
        { id: '4', text: 'All good, thanks!', sender: 'contact', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) },
        { id: '5', text: 'Great to hear! Stay safe out there', sender: 'user', timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000) },
      ],
      '3': [ // Emergency Services
        { id: '6', text: 'Safe and sound', sender: 'contact', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) },
        { id: '7', text: 'Emergency protocol activated', sender: 'system', timestamp: new Date(Date.now() - 14 * 60 * 60 * 1000) },
      ],
    };
    
    setConversationMessages(sampleMessages[contact.id as keyof typeof sampleMessages] || []);
    setShowConversationModal(true);
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedContact) return;
    
    const message = {
      id: Date.now().toString(),
      text: newMessage.trim(),
      sender: 'user',
      timestamp: new Date(),
    };
    
    setConversationMessages(prev => [...prev, message]);
    setNewMessage('');
  };

  const generateSmartSuggestions = () => {
    const suggestions = [
      'Add your roommate to emergency contacts',
      'Set up check-in reminders for late night walks',
      'Share your location with family during travel',
      'Update your safety circle priorities',
      'Connect with nearby safety advocates',
      'Join community safety groups'
    ];
    setSmartSuggestions(suggestions);
  };

  // Search & Connection Functions
  const searchUsers = () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const filtered = sampleUsers.filter(user => {
      const matchesName = user.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesLocation = searchFilters.location ? 
        user.location.toLowerCase().includes(searchFilters.location.toLowerCase()) : true;
      const matchesAge = user.age >= searchFilters.ageRange.min && user.age <= searchFilters.ageRange.max;
      const matchesCircle = searchFilters.safetyCircle === 'all' || user.safetyCircle === searchFilters.safetyCircle;
      const matchesOnline = searchFilters.onlineOnly ? user.isOnline : true;
      const matchesInterests = searchFilters.interests.length === 0 || 
        searchFilters.interests.some(interest => user.interests.includes(interest));

      return matchesName && matchesLocation && matchesAge && matchesCircle && matchesOnline && matchesInterests;
    });

    setSearchResults(filtered);
  };

  const sendFriendRequest = (userId: string, message?: string) => {
    const request: FriendRequest = {
      id: Date.now().toString(),
      fromUserId: 'user1',
      toUserId: userId,
      status: 'pending',
      timestamp: new Date(),
      message
    };

    setFriendRequests(prev => [...prev, request]);
    Alert.alert('Friend Request Sent', 'Your connection request has been sent!');
  };

  const respondToFriendRequest = (requestId: string, status: 'accepted' | 'declined') => {
    setFriendRequests(prev =>
      prev.map(req =>
        req.id === requestId ? { ...req, status } : req
      )
    );

    if (status === 'accepted') {
      Alert.alert('Connection Accepted', 'You are now connected!');
    } else {
      Alert.alert('Request Declined', 'Friend request declined');
    }
  };

  const blockUser = (userId: string) => {
    Alert.alert(
      'Block User',
      'Are you sure you want to block this user? They won\'t be able to contact you.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: () => {
            // Remove from search results
            setSearchResults(prev => prev.filter(user => user.id !== userId));
            Alert.alert('User Blocked', 'This user has been blocked');
          },
        },
      ]
    );
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  // Trusted Network Check-in Functions
  const sendCheckInRequest = async () => {
    if (selectedCheckInContacts.length === 0) {
      Alert.alert('Error', 'Please select at least one contact');
      return;
    }

    const checkInRequest: CheckInRequest = {
      id: Date.now().toString(),
      fromUserId: 'user1',
      toUserId: selectedCheckInContacts[0], // For now, send to first selected
      message: checkInMessage || 'Just checking in - please respond when you see this!',
      timestamp: new Date(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
      status: 'pending'
    };

    setCheckInRequests(prev => [...prev, checkInRequest]);
    setShowCheckInModal(false);
    setCheckInMessage('');
    setSelectedCheckInContacts([]);

    Alert.alert('Check-in Sent', `Check-in request sent to ${selectedCheckInContacts.length} contact(s)`);
  };

  const respondToCheckIn = (requestId: string) => {
    setCheckInRequests(prev =>
      prev.map(req =>
        req.id === requestId ? { ...req, status: 'responded' as const } : req
      )
    );
    Alert.alert('Response Sent', 'Your response has been sent!');
  };

  // Safety Circles Functions
  const getContactsByCircle = (circle: string) => {
    if (circle === 'all') return emergencyContacts;
    return emergencyContacts.filter(contact => contact.safetyCircle === circle);
  };

  const updateContactCircle = (contactId: string, newCircle: string) => {
    setEmergencyContacts(prev =>
      prev.map(contact =>
        contact.id === contactId
          ? { ...contact, safetyCircle: newCircle as any }
          : contact
      )
    );
  };

  // Ghost Mode Functions
  const startGhostMode = async () => {
    if (selectedGhostContacts.length === 0) {
      Alert.alert('Error', 'Please select contacts for ghost mode');
      return;
    }

    const session: GhostModeSession = {
      id: Date.now().toString(),
      contacts: selectedGhostContacts,
      duration: ghostModeDuration,
      startTime: new Date(),
      endTime: new Date(Date.now() + ghostModeDuration * 60 * 1000),
      isActive: true
    };

    setGhostModeSession(session);
    setShowGhostModeModal(false);

    // Set timer to end ghost mode
    setTimeout(() => {
      setGhostModeSession(null);
      Alert.alert('Ghost Mode Ended', 'Location sharing has automatically stopped');
    }, ghostModeDuration * 60 * 1000);

    Alert.alert('Ghost Mode Active', `Location sharing for ${ghostModeDuration} minutes`);
  };

  // Health Status Share Functions
  const shareHealthStatus = async () => {
    const healthShare: HealthStatusShare = {
      id: Date.now().toString(),
      userId: 'user1',
      mood: currentMood,
      periodStatus: currentPeriodStatus,
      symptoms: selectedSymptoms,
      timestamp: new Date(),
      sharedWith: emergencyContacts.filter(c => c.safetyCircle === 'friends').map(c => c.id)
    };

    setShowHealthShareModal(false);
    Alert.alert('Status Shared', 'Your health status has been shared with friends');
  };

  // Community Feed Functions
  const postCommunityAlert = async (type: string, description: string) => {
    if (!currentLocation) {
      Alert.alert('Error', 'Location not available');
      return;
    }

    const alert: CommunityAlert = {
      id: Date.now().toString(),
      userId: 'user1',
      type: type as any,
      location: {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude
      },
      description,
      timestamp: new Date(),
      isAnonymous: true
    };

    setCommunityAlerts(prev => [...prev, alert]);
    setShowCommunityModal(false);
    Alert.alert('Alert Posted', 'Your safety alert has been posted anonymously');
  };

  // Help Request Functions
  const sendHelpRequest = async () => {
    const activeContacts = emergencyContacts.filter(c => c.isActive && c.safetyCircle !== 'emergency');
    
    Alert.alert(
      'Help Request Sent',
      `"Check on me" message sent to ${activeContacts.length} contacts`
    );
    setShowHelpRequestModal(false);
    setHelpRequestMessage('');
  };

  // Emergency Chain Reaction
  const triggerEmergencyChain = async () => {
    const prioritizedContacts = emergencyContacts
      .filter(c => c.isActive)
      .sort((a, b) => a.priority - b.priority);

    Alert.alert(
      'Emergency Chain Activated',
      `Emergency alerts will be sent to contacts in priority order:\n${prioritizedContacts.map(c => `${c.priority}. ${c.name}`).join('\n')}`
    );
  };

  // Voice Safe Word (placeholder for future AI integration)
  const setupVoiceSafeWord = () => {
    Alert.alert('Voice Safe Word', 'This feature will use AI speech detection to recognize your safe word and trigger emergency contacts automatically.');
  };

  // Last Seen Status
  const updateLastSeen = (contactId: string) => {
    setEmergencyContacts(prev =>
      prev.map(contact =>
        contact.id === contactId
          ? { ...contact, lastSeen: new Date() }
          : contact
      )
    );
  };

  // Add New Contact Function
  const addNewContact = () => {
    if (!newContactName.trim() || !newContactPhone.trim()) {
      Alert.alert('Error', 'Please fill in both name and phone number');
      return;
    }

    const newContact: EmergencyContact = {
      id: Date.now().toString(),
      name: newContactName.trim(),
      phone: newContactPhone.trim(),
      relationship: newContactCircle.charAt(0).toUpperCase() + newContactCircle.slice(1),
      isActive: true,
      safetyCircle: newContactCircle,
      priority: emergencyContacts.length + 1,
      responseTime: 15 // Default response time
    };

    setEmergencyContacts(prev => [...prev, newContact]);
    
    // Reset form
    setNewContactName('');
    setNewContactPhone('');
    setNewContactCircle('friends');
    setShowAddContactModal(false);
    
    Alert.alert('Success', 'New contact added successfully!');
  };

  // Render Functions
  const renderSafetyCircleSelector = () => (
    <View style={styles.circleSelector}>
      {['all', 'family', 'friends', 'colleagues', 'emergency'].map((circle) => (
        <TouchableOpacity
          key={circle}
          style={[
            styles.circleButton,
            activeSafetyCircle === circle && styles.circleButtonActive
          ]}
          onPress={() => setActiveSafetyCircle(circle as any)}
        >
          <Text style={[
            styles.circleButtonText,
            activeSafetyCircle === circle && styles.circleButtonTextActive
          ]}>
            {circle.charAt(0).toUpperCase() + circle.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderContactItem = (contact: EmergencyContact) => (
    <View key={contact.id} style={styles.contactItem}>
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{contact.name}</Text>
        <Text style={styles.contactPhone}>{contact.phone}</Text>
        <Text style={styles.contactRelationship}>{contact.relationship}</Text>
        {contact.lastSeen && (
          <Text style={styles.lastSeenText}>
            Last seen: {contact.lastSeen.toLocaleTimeString()}
          </Text>
        )}
      </View>
      <View style={styles.contactActions}>
        <Switch
          value={contact.isActive}
          onValueChange={() => {
            const updatedContacts = emergencyContacts.map(c =>
              c.id === contact.id ? { ...c, isActive: !c.isActive } : c
            );
            setEmergencyContacts(updatedContacts);
          }}
          trackColor={{ false: '#767577', true: '#e91e63' }}
          thumbColor={contact.isActive ? '#f5dd4b' : '#f4f3f4'}
        />
        <TouchableOpacity 
          style={styles.removeButton}
          onPress={() => {
            Alert.alert(
              'Remove Contact',
              'Are you sure you want to remove this contact?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Remove',
                  style: 'destructive',
                  onPress: () => {
                    setEmergencyContacts(prev => prev.filter(c => c.id !== contact.id));
                  },
                },
              ]
            );
          }}
        >
          <Text style={styles.removeButtonText}>Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#2094fc" translucent={true} hidden={false} />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerBell}>🔔</Text>
            <TouchableOpacity style={styles.backButton}>
              <Text style={styles.backArrow}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>SafeHer</Text>
            <Text style={styles.headerChevron}>⌄</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.sparkleButton}>
              <Text style={styles.sparkleIcon}>✨</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.editButton}>
              <Text style={styles.editIcon}>✏️</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <View style={styles.aiIcon}>
            <View style={styles.aiGradient} />
          </View>
          <Text style={styles.searchPlaceholder}>Ask SafeHer AI or search</Text>
        </View>
      </View>

      {/* Stories/Notes Section */}
      <View style={styles.storiesSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.storiesScroll}>
          {/* Your Story */}
          <TouchableOpacity style={styles.storyItem}>
            <View style={styles.storyAvatar}>
              <Text style={styles.storyAvatarText}>👤</Text>
            </View>
            <Text style={styles.storyLabel}>Your Vibe+</Text>
          </TouchableOpacity>

          {/* Other Stories */}
          {emergencyContacts.slice(0, 5).map((contact, index) => (
            <TouchableOpacity key={contact.id} style={styles.storyItem}>
              <View style={styles.storyAvatar}>
                <Text style={styles.storyAvatarText}>
                  {contact.safetyCircle === 'family' ? '👨‍👩‍👧‍👦' :
                   contact.safetyCircle === 'friends' ? '👥' :
                   contact.safetyCircle === 'colleagues' ? '💼' : '🚨'}
                </Text>
              </View>
              <Text style={styles.storyLabel}>{contact.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Messages Section */}
      <View style={styles.messagesSection}>
        <View style={styles.messagesHeader}>
          <Text style={styles.messagesTitle}>Messages</Text>
          <TouchableOpacity>
            <Text style={styles.requestsText}>Requests</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.messagesList} showsVerticalScrollIndicator={false}>
          {emergencyContacts.map((contact, index) => (
            <TouchableOpacity 
              key={contact.id} 
              style={styles.messageItem}
              onPress={() => openConversation(contact)}
            >
              <View style={styles.messageAvatar}>
                <Text style={styles.messageAvatarText}>
                  {contact.safetyCircle === 'family' ? '👨‍👩‍👧‍👦' :
                   contact.safetyCircle === 'friends' ? '👥' :
                   contact.safetyCircle === 'colleagues' ? '💼' : '🚨'}
                </Text>
                {contact.isActive && <View style={styles.onlineDot} />}
              </View>
              
              <View style={styles.messageContent}>
                <View style={styles.messageHeader}>
                  <Text style={styles.messageName}>{contact.name}</Text>
                  <Text style={styles.messageTime}>
                    {contact.lastSeen ? getTimeAgo(contact.lastSeen) : '2h'}
                  </Text>
                </View>
                
                <View style={styles.messagePreview}>
                  <Text style={styles.messageText}>
                    {index === 0 ? 'Thanks for checking in!' :
                     index === 1 ? 'All good, thanks!' :
                     index === 2 ? 'Safe and sound' : 'Status update'}
                  </Text>
                  {index < 2 && <View style={styles.unreadDot} />}
                </View>
              </View>
              
              <TouchableOpacity style={styles.cameraButton}>
                <Text style={styles.cameraIcon}>📷</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}

          {/* Sample Messages */}
          <TouchableOpacity style={styles.messageItem}>
            <View style={styles.messageAvatar}>
              <Text style={styles.messageAvatarText}>🐱</Text>
            </View>
            <View style={styles.messageContent}>
              <View style={styles.messageHeader}>
                <Text style={styles.messageName}>Emergency Alert</Text>
                <Text style={styles.messageTime}>14h</Text>
              </View>
              <View style={styles.messagePreview}>
                <Text style={styles.messageText}>Emergency protocol activated</Text>
                <View style={styles.unreadDot} />
              </View>
            </View>
            <TouchableOpacity style={styles.cameraButton}>
              <Text style={styles.cameraIcon}>📷</Text>
            </TouchableOpacity>
          </TouchableOpacity>

          <TouchableOpacity style={styles.messageItem}>
            <View style={styles.messageAvatar}>
              <Text style={styles.messageAvatarText}>🛡️</Text>
            </View>
            <View style={styles.messageContent}>
              <View style={styles.messageHeader}>
                <Text style={styles.messageName}>Safety Check</Text>
                <Text style={styles.messageTime}>20h</Text>
              </View>
              <View style={styles.messagePreview}>
                <Text style={styles.messageText}>Safety check completed</Text>
                <View style={styles.unreadDot} />
              </View>
            </View>
            <TouchableOpacity style={styles.cameraButton}>
              <Text style={styles.cameraIcon}>📷</Text>
            </TouchableOpacity>
          </TouchableOpacity>

          <TouchableOpacity style={styles.messageItem}>
            <View style={styles.messageAvatar}>
              <Text style={styles.messageAvatarText}>💬</Text>
            </View>
            <View style={styles.messageContent}>
              <View style={styles.messageHeader}>
                <Text style={styles.messageName}>Support Team</Text>
                <Text style={styles.messageTime}>1d</Text>
              </View>
              <View style={styles.messagePreview}>
                <Text style={styles.messageText}>How are you feeling today?</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.cameraButton}>
              <Text style={styles.cameraIcon}>📷</Text>
            </TouchableOpacity>
          </TouchableOpacity>

          <TouchableOpacity style={styles.messageItem}>
            <View style={styles.messageAvatar}>
              <Text style={styles.messageAvatarText}>🏥</Text>
            </View>
            <View style={styles.messageContent}>
              <View style={styles.messageHeader}>
                <Text style={styles.messageName}>Health Update</Text>
                <Text style={styles.messageTime}>1d</Text>
              </View>
              <View style={styles.messagePreview}>
                <Text style={styles.messageText}>Health status shared</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.cameraButton}>
              <Text style={styles.cameraIcon}>📷</Text>
            </TouchableOpacity>
          </TouchableOpacity>

          <TouchableOpacity style={styles.messageItem}>
            <View style={styles.messageAvatar}>
              <Text style={styles.messageAvatarText}>📍</Text>
            </View>
            <View style={styles.messageContent}>
              <View style={styles.messageHeader}>
                <Text style={styles.messageName}>Location Share</Text>
                <Text style={styles.messageTime}>Seen on Friday</Text>
              </View>
              <View style={styles.messagePreview}>
                <Text style={styles.messageText}>Location shared successfully</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.cameraButton}>
              <Text style={styles.cameraIcon}>📷</Text>
            </TouchableOpacity>
          </TouchableOpacity>

          <TouchableOpacity style={styles.messageItem}>
            <View style={styles.messageAvatar}>
              <Text style={styles.messageAvatarText}>👤</Text>
            </View>
            <View style={styles.messageContent}>
              <View style={styles.messageHeader}>
                <Text style={styles.messageName}>Community</Text>
                <Text style={styles.messageTime}>Seen on Friday</Text>
              </View>
              <View style={styles.messagePreview}>
                <Text style={styles.messageText}>Community safety alert</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.cameraButton}>
              <Text style={styles.cameraIcon}>📷</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Conversation Modal */}
      <Modal visible={showConversationModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.conversationContainer}>
          <StatusBar barStyle="dark-content" backgroundColor="#2094fc" translucent={true} hidden={false} />
          
          {/* Conversation Header */}
          <View style={styles.conversationHeader}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => setShowConversationModal(false)}
            >
              <Text style={styles.backArrow}>‹</Text>
            </TouchableOpacity>
            
            <View style={styles.contactInfo}>
              <View style={styles.contactAvatar}>
                <Text style={styles.contactAvatarText}>
                  {selectedContact?.safetyCircle === 'family' ? '👨‍👩‍👧‍👦' :
                   selectedContact?.safetyCircle === 'friends' ? '👥' :
                   selectedContact?.safetyCircle === 'colleagues' ? '💼' : '🚨'}
                </Text>
                {selectedContact?.isActive && <View style={styles.contactOnlineDot} />}
              </View>
              <View style={styles.contactDetails}>
                <Text style={styles.contactName}>{selectedContact?.name}</Text>
                <Text style={styles.contactStatus}>
                  {selectedContact?.isActive ? 'Online' : 'Offline'}
                </Text>
              </View>
            </View>
            
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.headerActionButton}>
                <Text style={styles.headerActionIcon}>📞</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerActionButton}>
                <Text style={styles.headerActionIcon}>📹</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Messages */}
          <ScrollView style={styles.messagesContainer} showsVerticalScrollIndicator={false}>
            {conversationMessages.map((message) => (
              <View key={message.id} style={[
                styles.messageBubble,
                message.sender === 'user' ? styles.userMessage : styles.contactMessage
              ]}>
                <Text style={[
                  styles.messageBubbleText,
                  message.sender === 'user' ? styles.userMessageText : styles.contactMessageText
                ]}>
                  {message.text}
                </Text>
                <Text style={styles.messageTimestamp}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            ))}
          </ScrollView>

          {/* Message Input */}
          <View style={styles.messageInputContainer}>
            <TouchableOpacity style={styles.inputActionButton}>
              <Text style={styles.inputActionIcon}>📷</Text>
            </TouchableOpacity>
            
            <View style={styles.messageInputWrapper}>
              <TextInput
                style={styles.messageInput}
                value={newMessage}
                onChangeText={setNewMessage}
                placeholder="Message..."
                placeholderTextColor="#999"
                multiline
              />
            </View>
            
            <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
              <Text style={styles.sendButtonIcon}>📤</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fef7f7',
  },
  // Header Styles
  header: {
    backgroundColor: '#2094fc',
    paddingTop: Platform.OS === 'ios' ? 44 : 0,
    paddingBottom: 10,
    paddingHorizontal: 0,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTime: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginRight: 8,
  },
  headerBell: {
    fontSize: 16,
    marginRight: 12,
    color: '#FFD700',
  },
  backButton: {
    marginRight: 12,
  },
  backArrow: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginRight: 4,
  },
  headerChevron: {
    fontSize: 16,
    color: 'white',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerSignal: {
    fontSize: 14,
    marginRight: 4,
  },
  headerWifi: {
    fontSize: 14,
    marginRight: 4,
  },
  headerBattery: {
    fontSize: 14,
    marginRight: 8,
  },
  sparkleButton: {
    marginRight: 8,
  },
  sparkleIcon: {
    fontSize: 18,
  },
  editButton: {
    padding: 4,
  },
  editIcon: {
    fontSize: 16,
  },
  
  // Search Section
  searchSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  aiIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 12,
    overflow: 'hidden',
  },
  aiGradient: {
    flex: 1,
    backgroundColor: '#e91e63', // SafeHer pink
  },
  searchPlaceholder: {
    fontSize: 16,
    color: '#666',
    flex: 1,
  },
  
  // Stories Section
  storiesSection: {
    paddingVertical: 16,
  },
  storiesScroll: {
    paddingHorizontal: 20,
  },
  storyItem: {
    alignItems: 'center',
    marginRight: 20,
    width: 70,
  },
  storyBubble: {
    backgroundColor: '#e91e63',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  storyBubbleText: {
    fontSize: 12,
    color: 'white',
    textAlign: 'center',
  },
  storyAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 3,
    borderColor: '#e91e63',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  storyAvatarText: {
    fontSize: 24,
    color: '#666',
  },
  storyLabel: {
    fontSize: 11,
    color: '#333',
    textAlign: 'center',
    fontWeight: '400',
    marginTop: 2,
  },
  
  // Messages Section
  messagesSection: {
    flex: 1,
    backgroundColor: '#fef7f7',
  },
  messagesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  messagesTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  requestsText: {
    fontSize: 16,
    color: '#e91e63',
    fontWeight: '600',
  },
  messagesList: {
    flex: 1,
  },
  messageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: 'white',
  },
  messageAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1E90FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  messageAvatarText: {
    fontSize: 20,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: 'white',
  },
  messageContent: {
    flex: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  messageName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  messageTime: {
    fontSize: 12,
    color: '#666',
  },
  messagePreview: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  messageText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e91e63',
    marginLeft: 8,
  },
  cameraButton: {
    padding: 8,
  },
  cameraIcon: {
    fontSize: 20,
  },
  
  // Conversation Modal Styles
  conversationContainer: {
    flex: 1,
    backgroundColor: '#fef7f7',
  },
  conversationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2094fc',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 16,
  },
  contactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  contactAvatarText: {
    fontSize: 16,
  },
  contactOnlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#1E90FF',
  },
  contactDetails: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  contactStatus: {
    fontSize: 12,
    color: 'white',
    opacity: 0.8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerActionButton: {
    padding: 8,
    marginLeft: 8,
  },
  headerActionIcon: {
    fontSize: 20,
    color: 'white',
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginVertical: 4,
  },
  userMessage: {
    backgroundColor: '#e91e63',
    alignSelf: 'flex-end',
    marginLeft: '20%',
  },
  contactMessage: {
    backgroundColor: '#E0E0E0',
    alignSelf: 'flex-start',
    marginRight: '20%',
  },
  messageBubbleText: {
    fontSize: 16,
    lineHeight: 20,
  },
  userMessageText: {
    color: 'white',
  },
  contactMessageText: {
    color: '#333',
  },
  messageTimestamp: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'right',
  },
  messageInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  inputActionButton: {
    padding: 8,
    marginRight: 8,
  },
  inputActionIcon: {
    fontSize: 20,
    color: '#666',
  },
  messageInputWrapper: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
  },
  messageInput: {
    fontSize: 16,
    color: '#333',
    minHeight: 20,
  },
  sendButton: {
    padding: 8,
    marginLeft: 8,
  },
  sendButtonIcon: {
    fontSize: 20,
    color: '#e91e63',
  },
});

