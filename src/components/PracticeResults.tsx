import { useState, useEffect } from 'react';
import { AppState, PracticeEvaluation } from '../types';
import { store } from '../store';
import { generatePracticeEvaluation } from '../ai-service';
import { updateCapabilityHistory } from '../capability-memory';
import { ArrowLeft, Target, TrendingUp, TrendingDown, Minus, CheckCircle, AlertCircle, Play, ArrowRight } from 'lucide-react';

type Screen = 'login' | 'dashboard' | 'create' | 'brief' | 'roleplay' | 'results' | 'upload' | 'post' | 'capabilities' | 'roadmap';

interface Props {
  state: AppState;
  sessionId: string | null;
  navigate: (screen: Screen, interactionId?: string) => void;
}

export default function PracticeResults({ state, sessionId, navigate }: Props) {
  const [evaluation, setEvaluation] = useState<PracticeEvaluation | null>(null);
  const [loading, setLoading] = useState(true);

  const session = state.practiceSessions.find(s => s.id === sessionId);
  const interaction = state.interactions.find(i => i.id === session?.interactionId);

  useEffect(() => {
    if (!session) return;

    // CRITICAL: Validate session is complete and has valid data
    const userTurns = session.turns.filter(t => t.role === 'user');
    const aiTurns = session.turns.filter(t => t.role === 'ai');
    
    if (userTurns.length === 0 || aiTurns.length === 0) {
      console.error('Invalid session: missing turns');
      setLoading(false);
      return;
    }
    
    if (session.status !== 'completed') {
      console.error('Session not completed');
      setLoading(false);
      return;
    }

    // Check if evaluation already exists
    const existing = store.getLatestEvaluation(session.id);
    if (existing) {
      // CRITICAL: Validate evaluation is for this session
      if (existing.sessionId !== session.id) {
        console.error('Evaluation session ID mismatch');
        setLoading(false);
        return;
      }
      setEvaluation(existing);
      setLoading(false);
      return;
    }

    // Generate evaluation with session validation
    const turns = session.turns.map(t => ({ role: t.role, content: t.content }));
    generatePracticeEvaluation(turns, session.config, session.id).then(async eval_ => {
      // CRITICAL: Validate evaluation session ID
      if (eval_.sessionId && eval_.sessionId !== session.id) {
        console.error('Generated evaluation session ID mismatch');
        setLoading(false);
        return;
      }
      
      const evaluationWithIds = {
        ...eval_,
        sessionId: session.id,
        interactionId: session.interactionId,
      };
      store.addPracticeEvaluation(evaluationWithIds);
      
      // Update capability history (async with judge validation)
      const updatedHistory = await updateCapabilityHistory(
        state.capabilityHistory,
        eval_.capabilityScores,
        'Practice session'
      );
      store.updateCapabilityHistory(updatedHistory);
      
      setEvaluation(evaluationWithIds);
      setLoading(false);
    }).catch(error => {
      console.error('Evaluation generation failed:', error);
      setLoading(false);
    });
  }, [session]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center">
        <div className="text-center animate-pulse-soft">
          <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4">
            <Target size={24} className="text-primary-600" />
          </div>
          <p className="text-surface-600 font-medium">Evaluating your performance...</p>
          <p className="text-sm text-surface-400 mt-1">Analyzing capability demonstration</p>
        </div>
      </div>
    );
  }
  
  // CRITICAL: Handle invalid or failed sessions
  if (!session || !evaluation || session.status !== 'completed') {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center">
        <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-surface-900 mb-2">Practice Could Not Be Completed</h2>
          <p className="text-surface-600 mb-4">
            No performance assessment was generated. The practice session may have been incomplete or encountered an error.
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

  const getLevelLabel = (score: number) => {
    if (score >= 4.5) return 'Advanced';
    if (score >= 3.5) return 'Strong';
    if (score >= 2.5) return 'Functional';
    if (score >= 1.5) return 'Developing';
    return 'Novice';
  };

  const getScoreColor = (score: number) => {
    if (score >= 4) return 'text-emerald-600 bg-emerald-50';
    if (score >= 3) return 'text-blue-600 bg-blue-50';
    if (score >= 2) return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
  };

  const getTrendIcon = (cap: string) => {
    const history = state.capabilityHistory.find(h => h.capability === cap);
    if (!history) return <Minus size={14} className="text-surface-400" />;
    if (history.trend === 'improving') return <TrendingUp size={14} className="text-emerald-500" />;
    if (history.trend === 'declining') return <TrendingDown size={14} className="text-red-500" />;
    return <Minus size={14} className="text-surface-400" />;
  };

  return (
    <div className="min-h-screen bg-surface-50">
      <header className="bg-white border-b border-surface-100">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('dashboard')} className="p-2 hover:bg-surface-100 rounded-lg transition-all">
              <ArrowLeft size={18} className="text-surface-600" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-surface-900">Practice Results</h1>
              <p className="text-sm text-surface-400">{interaction?.customer} · {interaction?.name}</p>
            </div>
          </div>
          <button
            onClick={() => navigate('upload', interaction?.id)}
            className="px-4 py-2.5 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-all flex items-center gap-2 text-sm"
          >
            Continue to real interaction
            <ArrowRight size={16} />
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Overall Readiness */}
        <div className="bg-white rounded-2xl border border-surface-100 p-6 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-surface-500 uppercase tracking-wide">Overall Readiness</h2>
            <span className={`text-2xl font-bold ${
              evaluation.overallReadiness >= 70 ? 'text-emerald-600' :
              evaluation.overallReadiness >= 50 ? 'text-amber-600' : 'text-red-600'
            }`}>
              {evaluation.overallReadiness}%
            </span>
          </div>
          <div className="h-3 bg-surface-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                evaluation.overallReadiness >= 70 ? 'bg-emerald-500' :
                evaluation.overallReadiness >= 50 ? 'bg-amber-500' : 'bg-red-500'
              }`}
              style={{ width: `${evaluation.overallReadiness}%` }}
            />
          </div>
          <p className="text-sm text-surface-500 mt-3">
            {evaluation.overallReadiness >= 70
              ? 'You demonstrated strong capability across most areas. Focus on maintaining this level in the real interaction.'
              : evaluation.overallReadiness >= 50
              ? 'Functional performance with clear areas for improvement. Focus on the recommended interventions.'
              : 'Significant gaps identified. Prioritize the recommended practice before the real interaction.'}
          </p>
        </div>

        {/* Capability Scores */}
        <div className="bg-white rounded-2xl border border-surface-100 p-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-sm font-semibold text-surface-500 uppercase tracking-wide mb-4">Capability Assessment</h2>
          <div className="space-y-3">
            {evaluation.capabilityScores.map((cap, idx) => (
              <div key={cap.capability} className="flex items-center gap-4 p-3 rounded-xl bg-surface-50 animate-slide-in" style={{ animationDelay: `${idx * 0.05}s` }}>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-surface-800">{cap.capability}</span>
                    {getTrendIcon(cap.capability)}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getScoreColor(cap.score)}`}>
                      {getLevelLabel(cap.score)}
                    </span>
                  </div>
                  {cap.evidence.length > 0 && (
                    <p className="text-xs text-surface-500 mt-1">
                      <span className="font-medium text-surface-600">Evidence:</span> {cap.evidence[0].statement}
                    </p>
                  )}
                  {cap.weakness && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle size={10} />
                      {cap.weakness}
                    </p>
                  )}
                  {cap.strength && (
                    <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                      <CheckCircle size={10} />
                      {cap.strength}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-surface-800">{cap.score.toFixed(1)}</span>
                  <span className="text-xs text-surface-400">/5</span>
                  <div className="w-20 h-1.5 bg-surface-200 rounded-full mt-1 overflow-hidden">
                    <div
                      className="h-full bg-primary-500 rounded-full"
                      style={{ width: `${(cap.score / 5) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Strengths & Weaknesses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-5 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <h3 className="text-sm font-semibold text-emerald-700 mb-3 flex items-center gap-2">
              <CheckCircle size={14} />
              Strengths
            </h3>
            <ul className="space-y-2">
              {evaluation.strengths.map((s, i) => (
                <li key={i} className="text-sm text-emerald-800 flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">✓</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-red-50 rounded-xl border border-red-100 p-5 animate-fade-in" style={{ animationDelay: '0.25s' }}>
            <h3 className="text-sm font-semibold text-red-700 mb-3 flex items-center gap-2">
              <AlertCircle size={14} />
              Areas to Improve
            </h3>
            <ul className="space-y-2">
              {evaluation.weaknesses.map((w, i) => (
                <li key={i} className="text-sm text-red-800 flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">!</span>
                  {w}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Next Practice */}
        <div className="bg-white rounded-xl border border-surface-100 p-5 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <h3 className="text-sm font-semibold text-surface-700 mb-2">Next Recommended Practice</h3>
          <p className="text-sm text-surface-600 mb-4">{evaluation.nextPractice}</p>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('roleplay', interaction?.id)}
              className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-all flex items-center gap-2"
            >
              <Play size={14} />
              Practice again
            </button>
            <button
              onClick={() => navigate('upload', interaction?.id)}
              className="px-4 py-2 bg-surface-100 text-surface-700 text-sm font-medium rounded-lg hover:bg-surface-200 transition-all flex items-center gap-2"
            >
              I've done the real meeting
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
