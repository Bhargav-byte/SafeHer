/**
 * Gemini API Service
 * Handles all communication with Google Gemini AI API
 * Isolated service to prevent breaking existing functionality
 */

// Gemini API Configuration
const GEMINI_API_KEY = 'AIzaSyCj_ZZhbqjHpvYxs3zxFfdjJShw85l35wE'; // TODO: Move to environment variables
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

// Interface for Gemini API request/response
interface GeminiRequest {
  contents: Array<{
    parts: Array<{
      text: string;
    }>;
  }>;
}

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
    finishReason: string;
  }>;
}

interface GeminiServiceResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Gemini API Service Class
 * Handles all Gemini API interactions with proper error handling
 */
export class GeminiService {
  private static instance: GeminiService;
  private isEnabled: boolean = true; // Feature flag for easy disable

  // Singleton pattern to ensure single instance
  public static getInstance(): GeminiService {
    if (!GeminiService.instance) {
      GeminiService.instance = new GeminiService();
    }
    return GeminiService.instance;
  }

  /**
   * Send message to Gemini API and get response
   * @param userMessage - The user's message to send to Gemini
   * @returns Promise with Gemini response or fallback message
   */
  public async sendMessage(userMessage: string): Promise<GeminiServiceResponse> {
    // Log the request for debugging (without exposing sensitive data)
    console.log('GeminiService: Processing message request');
    
    // Check if service is enabled
    if (!this.isEnabled) {
      console.log('GeminiService: Service disabled, using fallback');
      return this.getFallbackResponse(userMessage);
    }

    try {
      // Validate input
      if (!userMessage || userMessage.trim().length === 0) {
        console.log('GeminiService: Empty message received');
        return {
          success: false,
          error: 'Message cannot be empty'
        };
      }

      // Try multiple model endpoints
      const modelEndpoints = [
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent',
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent'
      ];

      for (const endpoint of modelEndpoints) {
        try {
          const result = await this.tryGeminiEndpoint(endpoint, userMessage);
          if (result.success) {
            return result;
          }
        } catch (error) {
          console.log(`GeminiService: Failed to use endpoint ${endpoint}:`, error);
          continue;
        }
      }

      // If all endpoints fail, use fallback
      console.log('GeminiService: All endpoints failed, using fallback');
      return this.getFallbackResponse(userMessage);

    } catch (error) {
      // Log error for debugging (without exposing sensitive data)
      console.error('GeminiService: Error occurred:', error instanceof Error ? error.message : 'Unknown error');
      
      // Return fallback response on any error
      return this.getFallbackResponse(userMessage);
    }
  }

  /**
   * Try a specific Gemini endpoint
   * @param endpoint - The API endpoint to try
   * @param userMessage - The user's message
   * @returns Promise with response or error
   */
  private async tryGeminiEndpoint(endpoint: string, userMessage: string): Promise<GeminiServiceResponse> {
    // Prepare Gemini API request
    const requestBody: GeminiRequest = {
      contents: [{
        parts: [{
          text: this.formatMessageForGemini(userMessage)
        }]
      }]
    };

    // Log API call (without sensitive data)
    console.log('GeminiService: Trying endpoint:', endpoint);
    console.log('GeminiService: Request body keys:', Object.keys(requestBody));

    // Make API call to Gemini
    const response = await fetch(`${endpoint}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    // Log response details for debugging
    console.log('GeminiService: Response status:', response.status);

    // Check if API call was successful
    if (!response.ok) {
      const errorText = await response.text();
      console.error('GeminiService: API call failed with status:', response.status);
      console.error('GeminiService: Error response:', errorText);
      throw new Error(`API call failed with status ${response.status}`);
    }

    // Parse Gemini response
    const data: GeminiResponse = await response.json();
    
    // Extract message from Gemini response
    if (data.candidates && data.candidates.length > 0) {
      const geminiMessage = data.candidates[0].content.parts[0].text;
      console.log('GeminiService: Successfully received response from Gemini');
      
      return {
        success: true,
        message: this.formatGeminiResponse(geminiMessage)
      };
    } else {
      console.log('GeminiService: No valid response from Gemini');
      throw new Error('No valid response from Gemini');
    }
  }

  /**
   * Format user message for Gemini API
   * Adds context about being a safety assistant
   * @param userMessage - Original user message
   * @returns Formatted message for Gemini
   */
  private formatMessageForGemini(userMessage: string): string {
    const safetyContext = `You are a helpful safety assistant for a women's safety app. Provide helpful, supportive, and safety-focused responses. Keep responses concise and practical.`;
    return `${safetyContext}\n\nUser question: ${userMessage}`;
  }

  /**
   * Format Gemini response for display
   * Cleans up response and ensures it's appropriate for the app
   * @param geminiResponse - Raw response from Gemini
   * @returns Formatted response for display
   */
  private formatGeminiResponse(geminiResponse: string): string {
    // Remove any unwanted formatting or context
    let formatted = geminiResponse.trim();
    
    // Remove the safety context if it was included in response
    if (formatted.includes('User question:')) {
      formatted = formatted.split('User question:')[0].trim();
    }
    
    // Ensure response is not too long
    if (formatted.length > 500) {
      formatted = formatted.substring(0, 500) + '...';
    }
    
    return formatted;
  }

  /**
   * Get fallback response when Gemini API is unavailable
   * Provides helpful responses without API dependency
   * @param userMessage - User's original message
   * @returns Fallback response
   */
  private getFallbackResponse(userMessage: string): GeminiServiceResponse {
    const lowerMessage = userMessage.toLowerCase();
    
    // Safety-related fallback responses
    if (lowerMessage.includes('emergency') || lowerMessage.includes('help') || lowerMessage.includes('danger')) {
      return {
        success: true,
        message: '🚨 For immediate emergencies, please use the SOS button on the home screen. Your location will be shared with emergency contacts automatically. Stay safe!'
      };
    }
    
    if (lowerMessage.includes('safety') || lowerMessage.includes('safe')) {
      return {
        success: true,
        message: '🛡️ Your safety is our priority! Use the SOS button for emergencies, enable live tracking when traveling, and keep your emergency contacts updated. Stay aware of your surroundings.'
      };
    }
    
    if (lowerMessage.includes('period') || lowerMessage.includes('cycle') || lowerMessage.includes('pms')) {
      return {
        success: true,
        message: '🌸 Track your cycle and symptoms in the app. Remember to stay hydrated, get rest, and don\'t hesitate to reach out for support when you need it.'
      };
    }
    
    if (lowerMessage.includes('location') || lowerMessage.includes('tracking')) {
      return {
        success: true,
        message: '📍 Use live tracking to share your location with trusted contacts. This feature helps keep you safe during travel or when you feel unsafe.'
      };
    }
    
    // General fallback response
    return {
      success: true,
      message: 'I\'m here to help with safety-related questions! You can ask me about emergency procedures, safety tips, or how to use the app features. For immediate help, use the SOS button.'
    };
  }

  /**
   * Enable or disable Gemini service
   * Useful for testing or emergency fallback
   * @param enabled - Whether to enable the service
   */
  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    console.log('GeminiService: Service', enabled ? 'enabled' : 'disabled');
  }

  /**
   * Check if Gemini service is currently enabled
   * @returns Whether the service is enabled
   */
  public isServiceEnabled(): boolean {
    return this.isEnabled;
  }
}

// Export singleton instance for easy use
export const geminiService = GeminiService.getInstance();
