import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  StatusBar,
  SafeAreaView,
} from 'react-native';
// Import Gemini service for AI-powered responses
import { geminiService } from '../services/GeminiService';

export default function ChatScreen() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm your safety assistant. How can I help you today?",
      isBot: true,
      timestamp: new Date(),
    },
  ]);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Loading state for Gemini API calls
  const scrollViewRef = useRef<ScrollView>(null);
  const textInputRef = useRef<TextInput>(null);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setIsKeyboardVisible(true);
      // Scroll to bottom when keyboard appears
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });
    
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const sendMessage = async () => {
    if (message.trim() === '' || isLoading) return; // Prevent sending while loading

    const userMessage = {
      id: Date.now(),
      text: message,
      isBot: false,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentMessage = message; // Store message before clearing
    setMessage('');

    // Scroll to bottom after adding message
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    // Set loading state for Gemini API call
    setIsLoading(true);

    try {
      // Call Gemini API service for AI-powered response
      console.log('ChatScreen: Calling Gemini API for response');
      const geminiResponse = await geminiService.sendMessage(currentMessage);
      
      let botResponseText: string;
      
      if (geminiResponse.success && geminiResponse.message) {
        // Use Gemini response if successful
        botResponseText = geminiResponse.message;
        console.log('ChatScreen: Received Gemini response');
      } else {
        // Fallback to original bot response if Gemini fails
        botResponseText = getBotResponse(currentMessage);
        console.log('ChatScreen: Using fallback response');
      }
      
      // Add bot response to messages
      const botResponse = {
        id: Date.now() + 1,
        text: botResponseText,
        isBot: true,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, botResponse]);
      
      // Scroll to bottom after bot response
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
      
    } catch (error) {
      // Handle any errors in Gemini integration
      console.error('ChatScreen: Error in Gemini integration:', error);
      
      // Use fallback response on error
      const fallbackResponse = {
        id: Date.now() + 1,
        text: getBotResponse(currentMessage),
        isBot: true,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, fallbackResponse]);
      
      // Scroll to bottom after fallback response
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
      
    } finally {
      // Always clear loading state
      setIsLoading(false);
    }
  };

  const handleInputFocus = () => {
    // Focus the input and scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 300);
  };

  const getBotResponse = (userMessage: string) => {
    const msg = userMessage.toLowerCase();
    
    if (msg.includes('emergency') || msg.includes('help') || msg.includes('danger')) {
      return "I understand you're in distress. Please use the SOS button immediately to alert your emergency contacts. You can also call:\n• Police: 100\n• Ambulance: 108\n• Women Helpline: 1091\n• Domestic Violence: 181\nYour safety is the top priority.";
    } else if (msg.includes('location') || msg.includes('where')) {
      return "I can help you share your location with trusted contacts. Use the Live Tracking feature to keep your loved ones informed of your whereabouts.";
    } else if (msg.includes('timer') || msg.includes('check')) {
      return "The Check-In Timer is perfect for situations where you want to ensure someone knows you're safe. Set it before going somewhere and check in when you arrive.";
    } else if (msg.includes('safety') || msg.includes('tips')) {
      return "Here are some safety tips: Always share your location with trusted contacts, avoid walking alone at night, trust your instincts, and keep emergency contacts updated.";
    } else if (msg.includes('helpline') || msg.includes('number')) {
      return "Indian Emergency Helplines:\n• Women Helpline: 1091\n• Domestic Violence: 181\n• Police: 100\n• Ambulance: 108\n• National Emergency: 112\n• Child Helpline: 1098\n• Mental Health: +91 9152987821\n• National Women's Helpline: 7827-170-170";
    } else {
      return "I'm here to help with your safety needs. You can ask me about emergency procedures, location sharing, safety tips, helplines, or how to use the app features.";
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#2094fc" translucent={true} hidden={false} />
      <KeyboardAvoidingView 
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Safety Assistant</Text>
          <Text style={styles.subtitle}>Powered by Gemini AI</Text>
        </View>

      <ScrollView 
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((msg) => (
          <View
            key={msg.id}
            style={[
              styles.messageContainer,
              msg.isBot ? styles.botMessage : styles.userMessage,
            ]}
          >
            <Text style={[
              styles.messageText,
              msg.isBot ? styles.botText : styles.userText,
            ]}>
              {msg.text}
            </Text>
            <Text style={styles.timestamp}>
              {msg.timestamp.toLocaleTimeString()}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          ref={textInputRef}
          style={styles.textInput}
          value={message}
          onChangeText={setMessage}
          placeholder="Ask me about safety..."
          placeholderTextColor="#999"
          multiline
          onFocus={handleInputFocus}
          returnKeyType="send"
          onSubmitEditing={sendMessage}
          blurOnSubmit={false}
        />
        <TouchableOpacity 
          style={[styles.sendButton, (message.trim() === '' || isLoading) && styles.sendButtonDisabled]} 
          onPress={sendMessage}
          disabled={message.trim() === '' || isLoading}
        >
          <Text style={styles.sendButtonText}>
            {isLoading ? '...' : 'Send'}
          </Text>
        </TouchableOpacity>
      </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardContainer: {
    flex: 1,
  },
  header: {
    backgroundColor: '#2094fc',
    paddingTop: Platform.OS === 'ios' ? 44 : 0,
    paddingBottom: 20,
    paddingHorizontal: 0,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 20,
  },
  subtitle: {
    fontSize: 14,
    color: 'white',
    marginTop: 5,
  },
  messagesContainer: {
    flex: 1,
    padding: 10,
  },
  messagesContent: {
    paddingBottom: 10,
  },
  messageContainer: {
    marginBottom: 15,
    maxWidth: '80%',
  },
  botMessage: {
    alignSelf: 'flex-start',
  },
  userMessage: {
    alignSelf: 'flex-end',
  },
  messageText: {
    padding: 12,
    borderRadius: 15,
    fontSize: 16,
  },
  botText: {
    backgroundColor: '#e0e0e0',
    color: '#333',
  },
  userText: {
    backgroundColor: '#e91e63',
    color: 'white',
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    textAlign: 'right',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: 'white',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingBottom: Platform.OS === 'ios' ? 15 : 10,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginRight: 10,
    maxHeight: 100,
    fontSize: 16,
    backgroundColor: '#f8f8f8',
  },
  sendButton: {
    backgroundColor: '#1E90FF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    minWidth: 60,
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
