/**
 * Test Snippet for Gemini API Integration
 * This demonstrates how the Gemini service works with the chat interface
 */

import { geminiService } from '../services/GeminiService';

// Test function to demonstrate Gemini integration
export const testGeminiIntegration = async () => {
  console.log('=== Testing Gemini API Integration ===');
  
  // Test cases for different types of safety-related queries
  const testMessages = [
    "What should I do if I feel unsafe walking home?",
    "How can I use the SOS feature?",
    "Tell me about emergency helplines in India",
    "What safety tips do you have for women?",
    "How does live tracking work?"
  ];
  
  for (const testMessage of testMessages) {
    console.log(`\n--- Testing: "${testMessage}" ---`);
    
    try {
      // Call Gemini service
      const response = await geminiService.sendMessage(testMessage);
      
      if (response.success) {
        console.log('✅ Gemini Response:', response.message);
      } else {
        console.log('❌ Gemini Error:', response.error);
        console.log('🔄 Using fallback response');
      }
      
    } catch (error) {
      console.error('❌ Integration Error:', error);
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n=== Test Complete ===');
};

// Test function to verify service is working
export const testGeminiServiceStatus = () => {
  console.log('=== Gemini Service Status ===');
  console.log('Service Enabled:', geminiService.isServiceEnabled());
  
  // Test enabling/disabling service
  geminiService.setEnabled(false);
  console.log('Service Disabled:', !geminiService.isServiceEnabled());
  
  geminiService.setEnabled(true);
  console.log('Service Re-enabled:', geminiService.isServiceEnabled());
  
  console.log('=== Status Test Complete ===');
};

// Example usage in a React component
export const ExampleChatIntegration = () => {
  const handleTestMessage = async (userMessage: string) => {
    console.log('User sent:', userMessage);
    
    // This is exactly what happens in the ChatScreen
    const geminiResponse = await geminiService.sendMessage(userMessage);
    
    if (geminiResponse.success && geminiResponse.message) {
      console.log('Bot responds:', geminiResponse.message);
      // Display geminiResponse.message in the chat UI
    } else {
      console.log('Using fallback response');
      // Display fallback response in the chat UI
    }
  };
  
  return null; // This is just for demonstration
};

/**
 * Integration Benefits:
 * 
 * 1. ✅ Isolated Service: Gemini integration is completely isolated in GeminiService.ts
 * 2. ✅ No Breaking Changes: All existing chat functionality remains intact
 * 3. ✅ Fallback Support: If Gemini fails, original bot responses are used
 * 4. ✅ Error Handling: Comprehensive error handling prevents crashes
 * 5. ✅ Loading States: UI shows loading state during API calls
 * 6. ✅ Logging: Debug logging without exposing sensitive data
 * 7. ✅ Async Pattern: Maintains existing async patterns in the app
 * 8. ✅ UI Consistency: Responses appear in same chat interface
 * 9. ✅ Feature Toggle: Can easily enable/disable Gemini service
 * 10. ✅ Security: API key is isolated and can be moved to environment variables
 * 
 * Usage in ChatScreen:
 * - User types message and hits send
 * - Message is sent to Gemini API via GeminiService
 * - If successful, Gemini response is displayed
 * - If failed, fallback response is displayed
 * - Loading state prevents multiple simultaneous requests
 * - All existing UI/UX remains unchanged
 */
