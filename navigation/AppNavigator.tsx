import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View, Text, TouchableOpacity } from 'react-native';

import { useAuth } from '../contexts/AuthContext';
import { checkUserOnboardingStatus, saveUserProfile } from '../services/supabase';

// Import screens
import { SignInScreen, SignUpScreen } from '../screens/AuthScreens';
import { OnboardingStep1, OnboardingStep2, OnboardingStep3 } from '../screens/OnboardingScreens';
import HomeScreen from '../screens/HomeScreen';
import MyStatusScreen from '../screens/MyStatus';
import ChatScreen from '../screens/ChatScreen';
import ConnectionsScreen from '../screens/ConnectionsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Simple icon component using emojis
const TabIcon = ({ name, focused }: { name: string; focused: boolean }) => {
  const getIcon = () => {
    switch (name) {
      case 'Home': return '🏠';
      case 'My Status': return '📊';
      case 'Assistant': return '🤖';
      case 'Connections': return '👥';
      case 'Profile': return '👤';
      default: return '❓';
    }
  };

  return (
    <Text style={{ fontSize: focused ? 24 : 20, opacity: focused ? 1 : 0.6 }}>
      {getIcon()}
    </Text>
  );
};

// Profile Stack Navigator (includes Settings)
const ProfileStackNavigator = () => {
  return (
    <Stack.Navigator 
      screenOptions={({ navigation }) => ({
        headerShown: true,
        headerStyle: {
          backgroundColor: '#1E90FF',
        },
        headerTintColor: 'white',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ marginLeft: 10 }}
          >
            <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>←</Text>
          </TouchableOpacity>
        ),
      })}
    >
      <Stack.Screen 
        name="ProfileMain" 
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
    </Stack.Navigator>
  );
};

// Main Tab Navigator (for authenticated users)
const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => (
          <TabIcon name={route.name} focused={focused} />
        ),
        tabBarActiveTintColor: '#1E90FF',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          height: 80,
          paddingBottom: 15,
          paddingTop: 10,
          paddingHorizontal: 5,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 2,
          textAlign: 'center',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="My Status" component={MyStatusScreen} />
      <Tab.Screen name="Assistant" component={ChatScreen} />
      <Tab.Screen name="Connections" component={ConnectionsScreen} />
      <Tab.Screen name="Profile" component={ProfileStackNavigator} />
    </Tab.Navigator>
  );
};

// Auth Stack Navigator
const AuthStack = () => {
  const [isSignUp, setIsSignUp] = useState(false);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isSignUp ? (
        <Stack.Screen name="SignUp">
          {() => <SignUpScreen onNavigateToSignIn={() => setIsSignUp(false)} />}
        </Stack.Screen>
      ) : (
        <Stack.Screen name="SignIn">
          {() => <SignInScreen onNavigateToSignUp={() => setIsSignUp(true)} />}
        </Stack.Screen>
      )}
    </Stack.Navigator>
  );
};

// Onboarding Stack Navigator
const OnboardingStack = ({ onOnboardingComplete }: { onOnboardingComplete: () => void }) => {
  const [step, setStep] = useState(1);
  const [onboardingData, setOnboardingData] = useState<any>({});
  const { user } = useAuth();

  const handleStep1Next = (data: { name: string; age: string; height: string }) => {
    setOnboardingData({ ...onboardingData, ...data });
    setStep(2);
  };

  const handleStep2Next = (data: { goal: string; dietType: string }) => {
    setOnboardingData({ ...onboardingData, ...data });
    setStep(3);
  };

  const handleStep3Finish = async (contacts: Array<{ name: string; phone: string }>) => {
    try {
      const finalData = { ...onboardingData, contacts };
      console.log('Saving user profile with data:', finalData);
      
      const result = await saveUserProfile(
        user!.id,
        finalData.name,
        parseInt(finalData.age),
        parseInt(finalData.height),
        finalData.goal,
        finalData.dietType,
        contacts
      );
      
      console.log('Profile save result:', result);
      
      // Onboarding complete - update state to redirect to main app
      console.log('Onboarding completed, calling onOnboardingComplete');
      onOnboardingComplete();
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {step === 1 && (
        <Stack.Screen name="OnboardingStep1">
          {() => <OnboardingStep1 onNext={handleStep1Next} />}
        </Stack.Screen>
      )}
      {step === 2 && (
        <Stack.Screen name="OnboardingStep2">
          {() => <OnboardingStep2 onNext={handleStep2Next} onBack={handleBack} />}
        </Stack.Screen>
      )}
      {step === 3 && (
        <Stack.Screen name="OnboardingStep3">
          {() => <OnboardingStep3 onFinish={handleStep3Finish} onBack={handleBack} />}
        </Stack.Screen>
      )}
    </Stack.Navigator>
  );
};

// Main App Navigator
const AppNavigator = () => {
  const { user, loading } = useAuth();
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean | null>(null);
  const [checkingOnboarding, setCheckingOnboarding] = useState(false);

  console.log('AppNavigator: Render state:', { user: !!user, loading, needsOnboarding, checkingOnboarding });

  useEffect(() => {
    const checkOnboarding = async () => {
      if (user && !checkingOnboarding) {
        setCheckingOnboarding(true);
        console.log('Checking onboarding status for user:', user.id);
        const { needsOnboarding: needs, error } = await checkUserOnboardingStatus(user.id);
        console.log('Onboarding check result:', { needs, error });
        setNeedsOnboarding(needs);
        setCheckingOnboarding(false);
      } else if (!user) {
        setNeedsOnboarding(null);
        setCheckingOnboarding(false);
      }
    };

    checkOnboarding();
  }, [user]); // Removed checkingOnboarding from dependencies to prevent infinite loop

  if (loading || checkingOnboarding) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' }}>
        <ActivityIndicator size="large" color="#1E90FF" />
        <Text style={{ marginTop: 20, fontSize: 16, color: '#666' }}>
          {loading ? 'Loading...' : 'Checking onboarding...'}
        </Text>
        <Text style={{ marginTop: 10, fontSize: 12, color: '#999' }}>
          User: {user ? 'Yes' : 'No'} | Loading: {loading ? 'Yes' : 'No'}
        </Text>
      </View>
    );
  }

  console.log('Navigation state:', { user: !!user, needsOnboarding, loading, checkingOnboarding });

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          // User not authenticated
          <Stack.Screen name="Auth" component={AuthStack} />
        ) : needsOnboarding ? (
          // User authenticated but needs onboarding
          <Stack.Screen name="Onboarding">
            {() => <OnboardingStack onOnboardingComplete={() => setNeedsOnboarding(false)} />}
          </Stack.Screen>
        ) : (
          // User authenticated and onboarded
          <Stack.Screen name="Main" component={MainTabNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
