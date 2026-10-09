import { seedDemo } from './demo-seed';
import { AppState, Interaction, PreparationBrief, PracticeSession, PracticeEvaluation, Transcript, PostInteractionAnalysis, CapabilityHistory, User, Organization, PerformanceMomentStatus, AiOperationMetadata, ProductEvent } from './types';
import { canTransition, normalizeStatus, getNextBestAction } from './performance-moment';
import { initialCapabilityHistory } from './data/seed';

const activeMode = localStorage.getItem('performance_coach_mode') === 'DEMO' ? 'DEMO' : 'LIVE';
const STORAGE_KEY = activeMode === 'DEMO' ? 'performance_coach_state_demo' : 'performance_coach_state';

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
      if(!saved||typeof saved!=='object'||!Array.isArray(saved.interactions)){
        localStorage.setItem(STORAGE_KEY+'_recovery',stored);
        throw new Error('Saved state needs recovery');
      }
      return {
        ...saved,
        briefs:Array.isArray(saved.briefs)?saved.briefs:[],
        practiceSessions:Array.isArray(saved.practiceSessions)?saved.practiceSessions:[],
        practiceEvaluations:Array.isArray(saved.practiceEvaluations)?saved.practiceEvaluations:[],
        transcripts:Array.isArray(saved.transcripts)?saved.transcripts:[],
        analyses:Array.isArray(saved.analyses)?saved.analyses:[],
        mode: activeMode,
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
    mode: activeMode,
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

let state: AppState = seedDemo(getInitialState());
const emptyState=():AppState=>({mode:activeMode,user:null,organization:null,interactions:[],briefs:[],practiceSessions:[],practiceEvaluations:[],transcripts:[],analyses:[],capabilityHistory:[],companyContext:null,aiOperations:[],productEvents:[]});
let listeners: (() => void)[] = [];

function persist() {
  state = { ...state, interactions: state.interactions.map(i => {
    const brief = [...state.briefs].reverse().find(b => b.interactionId === i.id);
    const transcript = [...state.transcripts].reverse().find(t => t.interactionId === i.id);
    const analysis = [...state.analyses].reverse().find(a => a.interactionId === i.id && a.transcriptId === transcript?.id);
    return { ...i, interactionId: i.id, employeeId: i.userId, mode: activeMode, context: i.additionalContext || i.notes, capabilityFocus: i.focusCapability,
      preparationId: brief?.id, practiceSessionIds: state.practiceSessions.filter(s => s.interactionId === i.id).map(s => s.id), transcriptId: transcript?.id,
      analysisId: analysis?.id, capabilityAssessmentId: analysis?.id || [...state.practiceEvaluations].reverse().find(e => e.interactionId === i.id)?.id,
      interventionId: analysis?.nextIntervention.id, nextAction: getNextBestAction(i, state) };
  }) };

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
  setMode: (mode: 'LIVE' | 'DEMO') => { persist(); localStorage.setItem('performance_coach_mode', mode); window.location.reload(); },
  setCompanyContext: (context: AppState['companyContext']) => { state = { ...state, companyContext: context }; persist(); notify(); },
  
  subscribe: (listener: () => void) => {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  },

  login: (name: string, email: string) => {
    const profile=email.trim().toLowerCase();
    const previous=localStorage.getItem(STORAGE_KEY+'_profile');
    if(previous&&previous!==profile){
      localStorage.setItem(STORAGE_KEY+'_profile_'+encodeURIComponent(previous),JSON.stringify(state));
      try{state=JSON.parse(localStorage.getItem(STORAGE_KEY+'_profile_'+encodeURIComponent(profile))||'null')||emptyState();}catch{state=emptyState();}
    }
    localStorage.setItem(STORAGE_KEY+'_profile',profile);
    state = {
      ...state,
      user: { ...defaultUser, id:activeMode+':'+encodeURIComponent(profile), name, email },
      organization: defaultOrg,
    };
    state=seedDemo(state);
    persist();
    notify();
  },

  logout: () => {
    state = { ...state, user: null, organization: null };
    persist();
    notify();
  },

  addInteraction: (interaction: Interaction) => {
    if (state.interactions.some(i => i.id === interaction.id)) return;
    const previous = [...state.interactions].filter(i => i.userId === interaction.userId).sort((a, b) => Date.parse(b.dateTime) - Date.parse(a.dateTime))[0];
    state = { ...state, interactions: [...state.interactions, {...interaction,previousInteractionId:interaction.previousInteractionId||previous?.id}] };
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
    const current = state.interactions.find(i => i.id === id);
    if (!current) throw new Error('Performance moment not found');
    if (updates.status && updates.status !== current.status) throw new Error('Use the validated lifecycle transition');
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
    if (next === 'PREPARED' && !state.briefs.some(b => b.interactionId === id)) throw new Error('A successful plan is required');
    if (next === 'PERFORMED' && !state.transcripts.some(t => t.interactionId === id)) throw new Error('Transcript required');
    if (next === 'ANALYZED' && !state.analyses.some(a => a.interactionId === id && a.transcriptId === [...state.transcripts].reverse().find(t => t.interactionId === id)?.id)) throw new Error('Current analysis required');
    if (['READY', 'COMPLETED'].includes(next) && !state.practiceEvaluations.some(e => e.interactionId === id && e.capabilityScores.some(c => c.score >= 1 && c.evidence.length > 0))) throw new Error('Grounded assessment required');
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
    if (!state.interactions.some(i => i.id === brief.interactionId)) throw new Error('Plan has no performance moment');
    state = { ...state, briefs: [...state.briefs.filter(b => b.id !== brief.id), brief] };
    track('PREPARATION_GENERATED', brief.interactionId);
    persist();
    notify();
  },

  addPracticeSession: (session: PracticeSession) => {
    if(!state.interactions.some(i=>i.id===session.interactionId)||session.config.interactionId!==session.interactionId)throw new Error('Invalid practice identity');
    if(state.practiceSessions.some(s=>s.id===session.id))throw new Error('Duplicate practice session');
    state = { ...state, practiceSessions: [...state.practiceSessions, session] };
    track('PRACTICE_STARTED', session.interactionId);
    persist();
    notify();
  },

  updatePracticeSession: (id: string, updates: Partial<PracticeSession>) => {
    const before = state.practiceSessions.find(s => s.id === id);
    if(!before)throw new Error('Practice session not found');
    if(updates.interactionId&&updates.interactionId!==before.interactionId)throw new Error('Practice identity is immutable');
    if(before.status!=='active')return;
    if(updates.status==='completed'&&(!updates.completionReason||!(updates.turns||before.turns).some(t=>t.role==='user')||(updates.turns||before.turns).slice(-1)[0]?.role!=='ai'))throw new Error('Incomplete practice cannot be assessed');
    state = {
      ...state,
      practiceSessions: state.practiceSessions.map(s => s.id === id ? { ...s, ...updates } : s),
    };
    if (updates.status === 'completed') track('PRACTICE_COMPLETED', before?.interactionId || '');
    persist();
    notify();
  },

  addPracticeEvaluation: (evaluation: PracticeEvaluation) => {
    const session = state.practiceSessions.find(s => s.id === evaluation.sessionId && s.interactionId === evaluation.interactionId);
    if (!session || session.status !== 'completed') throw new Error('No assessment from failed or incomplete practice');
    if (state.practiceEvaluations.some(e => e.sessionId === evaluation.sessionId)) return;
    state = { ...state, practiceEvaluations: [...state.practiceEvaluations, evaluation] };
    track('EVIDENCE_GENERATED', evaluation.interactionId, String(evaluation.capabilityScores.reduce((n, score) => n + score.evidence.length, 0)));
    persist();
    notify();
  },

  addTranscript: (transcript: Transcript) => {
    if (!state.interactions.some(i => i.id === transcript.interactionId) || !transcript.content.trim()) throw new Error('Transcript requires a performance moment and content');
    state = { ...state, transcripts: [...state.transcripts, transcript] };
    track('REAL_PERFORMANCE_SUBMITTED', transcript.interactionId);
    persist();
    notify();
  },

  addAnalysis: (analysis: PostInteractionAnalysis) => {
    const transcript=[...state.transcripts].reverse().find(t=>t.interactionId===analysis.interactionId);
    if(!transcript||analysis.transcriptId!==transcript.id)throw new Error('Analysis does not belong to the current transcript');
    if(state.analyses.some(a=>a.transcriptId===analysis.transcriptId))return;
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
    if(activeMode!=='DEMO')return;
    state = {
      mode: activeMode,
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
    return [...state.briefs].reverse().find(b => b.interactionId === interactionId);
  },

  getAnalysisForInteraction: (interactionId: string) => {
    const transcript = [...state.transcripts].reverse().find(t => t.interactionId === interactionId);
    return [...state.analyses].reverse().find(a => a.interactionId === interactionId && a.transcriptId === transcript?.id);
  },

  getPracticeForInteraction: (interactionId: string) => {
    return state.practiceSessions.filter(s => s.interactionId === interactionId);
  },

  getLatestEvaluation: (sessionId: string) => {
    return state.practiceEvaluations.find(e => e.sessionId === sessionId);
  },
};
