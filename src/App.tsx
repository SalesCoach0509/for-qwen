import { useState, useEffect, useCallback } from 'react';
import { store } from './store';
import { AppState } from './types';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import CreateInteraction from './components/CreateInteraction';
import PerformanceBrief from './components/PerformanceBrief';
import { ScenarioPlanner } from './components/ScenarioPlanner';
import Roleplay from './components/Roleplay';
import PracticeResults from './components/PracticeResults';
import UploadTranscript from './components/UploadTranscript';
import PostInteraction from './components/PostInteraction';
import CapabilityProgress from './components/CapabilityProgress';
import ValidationPanel from './components/ValidationPanel';
import BeforeAfterDemo from './components/BeforeAfterDemo';
import InteractionContextBar from './components/InteractionContextBar';
import { checkBackendHealth, setLLMAvailable } from './llm-provider';

type Screen = 'login' | 'dashboard' | 'create' | 'brief' | 'scenario' | 'roleplay' | 'results' | 'upload' | 'post' | 'capabilities' | 'roadmap' | 'validation' | 'demo';

function Screens() {
  const [state, setState] = useState<AppState>(store.getState());
  const [screen, setScreen] = useState<Screen>(state.user ? 'dashboard' : 'login');
  const [activeInteractionId, setActiveInteractionId] = useState<string | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [providerChecked, setProviderChecked] = useState(false);

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      setState(store.getState());
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    let active = true;
    checkBackendHealth().then(health => {
      if (active) setLLMAvailable(health.available, health.provider, health.model);
    }).catch(() => {
      if (active) setLLMAvailable(false);
    }).finally(() => { if (active) setProviderChecked(true); });
    return () => { active = false; };
  }, []);

  const navigate = useCallback((s: Screen, interactionId?: string, sessionId?: string) => {
    setScreen(s);
    if (interactionId) setActiveInteractionId(interactionId);
    if (sessionId) setActiveSessionId(sessionId);
  }, []);

  if (!providerChecked) return <div className="min-h-screen flex items-center justify-center text-slate-600">Connecting to your coach…</div>;

  if (!state.user) {
    return <Login onLogin={() => navigate('dashboard')} />;
  }

  switch (screen) {
    case 'login':
      return <Login onLogin={() => navigate('dashboard')} />;
    case 'dashboard':
      return <Dashboard state={state} navigate={navigate} />;
    case 'create':
      return <CreateInteraction state={state} navigate={navigate} />;
    case 'brief':
      return <><InteractionContextBar interaction={state.interactions.find(i => i.id === activeInteractionId)} /><PerformanceBrief key={activeInteractionId} state={state} interactionId={activeInteractionId} navigate={navigate} /></>;
    case 'scenario':
      return <><InteractionContextBar interaction={state.interactions.find(i => i.id === activeInteractionId)} /><ScenarioPlanner key={activeInteractionId} state={state} interactionId={activeInteractionId || undefined} navigate={navigate} /></>;
    case 'roleplay':
      return <><InteractionContextBar interaction={state.interactions.find(i => i.id === activeInteractionId)} /><Roleplay key={activeInteractionId} state={state} interactionId={activeInteractionId} navigate={navigate} /></>;
    case 'results':
      return <><InteractionContextBar interaction={state.interactions.find(i => i.id === activeInteractionId)} /><PracticeResults key={activeSessionId} state={state} sessionId={activeSessionId} navigate={navigate} /></>;
    case 'upload':
      return <><InteractionContextBar interaction={state.interactions.find(i => i.id === activeInteractionId)} /><UploadTranscript key={activeInteractionId} state={state} interactionId={activeInteractionId} navigate={navigate} /></>;
    case 'post':
      return <><InteractionContextBar interaction={state.interactions.find(i => i.id === activeInteractionId)} /><PostInteraction key={activeInteractionId} state={state} interactionId={activeInteractionId} navigate={navigate} /></>;
    case 'capabilities':
      return <CapabilityProgress state={state} navigate={navigate} />;
    case 'validation':
      return <ValidationPanel onBack={() => navigate('dashboard')} />;
    case 'demo':
      return <BeforeAfterDemo navigate={navigate} />;
    default:
      return <Dashboard state={state} navigate={navigate} />;
  }
}

export default function App(){return <><div className="bg-slate-900 text-white px-5 py-2 text-sm flex flex-wrap gap-3 items-center justify-between"><span>{store.getState().mode==='DEMO'?'DEMO · Synthetic data and responses · Separate from your live work':'LIVE · Your work · Provider required'}</span><label>Mode <select aria-label="Application mode" className="bg-white text-slate-900 border border-slate-300 rounded p-1" value={store.getState().mode||'LIVE'} onChange={e=>store.setMode(e.target.value as 'LIVE'|'DEMO')}><option value="LIVE">Live</option><option value="DEMO">Demo (synthetic)</option></select></label></div><Screens /></>;}
