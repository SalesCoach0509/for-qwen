import { AppState, Interaction, PerformanceMomentStatus } from './types';

export type NextBestAction =
  | 'PREPARE_ME' | 'PRACTICE_THIS' | 'YOU_ARE_READY'
  | 'ADD_REAL_PERFORMANCE' | 'ANALYZE_WHAT_HAPPENED'
  | 'REVIEW_COACHING' | 'PRACTICE_NEXT_GAP';

const legacyStatuses: Record<string, PerformanceMomentStatus> = {
  upcoming: 'UPCOMING', prepared: 'PREPARED', practiced: 'READY',
  performed: 'PERFORMED', analyzed: 'ANALYZED',
};

export function normalizeStatus(status: string): PerformanceMomentStatus {
  return legacyStatuses[status] || status as PerformanceMomentStatus;
}

const allowed: Record<PerformanceMomentStatus, PerformanceMomentStatus[]> = {
  UPCOMING: ['PREPARING'],
  PREPARING: ['PREPARED', 'PREPARATION_FAILED'],
  PREPARATION_FAILED: ['PREPARING'],
  PREPARED: ['PRACTICING', 'PERFORMED'],
  PRACTICING: ['READY', 'PRACTICE_FAILED', 'PERFORMED', 'COMPLETED'],
  PRACTICE_FAILED: ['PRACTICING'],
  READY: ['PERFORMED', 'PRACTICING'],
  PERFORMED: ['ANALYZING'],
  ANALYZING: ['ANALYZED', 'ANALYSIS_FAILED'],
  ANALYSIS_FAILED: ['ANALYZING'],
  ANALYZED: ['IMPROVING', 'COMPLETED'],
  IMPROVING: ['COMPLETED', 'PRACTICING'],
  COMPLETED: ['PRACTICING'],
};

export function canTransition(from: PerformanceMomentStatus, to: PerformanceMomentStatus): boolean {
  return allowed[from]?.includes(to) || false;
}

export function getNextBestAction(interaction: Interaction, state: AppState): NextBestAction {
  const status = normalizeStatus(interaction.status);
  switch (status) {
    case 'UPCOMING':
    case 'PREPARING':
    case 'PREPARATION_FAILED': return 'PREPARE_ME';
    case 'PREPARED':
    case 'PRACTICING':
    case 'PRACTICE_FAILED': return 'PRACTICE_THIS';
    case 'READY': return Date.parse(interaction.dateTime) > Date.now() ? 'YOU_ARE_READY' : 'ADD_REAL_PERFORMANCE';
    case 'PERFORMED':
    case 'ANALYZING':
    case 'ANALYSIS_FAILED': return 'ANALYZE_WHAT_HAPPENED';
    case 'ANALYZED': return 'REVIEW_COACHING';
    case 'IMPROVING':
    case 'COMPLETED': return state.analyses.some(a => a.interactionId === interaction.id)
      ? 'PRACTICE_NEXT_GAP' : 'REVIEW_COACHING';
  }
}

export const actionLabels: Record<NextBestAction, string> = {
  PREPARE_ME: 'Prepare me',
  PRACTICE_THIS: 'Practice this moment',
  YOU_ARE_READY: "I'm ready — add the real performance later",
  ADD_REAL_PERFORMANCE: 'Add real performance',
  ANALYZE_WHAT_HAPPENED: 'Analyze what happened',
  REVIEW_COACHING: 'Review coaching',
  PRACTICE_NEXT_GAP: 'Practice this gap',
};
