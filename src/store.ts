import { AppState, Interaction, PreparationBrief, PracticeSession, PracticeEvaluation, Transcript, PostInteractionAnalysis, CapabilityHistory, User, Organization } from './types';
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
      return JSON.parse(stored);
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
    capabilityHistory: initialCapabilityHistory,
    companyContext: null,
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
    state = { ...state, interactions: [...state.interactions, interaction] };
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

  addBrief: (brief: PreparationBrief) => {
    state = { ...state, briefs: [...state.briefs, brief] };
    persist();
    notify();
  },

  addPracticeSession: (session: PracticeSession) => {
    state = { ...state, practiceSessions: [...state.practiceSessions, session] };
    persist();
    notify();
  },

  updatePracticeSession: (id: string, updates: Partial<PracticeSession>) => {
    state = {
      ...state,
      practiceSessions: state.practiceSessions.map(s => s.id === id ? { ...s, ...updates } : s),
    };
    persist();
    notify();
  },

  addPracticeEvaluation: (evaluation: PracticeEvaluation) => {
    state = { ...state, practiceEvaluations: [...state.practiceEvaluations, evaluation] };
    persist();
    notify();
  },

  addTranscript: (transcript: Transcript) => {
    state = { ...state, transcripts: [...state.transcripts, transcript] };
    persist();
    notify();
  },

  addAnalysis: (analysis: PostInteractionAnalysis) => {
    state = { ...state, analyses: [...state.analyses, analysis] };
    persist();
    notify();
  },

  updateCapabilityHistory: (history: CapabilityHistory[]) => {
    state = { ...state, capabilityHistory: history };
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
      capabilityHistory: initialCapabilityHistory,
      companyContext: null,
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
