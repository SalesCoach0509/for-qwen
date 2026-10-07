import { AppState, Interaction, PreparationBrief, PracticeSession, PracticeEvaluation, Transcript, PostInteractionAnalysis, CapabilityHistory, User, Organization, PerformanceMomentStatus, AiOperationMetadata, ProductEvent } from './types';
import { canTransition, normalizeStatus } from './performance-moment';
import { initialCapabilityHistory } from './data/seed';

const STORAGE_KEY = 'performance_coach_state';

const defaultUser: User = {
  id: 'user-demo-001',
  name: 'Rahul Sharma',
  email: 'rahul@demo.com',
  role: 'Account Executive',
  organizationId: 'org-demo-001',
  createdAt: new Date().toISOString(),
};

const defaultOrg: Organization = {
  id: 'org-demo-001',
  name: 'Demo Organization',
};

function getInitialState(): AppState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const saved = JSON.parse(stored) as AppState;
      return {
        ...saved,
        interactions: (saved.interactions || []).map(i => ({ ...i, status: normalizeStatus(i.status), scenarioPlan: i.scenarioPlan ? { ...i.scenarioPlan, interactionId: i.id } : undefined })),
        capabilityHistory: JSON.stringify(saved.capabilityHistory) === JSON.stringify(initialCapabilityHistory) ? [] : saved.capabilityHistory || [],
        aiOperations: saved.aiOperations || [],
        productEvents: saved.productEvents || [],
      };
    }
  } catch (e) {
    console.error('Failed to load state:', e);
  }
  return {
    user: null,
    organization: null,
    interactions: [],
    briefs: [],
    practiceSessions: [],
    practiceEvaluations: [],
    transcripts: [],
    analyses: [],
    capabilityHistory: [],
    companyContext: null,
    aiOperations: [],
    productEvents: [],
  };
}

let state: AppState = getInitialState();
let listeners: (() => void)[] = [];

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to persist state:', e);
  }
}

function notify() {
  listeners.forEach(l => l());
}

function track(event: ProductEvent['event'], interactionId: string, detail?: string) {
  state = { ...state, productEvents: [...(state.productEvents || []), { event, interactionId, detail, timestamp: new Date().toISOString() }] };
}

export const store = {
  getState: () => state,
  
  subscribe: (listener: () => void) => {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  },

  login: (name: string, email: string) => {
    state = {
      ...state,
      user: { ...defaultUser, name, email },
      organization: defaultOrg,
    };
    persist();
    notify();
  },

  logout: () => {
    state = { ...state, user: null, organization: null };
    persist();
    notify();
  },

  addInteraction: (interaction: Interaction) => {
    const previous = [...state.interactions].filter(i => i.userId === interaction.userId).sort((a, b) => Date.parse(b.dateTime) - Date.parse(a.dateTime))[0];
    state = { ...state, interactions: [...state.interactions, interaction] };
    track('PERFORMANCE_MOMENT_CREATED', interaction.id);
    if (previous) {
      track('REPEAT_INTERACTION', interaction.id, previous.id);
      const hours = (Date.parse(interaction.dateTime) - Date.parse(previous.dateTime)) / 3600000;
      if (Number.isFinite(hours) && hours >= 0) track('TIME_TO_NEXT_PERFORMANCE', interaction.id, String(Math.round(hours)));
    }
    persist();
    notify();
  },

  updateInteraction: (id: string, updates: Partial<Interaction>) => {
    state = {
      ...state,
      interactions: state.interactions.map(i => i.id === id ? { ...i, ...updates } : i),
    };
    persist();
    notify();
  },

  transitionInteraction: (id: string, next: PerformanceMomentStatus) => {
    const interaction = state.interactions.find(i => i.id === id);
    if (!interaction) throw new Error(`Performance moment ${id} not found`);
    if (interaction.status === next) return;
    if (!canTransition(interaction.status, next)) {
      throw new Error(`Invalid performance moment transition: ${interaction.status} → ${next}`);
    }
    state = {
      ...state,
      interactions: state.interactions.map(i => i.id === id ? { ...i, status: next } : i),
    };
    persist();
    notify();
  },

  recordAiOperation: (operation: AiOperationMetadata) => {
    state = { ...state, aiOperations: [...(state.aiOperations || []), operation] };
    persist();
    notify();
  },

  recordProductEvent: (event: ProductEvent['event'], interactionId: string, detail?: string) => {
    track(event, interactionId, detail);
    persist();
    notify();
  },

  addBrief: (brief: PreparationBrief) => {
    state = { ...state, briefs: [...state.briefs, brief] };
    track('PREPARATION_GENERATED', brief.interactionId);
    persist();
    notify();
  },

  addPracticeSession: (session: PracticeSession) => {
    state = { ...state, practiceSessions: [...state.practiceSessions, session] };
    track('PRACTICE_STARTED', session.interactionId);
    persist();
    notify();
  },

  updatePracticeSession: (id: string, updates: Partial<PracticeSession>) => {
    const before = state.practiceSessions.find(s => s.id === id);
    state = {
      ...state,
      practiceSessions: state.practiceSessions.map(s => s.id === id ? { ...s, ...updates } : s),
    };
    if (before?.status !== 'completed' && updates.status === 'completed') track('PRACTICE_COMPLETED', before?.interactionId || '');
    persist();
    notify();
  },

  addPracticeEvaluation: (evaluation: PracticeEvaluation) => {
    state = { ...state, practiceEvaluations: [...state.practiceEvaluations, evaluation] };
    track('EVIDENCE_GENERATED', evaluation.interactionId, String(evaluation.capabilityScores.reduce((n, score) => n + score.evidence.length, 0)));
    persist();
    notify();
  },

  addTranscript: (transcript: Transcript) => {
    state = { ...state, transcripts: [...state.transcripts, transcript] };
    track('REAL_PERFORMANCE_SUBMITTED', transcript.interactionId);
    persist();
    notify();
  },

  addAnalysis: (analysis: PostInteractionAnalysis) => {
    state = { ...state, analyses: [...state.analyses, analysis] };
    track('ANALYSIS_COMPLETED', analysis.interactionId);
    track('EVIDENCE_GENERATED', analysis.interactionId, String(analysis.capabilityDiagnosis.reduce((n, score) => n + score.evidence.length, 0)));
    persist();
    notify();
  },

  updateCapabilityHistory: (history: CapabilityHistory[], interactionId: string) => {
    const changed = history.some(next => {
      const previous = state.capabilityHistory.find(h => h.capability === next.capability);
      return !previous || previous.scores.length !== next.scores.length || previous.currentScore !== next.currentScore;
    });
    state = { ...state, capabilityHistory: history };
    if (changed) track('CAPABILITY_STATE_CHANGED', interactionId, String(history.length));
    persist();
    notify();
  },

  resetDemo: () => {
    state = {
      user: null,
      organization: null,
      interactions: [],
      briefs: [],
      practiceSessions: [],
      practiceEvaluations: [],
      transcripts: [],
      analyses: [],
      capabilityHistory: [],
      companyContext: null,
      aiOperations: [],
      productEvents: [],
    };
    persist();
    notify();
  },

  getBriefForInteraction: (interactionId: string) => {
    return state.briefs.find(b => b.interactionId === interactionId);
  },

  getAnalysisForInteraction: (interactionId: string) => {
    return state.analyses.find(a => a.interactionId === interactionId);
  },

  getPracticeForInteraction: (interactionId: string) => {
    return state.practiceSessions.filter(s => s.interactionId === interactionId);
  },

  getLatestEvaluation: (sessionId: string) => {
    return state.practiceEvaluations.find(e => e.sessionId === sessionId);
  },
};
