import { getRoleplayResponse, RoleplayResponse } from './ai-service';
import { RoleplayConfig } from './types';

export interface PracticeChannel {
  send(message: string, config: RoleplayConfig, history: { role: 'ai' | 'user'; content: string }[], sessionId: string): void;
  receive(): Promise<RoleplayResponse>;
}

export class TextPracticeChannel implements PracticeChannel {
  private pending: Promise<RoleplayResponse> | null = null;

  send(message: string, config: RoleplayConfig, history: { role: 'ai' | 'user'; content: string }[], sessionId: string): void {
    if (this.pending) throw new Error('A stakeholder response is already pending.');
    this.pending = getRoleplayResponse(message, config, history, sessionId);
  }

  async receive(): Promise<RoleplayResponse> {
    if (!this.pending) throw new Error('No stakeholder response is pending.');
    try { return await this.pending; }
    finally { this.pending = null; }
  }
}
