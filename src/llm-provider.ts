// LLM Provider - Backend Proxy Architecture
// Frontend NEVER calls Gemini directly. All AI calls go through Express backend.
// API key is secured server-side only.

// In production, backend serves frontend, so use same origin
// In development, backend runs on port 3001
const BACKEND_URL = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
  ? '' // Same origin in production (backend serves frontend)
  : 'http://localhost:3001'; // Development

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface LLMProvider {
  name: string;
  chat(messages: LLMMessage[], options?: {
    temperature?: number;
    maxTokens?: number;
    jsonMode?: boolean;
  }): Promise<LLMResponse>;
}

// Backend Proxy Provider - calls Express backend which has the real Gemini key
class BackendProxyProvider implements LLMProvider {
  name = 'gemini';
  private endpoint: string;

  constructor(endpoint: string) {
    this.endpoint = endpoint;
  }

  async chat(messages: LLMMessage[], options?: {
    temperature?: number;
    maxTokens?: number;
    jsonMode?: boolean;
  }): Promise<LLMResponse> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${BACKEND_URL}${this.endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, options }),
      });

      const latency = Date.now() - startTime;

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        
        // CRITICAL: If backend returns LIVE_AI_ERROR, DO NOT silently fall back to mock
        if (error.error === 'LIVE_AI_ERROR') {
          throw new Error(`LIVE AI ERROR: ${error.message}. Backend Gemini call failed.`);
        }
        
        throw new Error(`Backend API error (${latency}ms): ${JSON.stringify(error)}`);
      }

      const data = await response.json();
      
      console.log(`✓ Backend ${this.endpoint} responded in ${latency}ms`);
      
      return {
        content: typeof data === 'string' ? data : JSON.stringify(data),
        usage: data.usage,
      };
    } catch (error) {
      const latency = Date.now() - startTime;
      console.error(`✗ Backend call failed after ${latency}ms:`, error);
      
      // CRITICAL: Re-throw the error. Do NOT silently fall back to mock.
      throw error;
    }
  }
}

// Provider Factory - always uses backend proxy
export function createLLMProvider(): LLMProvider {
  // All AI operations go through backend proxy
  // The endpoint is determined by the calling function
  return new BackendProxyProvider('/api/ai/chat');
}

// Specialized Roleplay Provider - uses dedicated endpoint with conversation history
export class RoleplayProvider {
  private static BACKEND_URL = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? '' // Same origin in production
    : 'http://localhost:3001'; // Development

  static async getRoleplayResponse(
    userMessage: string,
    config: any,
    conversationHistory: { role: 'ai' | 'user'; content: string }[],
    sessionId?: string
  ): Promise<{ response: string; sessionId?: string; conversationState?: string; aiMeta?: any }> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${this.BACKEND_URL}/api/ai/roleplay/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage,
          config,
          conversationHistory,
          sessionId
        }),
      });

      const latency = Date.now() - startTime;

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        
        if (error.error === 'LIVE_AI_ERROR') {
          throw new Error(`LIVE AI ERROR: ${error.message}`);
        }
        
        throw new Error(`Backend API error (${latency}ms): ${JSON.stringify(error)}`);
      }

      const data = await response.json();
      
      console.log(`✓ Roleplay backend responded in ${latency}ms`);
      console.log('  - Session ID:', data.sessionId);
      console.log('  - Conversation State:', data.conversationState);
      console.log('  - AI Meta:', data.aiMeta);
      
      return {
        response: data.response,
        sessionId: data.sessionId,
        conversationState: data.conversationState,
        aiMeta: data.aiMeta
      };
    } catch (error) {
      const latency = Date.now() - startTime;
      console.error(`✗ Roleplay backend call failed after ${latency}ms:`, error);
      throw error;
    }
  }
}

// Check if backend is available (for LIVE AI MODE)
export async function checkBackendHealth(): Promise<{ available: boolean; provider?: string; model?: string }> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(2000),
    });
    
    if (response.ok) {
      const data = await response.json();
      return {
        available: true,
        provider: data.provider,
        model: data.model,
      };
    }
    return { available: false };
  } catch {
    return { available: false };
  }
}

// Runtime state for LLM availability
let _isLLMAvailable: boolean | null = null;
let _providerInfo: { name: string; model: string; isLive: boolean } | null = null;

// Check if we're in LIVE AI MODE (backend is running)
// This now checks the backend at runtime instead of relying on build-time vars
export function isLLMAvailable(): boolean {
  // Return cached value if we've already checked
  if (_isLLMAvailable !== null) {
    return _isLLMAvailable;
  }
  
  // Default to false until we check the backend
  // The LLMStatus component will call checkBackendHealth() to update this
  return false;
}

// Update the LLM availability state (called after checking backend)
export function setLLMAvailable(available: boolean, provider?: string, model?: string): void {
  _isLLMAvailable = available;
  _providerInfo = {
    name: provider || 'Gemini',
    model: model || 'gemini-2.5-flash',
    isLive: available,
  };
}

// Get current provider info
export function getProviderInfo(): { name: string; model: string; isLive: boolean } {
  // Return cached provider info if available
  if (_providerInfo !== null) {
    return _providerInfo;
  }
  
  // Default values
  return {
    name: 'Gemini',
    model: 'gemini-2.5-flash',
    isLive: false,
  };
}
