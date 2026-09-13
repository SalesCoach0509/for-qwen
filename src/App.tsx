import { useState, useEffect, useCallback } from 'react';
import { store } from './store';
import { AppState } from './types';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import CreateInteraction from './components/CreateInteraction';
import PerformanceBrief from './components/PerformanceBrief';
import Roleplay from './components/Roleplay';
import PracticeResults from './components/PracticeResults';
import UploadTranscript from './components/UploadTranscript';
import PostInteraction from './components/PostInteraction';
import CapabilityProgress from './components/CapabilityProgress';
import Roadmap from './components/Roadmap';
import ValidationPanel from './components/ValidationPanel';
import BeforeAfterDemo from './components/BeforeAfterDemo';

type Screen = 'login' | 'dashboard' | 'create' | 'brief' | 'roleplay' | 'results' | 'upload' | 'post' | 'capabilities' | 'roadmap' | 'validation' | 'demo';

function App() {
  const [state, setState] = useState<AppState>(store.getState());
  const [screen, setScreen] = useState<Screen>(state.user ? 'dashboard' : 'login');
  const [activeInteractionId, setActiveInteractionId] = useState<string | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      setState(store.getState());
    });
    return unsubscribe;
  }, []);

  const navigate = useCallback((s: Screen, interactionId?: string, sessionId?: string) => {
    setScreen(s);
    if (interactionId) setActiveInteractionId(interactionId);
    if (sessionId) setActiveSessionId(sessionId);
  }, []);

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
      return <PerformanceBrief state={state} interactionId={activeInteractionId} navigate={navigate} />;
    case 'roleplay':
      return <Roleplay state={state} interactionId={activeInteractionId} navigate={navigate} />;
    case 'results':
      return <PracticeResults state={state} sessionId={activeSessionId} navigate={navigate} />;
    case 'upload':
      return <UploadTranscript state={state} interactionId={activeInteractionId} navigate={navigate} />;
    case 'post':
      return <PostInteraction state={state} interactionId={activeInteractionId} navigate={navigate} />;
    case 'capabilities':
      return <CapabilityProgress state={state} navigate={navigate} />;
    case 'roadmap':
      return <Roadmap state={state} navigate={navigate} />;
    case 'validation':
      return <ValidationPanel />;
    case 'demo':
      return <BeforeAfterDemo navigate={navigate} />;
    default:
      return <Dashboard state={state} navigate={navigate} />;
  }
}

export default App;
