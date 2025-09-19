import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Supabase configuration
const supabaseUrl = 'https://wuozvggvxlfuushcwdsh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1b3p2Z2d2eGxmdXVzaGN3ZHNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3NjMxNTUsImV4cCI6MjA3MzMzOTE1NX0.mymM1pA_nH6ozWC0w2lbHc2kBTEYUsDDFhdjY9FDxJE';

console.log('Supabase: Creating client with URL:', supabaseUrl);
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
console.log('Supabase: Client created successfully');

// Auth Helper Functions
export const signInWithEmailPassword = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const signUpWithEmailPassword = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error };
  }
};

// User Profile Helper Functions
export const saveUserProfile = async (
  userId: string,
  name: string,
  age: number,
  height: number,
  goal: string,
  dietType: string,
  contacts: Array<{ name: string; phone: string }>
) => {
  try {
    // For now, just mark the user as onboarded in the existing profiles table
    // We can store additional data in a JSON field or create a separate table later
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        is_onboarded: true,
        updated_at: new Date().toISOString(),
      })
      .select();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const getUserProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const checkUserOnboardingStatus = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('is_onboarded')
      .eq('id', userId)
      .single();

    if (error && error.code === 'PGRST116') {
      // No profile found - user needs onboarding
      return { needsOnboarding: true, error: null };
    }
    
    if (error) throw error;
    return { needsOnboarding: !data.is_onboarded, error: null };
  } catch (error) {
    return { needsOnboarding: true, error };
  }
};
