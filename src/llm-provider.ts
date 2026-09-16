// Live AI provider proxy. API keys remain on the Express backend.

const isLocalDevelopment = typeof window !== 'undefined' && ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);
const configuredBackendUrl = (import.meta.env.VITE_BACKEND_URL || '').replace(/\/$/, '');
const BACKEND_URL = configuredBackendUrl || (isLocalDevelopment ? 'http://localhost:3001' : '');
const BACKEND_STATUS_TIMEOUT_MS = Number(import.meta.env.VITE_BACKEND_STATUS_TIMEOUT_MS || '5000');
const AI_REQUEST_TIMEOUT_MS = Number(import.meta.env.VITE_AI_REQUEST_TIMEOUT_MS || '125000');

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
  usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
}

export interface LLMProvider {
  name: string;
  chat(messages: LLMMessage[], options?: { temperature?: number; maxTokens?: number; jsonMode?: boolean }): Promise<LLMResponse>;
}

class BackendProxyProvider implements LLMProvider {
  name = 'live-provider';
  constructor(private endpoint: string) {}

  async chat(messages: LLMMessage[], options?: { temperature?: number; maxTokens?: number; jsonMode?: boolean }): Promise<LLMResponse> {
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
        throw new Error(error.error === 'LIVE_AI_ERROR'
          ? `LIVE AI ERROR: ${error.message}. Backend provider call failed.`
          : `Backend API error (${latency}ms): ${JSON.stringify(error)}`);
      }
      const data = await response.json();
      return { content: data.content, usage: data.usage };
    } catch (error) {
      const latency = Date.now() - startTime;
      console.error(`✗ Backend call failed after ${latency}ms:`, error);
      throw error;
    }
  }
}

export function createLLMProvider(): LLMProvider {
  return new BackendProxyProvider('/api/ai/chat');
}

export class RoleplayProvider {
  static async getRoleplayResponse(
    userMessage: string,
    config: unknown,
    conversationHistory: { role: 'ai' | 'user'; content: string }[],
    sessionId?: string
  ): Promise<{ response: string; sessionId?: string; conversationState?: string; aiMeta?: unknown }> {
    const response = await fetch(`${BACKEND_URL}/api/ai/roleplay/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userMessage, config, conversationHistory, sessionId }),
      signal: AbortSignal.timeout(AI_REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`LIVE AI ERROR: ${error.message || JSON.stringify(error)}`);
    }
    return await response.json();
  }
}

export async function checkBackendHealth(): Promise<{ available: boolean; provider?: string; model?: string }> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/health`, {
      method: 'GET', signal: AbortSignal.timeout(BACKEND_STATUS_TIMEOUT_MS),
    });
    if (!response.ok) return { available: false };
    const data = await response.json();
    return { available: true, provider: data.provider, model: data.model };
  } catch (error) {
    console.error('Backend health check failed:', error);
    return { available: false };
  }
}

let providerInfo: { name: string; model: string; isLive: boolean } = {
  name: 'Checking', model: '', isLive: false,
};

// Live-only MVP: a temporary health failure must surface as a retryable UI
// error, never silently fall back to static/mock coaching content.
export function isLLMAvailable(): boolean { return true; }

export function setLLMAvailable(available: boolean, provider?: string, model?: string): void {
  providerInfo = { name: provider || 'Unavailable', model: model || '', isLive: available };
}

export function getProviderInfo(): { name: string; model: string; isLive: boolean } {
  return providerInfo;
}
