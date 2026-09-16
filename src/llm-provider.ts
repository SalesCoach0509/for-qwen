// LLM Provider - Backend Proxy Architecture
// Frontend NEVER calls Gemini directly. All AI calls go through Express backend.
// API key is secured server-side only.

// In production, backend serves frontend, so use same origin
// In development, backend runs on port 3001
const isLocalDevelopment = typeof window !== 'undefined' && ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);
const BACKEND_URL = isLocalDevelopment
  ? 'http://localhost:3001'
  : '';
const BACKEND_STATUS_TIMEOUT_MS = Number(import.meta.env.VITE_BACKEND_STATUS_TIMEOUT_MS || '5000');
const AI_REQUEST_TIMEOUT_MS = Number(import.meta.env.VITE_AI_REQUEST_TIMEOUT_MS || '125000');

console.log('🔍 BACKEND_URL:', BACKEND_URL);
console.log('🔍 window.location.hostname:', typeof window !== 'undefined' ? window.location.hostname : 'N/A');

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
        signal: AbortSignal.timeout(AI_REQUEST_TIMEOUT_MS),
      });

      const latency = Date.now() - startTime;

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        
        // CRITICAL: If backend returns LIVE_AI_ERROR, DO NOT silently fall back to mock
        if (error.error === 'LIVE_AI_ERROR') {
          // The backend can use Gemini, NVIDIA NIM, or any configured
          // OpenAI-compatible provider; keep diagnostics provider-neutral.
          throw new Error(`LIVE AI ERROR: ${error.message}. Backend provider call failed.`);
        }
        
        throw new Error(`Backend API error (${latency}ms): ${JSON.stringify(error)}`);
      }

      const data = await response.json();
      
      console.log(`✓ Backend ${this.endpoint} responded in ${latency}ms`);
      console.log(`  Response structure:`, Object.keys(data));
      
      // Backend returns { content: string, usage: object }
      // Extract the content field, don't stringify the entire object
      return {
        content: data.content,
        usage: data.usage,
      };
    } catch (error) {
      const latency = Date.now() - startTime;
      const details = error instanceof Error ? error.message : JSON.stringify(error);
      console.error(`✗ Backend call failed after ${latency}ms: ${details}`);
      
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
  private static BACKEND_URL = BACKEND_URL;

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
        signal: AbortSignal.timeout(AI_REQUEST_TIMEOUT_MS),
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
      const details = error instanceof Error ? error.message : JSON.stringify(error);
      console.error(`✗ Roleplay backend call failed after ${latency}ms: ${details}`);
      throw error;
    }
  }
}

// Check if backend is available (for LIVE AI MODE)
export async function checkBackendHealth(): Promise<{ available: boolean; provider?: string; model?: string }> {
  try {
    const url = `${BACKEND_URL}/api/health`;
    console.log('🔍 checkBackendHealth: Fetching', url);
    
    const response = await fetch(url, {
      method: 'GET',
      signal: AbortSignal.timeout(BACKEND_STATUS_TIMEOUT_MS),
    });
    
    console.log('🔍 checkBackendHealth: Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ checkBackendHealth: Success, provider:', data.provider, 'model:', data.model);
      return {
        available: true,
        provider: data.provider,
        model: data.model,
      };
    }
    console.log('⚠️ checkBackendHealth: Response not OK, status:', response.status);
    return { available: false };
  } catch (error) {
    console.error('❌ checkBackendHealth: Error:', error);
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
    model: model || 'gemini-3.6-flash',
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
    model: 'gemini-3.6-flash',
    isLive: false,
  };
}
