import { useState, useEffect, useRef } from 'react';
import { AppState, PracticeSession, PracticeTurn, RoleplayConfig } from '../types';
import { store } from '../store';
import { generateRoleplayConfig } from '../ai-service';
import { PracticeChannel, TextPracticeChannel } from '../practice-channel';
import { v4 as uuidv4 } from 'uuid';
import { ArrowLeft, Send, User, Bot, Flag, Loader2 } from 'lucide-react';

type Screen = 'login' | 'dashboard' | 'create' | 'brief' | 'roleplay' | 'results' | 'upload' | 'post' | 'capabilities' | 'roadmap';

interface Props {
  state: AppState;
  interactionId: string | null;
  navigate: (screen: Screen, interactionId?: string, sessionId?: string) => void;
}

export default function Roleplay({ state, interactionId, navigate }: Props) {
  const [session, setSession] = useState<PracticeSession | null>(null);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [config, setConfig] = useState<RoleplayConfig | null>(null);
  const [, setConversationState] = useState<string>('OPENING');
  const [sessionFailed, setSessionFailed] = useState(false);
  const [failureMessage, setFailureMessage] = useState('');
  const initializedInteractionRef = useRef<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channel = useRef<PracticeChannel>(new TextPracticeChannel());

  const interaction = state.interactions.find(i => i.id === interactionId);
  const brief = store.getBriefForInteraction(interactionId || '');

  useEffect(() => {
    if (!interaction || !brief) return;
    if (initializedInteractionRef.current === interaction.id) return;
    initializedInteractionRef.current = interaction.id;
    
    const latestAnalysis = [...store.getState().analyses].reverse().find(a => a.interactionId === interaction.id);
    const baseConfig = generateRoleplayConfig(interaction, brief);
    const roleplayConfig = latestAnalysis ? {
      ...baseConfig,
      objectives: [latestAnalysis.nextIntervention.recommendedAction],
      targetCapability: latestAnalysis.nextIntervention.targetCapability,
      targetBehavior: latestAnalysis.nextIntervention.recommendedAction,
      performancePlan: `Targeted practice after the real interaction: ${latestAnalysis.nextIntervention.title}. ${latestAnalysis.nextIntervention.recommendedAction}`,
    } : baseConfig;
    setConfig(roleplayConfig);
    const currentStatus = store.getState().interactions.find(i => i.id === interaction.id)?.status;
    if (currentStatus === 'ANALYZED') store.transitionInteraction(interaction.id, 'IMPROVING');
    if (currentStatus !== 'PRACTICING') store.transitionInteraction(interaction.id, 'PRACTICING');

    // Create session with unique ID
    const sessionId = uuidv4();
    const newSession: PracticeSession = {
      id: sessionId,
      interactionId: interaction.id,
      config: roleplayConfig,
      turns: [],
      status: 'active',
      startedAt: new Date().toISOString(),
    };
    store.addPracticeSession(newSession);
    setSession(newSession);

    // AI opens
    setTimeout(async () => {
      try {
        // Pass empty conversation history for opening, with session ID
        channel.current.send('', roleplayConfig, [], sessionId);
        const opening = await channel.current.receive();
        
        // Validate session ID in response
        if (opening.sessionId && opening.sessionId !== sessionId) {
          console.error('Session ID mismatch');
          store.transitionInteraction(interaction.id, 'PRACTICE_FAILED');
          setSessionFailed(true);
          return;
        }
        if (!opening.response.trim()) throw new Error('Stakeholder opening was empty.');
        
        const aiTurn: PracticeTurn = {
          id: uuidv4(),
          role: 'ai',
          content: opening.response,
          timestamp: new Date().toISOString(),
        };
        const updatedSession = { ...newSession, turns: [aiTurn] };
        store.updatePracticeSession(newSession.id, { turns: [aiTurn] });
        setSession(updatedSession);
        
        // Update conversation state
        if (opening.conversationState) {
          setConversationState(opening.conversationState);
        }
      } catch (error) {
        console.error('Roleplay opening error:', error);
        setFailureMessage(error instanceof Error ? error.message : 'Practice could not start.');
        store.transitionInteraction(interaction.id, 'PRACTICE_FAILED');
        setSessionFailed(true);
      }
    }, 800);
  }, [interactionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session?.turns]);

  const handleSend = () => {
    if (!input.trim() || !session || !config || isTyping || session.turns.length === 0) return;

    const userTurn: PracticeTurn = {
      id: uuidv4(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    const updatedTurns = [...session.turns, userTurn];
    setSession({ ...session, turns: updatedTurns });
    store.updatePracticeSession(session.id, { turns: updatedTurns });
    setInput('');

    // AI responds
    setIsTyping(true);
    setTimeout(async () => {
      try {
        // CRITICAL: Pass full conversation history to AI with session ID
        channel.current.send(input.trim(), config, updatedTurns, session.id);
        const response = await channel.current.receive();
        
        // Validate session ID
        if (response.sessionId && response.sessionId !== session.id) {
          console.error('Session ID mismatch in response');
          if (interactionId) store.transitionInteraction(interactionId, 'PRACTICE_FAILED');
          setSessionFailed(true);
          setIsTyping(false);
          return;
        }
        if (!response.response.trim()) throw new Error('Stakeholder response was empty.');
        
        const aiTurn: PracticeTurn = {
          id: uuidv4(),
          role: 'ai',
          content: response.response,
          timestamp: new Date().toISOString(),
        };
        const finalTurns = [...updatedTurns, aiTurn];
        const updatedSession = { ...session, turns: finalTurns };
        store.updatePracticeSession(session.id, { turns: finalTurns });
        setSession(updatedSession);
        
        // Update conversation state
        if (response.conversationState) {
          setConversationState(response.conversationState);
          
        }
        
        setIsTyping(false);
      } catch (error) {
        console.error('Roleplay error:', error);
        setIsTyping(false);
        setSessionFailed(true);
        if (interactionId) store.transitionInteraction(interactionId, 'PRACTICE_FAILED');
        // Show error to user instead of silently failing
        alert(`AI Error: ${error}. Session could not be completed.`);
      }
    }, 1200 + Math.random() * 800);
  };

  const handleEndSession = () => {
    if (!session || isTyping) return;
    
    // Validate session has minimum required turns
    const userTurns = session.turns.filter(t => t.role === 'user');
    const aiTurns = session.turns.filter(t => t.role === 'ai');
    
    if (userTurns.length === 0 || aiTurns.length === 0) {
      alert('Practice session incomplete. No performance assessment can be generated.');
      navigate('dashboard');
      return;
    }
    
    const completedSession = { ...session, status: 'completed' as const, completedAt: new Date().toISOString() };
    store.updatePracticeSession(session.id, completedSession);
    navigate('results', interactionId || undefined, session.id);
  };

  if (!interaction || !brief) return <div className="p-8"><h1>Practice setup is incomplete</h1><p>Open the performance plan before practicing.</p><button onClick={() => navigate('dashboard')}>Return home</button></div>;

  if (!session || !config) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center">
        <div className="text-center animate-pulse-soft">
          <Loader2 size={24} className="text-primary-500 mx-auto mb-3 animate-spin" />
          <p className="text-surface-600">Setting up roleplay scenario...</p>
        </div>
      </div>
    );
  }
  
  // Handle session failure
  if (sessionFailed) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center">
        <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-surface-900 mb-2">Practice Session Failed</h2>
          <p className="text-surface-600 mb-4">
            {failureMessage || 'Live AI unavailable. No assessment was generated.'}
          </p>
          <button
            onClick={() => navigate('dashboard')}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const userTurnCount = session.turns.filter(t => t.role === 'user').length;

  return (
    <div className="min-h-screen bg-surface-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-surface-100 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('dashboard')} className="p-2 hover:bg-surface-100 rounded-lg transition-all">
              <ArrowLeft size={18} className="text-surface-600" />
            </button>
            <div>
              <h1 className="text-sm font-bold text-surface-900">{config.scenarioTitle || 'Practice this moment'}</h1>
              <p className="text-xs text-surface-400">
                Role: <span className="font-medium text-surface-600">{config.stakeholderRole}</span> · 
                Pressure: <span className={`font-medium ${config.pressureLevel === 'high' ? 'text-red-600' : config.pressureLevel === 'medium' ? 'text-amber-600' : 'text-green-600'}`}>{config.pressureLevel}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-surface-400">{userTurnCount} responses</span>
            <button
              onClick={handleEndSession}
              disabled={isTyping || session.turns.length === 0}
              className="px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-all flex items-center gap-1"
            >
              <Flag size={14} />
              End & evaluate
            </button>
          </div>
        </div>
      </header>

      {/* Scenario info */}
      <div className="bg-amber-50 border-b border-amber-100 px-4 py-2">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs text-amber-700">
            <span className="font-semibold">5-minute practice:</span> You're meeting with the {config.stakeholderRole}. {config.personality}
          </p>
          <p className="text-xs text-amber-700 mt-1"><strong>Why this practice:</strong> {config.targetBehavior || brief?.personalCoachingFocus}</p>
          <p className="text-xs text-amber-700 mt-1"><strong>Success looks like:</strong> {config.targetBehavior || brief?.practiceRecommendation}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {session.turns.map((turn, idx) => (
            <div
              key={turn.id}
              className={`flex gap-3 animate-fade-in ${turn.role === 'user' ? 'flex-row-reverse' : ''}`}
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                turn.role === 'ai' ? 'bg-primary-100' : 'bg-surface-200'
              }`}>
                {turn.role === 'ai' ? <Bot size={16} className="text-primary-600" /> : <User size={16} className="text-surface-600" />}
              </div>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                turn.role === 'ai'
                  ? 'bg-white border border-surface-100 text-surface-800'
                  : 'bg-primary-600 text-white'
              }`}>
                {turn.role === 'ai' && (
                  <p className="text-xs font-medium text-primary-600 mb-1">{config.stakeholderRole}</p>
                )}
                <p className="text-sm leading-relaxed">{turn.content}</p>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3 animate-fade-in">
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                <Bot size={16} className="text-primary-600" />
              </div>
              <div className="bg-white border border-surface-100 rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-surface-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-surface-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-surface-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t border-surface-100 px-4 py-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Respond naturally as yourself..."
              className="flex-1 px-4 py-3 rounded-xl border border-surface-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-sm"
              disabled={isTyping || session.turns.length === 0}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping || session.turns.length === 0}
              className="px-4 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:bg-surface-200 disabled:cursor-not-allowed transition-all"
            >
              <Send size={18} />
            </button>
          </div>
          <p className="text-xs text-surface-400 mt-2 text-center">
            Respond as you would in the real interaction. The AI will challenge you realistically.
          </p>
        </div>
      </div>
    </div>
  );
}
