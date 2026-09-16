import { useState, useEffect } from 'react';
import { AppState, PostInteractionAnalysis } from '../types';
import { store } from '../store';
import { analyzeTranscript } from '../ai-service';
import { updateCapabilityHistory } from '../capability-memory';
import { ArrowLeft, Target, CheckCircle, AlertCircle, TrendingUp, ArrowRight, Play, BarChart3, Zap, AlertTriangle } from 'lucide-react';

type Screen = 'login' | 'dashboard' | 'create' | 'brief' | 'roleplay' | 'results' | 'upload' | 'post' | 'capabilities' | 'roadmap';

interface Props {
  state: AppState;
  interactionId: string | null;
  navigate: (screen: Screen, interactionId?: string) => void;
}

export default function PostInteraction({ state, interactionId, navigate }: Props) {
  const [analysis, setAnalysis] = useState<PostInteractionAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const interaction = state.interactions.find(i => i.id === interactionId);
  const transcript = state.transcripts.find(t => t.interactionId === interactionId);

  useEffect(() => {
    if (!interactionId || !interaction) {
      setError('This interaction is no longer available. Return to the dashboard and select it again.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    
    // Check if analysis already exists
    const existing = store.getAnalysisForInteraction(interactionId);
    if (existing) {
      setAnalysis(existing);
      setLoading(false);
      return;
    }

    if (!transcript) {
      setLoading(false);
      return;
    }

    const brief = store.getBriefForInteraction(interactionId);
    if (!brief) {
      setLoading(false);
      return;
    }

    // Generate analysis
    analyzeTranscript(transcript.content, interaction, brief).then(async a => {
      store.addAnalysis(a);
      store.updateInteraction(interactionId, { status: 'analyzed' });
      
      // Update capability history (async with judge validation)
      const updatedHistory = await updateCapabilityHistory(
        state.capabilityHistory,
        a.capabilityDiagnosis,
        `Real interaction: ${interaction.name}`
      );
      store.updateCapabilityHistory(updatedHistory);
      
      setAnalysis(a);
      setLoading(false);
    }).catch(error => {
      console.error('Transcript analysis failed:', error);
      setError('We could not analyze this interaction. The AI provider took too long or was temporarily unavailable.');
      setLoading(false);
    });
  }, [interactionId, interaction, transcript, retryCount]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center">
        <div className="text-center animate-pulse-soft">
          <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4">
            <BarChart3 size={24} className="text-primary-600" />
          </div>
          <p className="text-surface-600 font-medium">Analyzing your interaction...</p>
          <p className="text-sm text-surface-400 mt-1">Comparing plan vs. actual performance</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center p-4">
        <div className="max-w-md bg-white rounded-2xl shadow-lg p-6 text-center">
          <AlertTriangle size={32} className="text-amber-500 mx-auto mb-3" />
          <h1 className="text-lg font-bold text-surface-900">Analysis did not complete</h1>
          <p className="text-sm text-surface-600 mt-2">{error}</p>
          <div className="mt-5 flex justify-center gap-3">
            <button onClick={() => navigate('upload', interactionId || undefined)} className="px-4 py-2 rounded-lg border border-surface-200 text-surface-700">Back</button>
            <button onClick={() => setRetryCount(count => count + 1)} className="px-4 py-2 rounded-lg bg-primary-600 text-white">Retry</button>
          </div>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-surface-600">No analysis available. Please upload a transcript first.</p>
          <button
            onClick={() => navigate('upload', interactionId || undefined)}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg"
          >
            Upload Transcript
          </button>
        </div>
      </div>
    );
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'High': return 'bg-red-100 text-red-700 border-red-200';
      case 'Medium': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Low': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-surface-100 text-surface-600';
    }
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
              <h1 className="text-lg font-bold text-surface-900">Post-Interaction Analysis</h1>
              <p className="text-sm text-surface-400">{interaction?.customer} · {interaction?.name}</p>
            </div>
          </div>
          <button
            onClick={() => navigate('capabilities')}
            className="px-4 py-2.5 bg-surface-100 text-surface-700 font-medium rounded-xl hover:bg-surface-200 transition-all flex items-center gap-2 text-sm"
          >
            <BarChart3 size={16} />
            View capabilities
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Plan vs Actual Table */}
        <div className="bg-white rounded-2xl border border-surface-100 p-6 animate-fade-in">
          <h2 className="text-sm font-semibold text-surface-500 uppercase tracking-wide mb-4 flex items-center gap-2">
            <Target size={14} className="text-primary-500" />
            Plan vs. Actual
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-100">
                  <th className="text-left py-2 px-3 text-surface-500 font-medium">Intended</th>
                  <th className="text-left py-2 px-3 text-surface-500 font-medium">Actual</th>
                  <th className="text-center py-2 px-3 text-surface-500 font-medium">Impact</th>
                </tr>
              </thead>
              <tbody>
                {analysis.planVsActual.map((row, idx) => (
                  <tr key={idx} className="border-b border-surface-50 hover:bg-surface-50 animate-slide-in" style={{ animationDelay: `${idx * 0.05}s` }}>
                    <td className="py-3 px-3 text-surface-700">{row.intended}</td>
                    <td className="py-3 px-3 text-surface-700">{row.actual}</td>
                    <td className="py-3 px-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${getImpactColor(row.impact)}`}>
                        {row.impact}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Impact explanations */}
          <div className="mt-4 space-y-2">
            {analysis.planVsActual.filter(r => r.impact === 'High').map((row, idx) => (
              <div key={idx} className="text-xs text-surface-500 bg-red-50 rounded-lg px-3 py-2 border border-red-100">
                <span className="font-medium text-red-700">Why it matters:</span> {row.explanation}
              </div>
            ))}
          </div>
        </div>

        {/* Likely Impact */}
        <div className="bg-gradient-to-r from-surface-800 to-surface-900 rounded-xl p-5 text-white animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <h3 className="text-sm font-semibold text-surface-300 uppercase tracking-wide mb-2">Overall Assessment</h3>
          <p className="text-sm text-surface-100 leading-relaxed">{analysis.likelyImpact}</p>
        </div>

        {/* Strengths & Missed Opportunities */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-5 animate-fade-in" style={{ animationDelay: '0.15s' }}>
            <h3 className="text-sm font-semibold text-emerald-700 mb-3 flex items-center gap-2">
              <CheckCircle size={14} />
              What Went Well
            </h3>
            <ul className="space-y-2">
              {analysis.strengths.map((s, i) => (
                <li key={i} className="text-sm text-emerald-800 flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">✓</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-amber-50 rounded-xl border border-amber-100 p-5 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <h3 className="text-sm font-semibold text-amber-700 mb-3 flex items-center gap-2">
              <AlertCircle size={14} />
              Missed Opportunities
            </h3>
            <ul className="space-y-2">
              {analysis.missedOpportunities.map((m, i) => (
                <li key={i} className="text-sm text-amber-800 flex items-start gap-2">
                  <span className="text-amber-400 mt-0.5">!</span>
                  {m}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Capability Diagnosis */}
        <div className="bg-white rounded-2xl border border-surface-100 p-6 animate-fade-in" style={{ animationDelay: '0.25s' }}>
          <h2 className="text-sm font-semibold text-surface-500 uppercase tracking-wide mb-4 flex items-center gap-2">
            <BarChart3 size={14} className="text-primary-500" />
            Capability Diagnosis
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {analysis.capabilityDiagnosis
              .sort((a, b) => a.score - b.score)
              .map((cap) => (
              <div key={cap.capability} className="flex items-center gap-3 p-3 rounded-xl bg-surface-50">
                <div className="flex-1">
                  <p className="text-sm font-medium text-surface-800">{cap.capability}</p>
                  {cap.evidence.length > 0 && (
                    <p className="text-xs text-surface-500 mt-0.5">{cap.evidence[0].statement}</p>
                  )}
                </div>
                <div className="text-right">
                  <span className={`text-lg font-bold ${
                    cap.score >= 3.5 ? 'text-emerald-600' : cap.score >= 2.5 ? 'text-amber-600' : 'text-red-600'
                  }`}>
                    {cap.score.toFixed(1)}
                  </span>
                  <span className="text-xs text-surface-400">/5</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Repeated Patterns */}
        {analysis.repeatedPatterns.length > 0 && (
          <div className="bg-violet-50 rounded-xl border border-violet-100 p-5 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <h3 className="text-sm font-semibold text-violet-700 mb-3 flex items-center gap-2">
              <TrendingUp size={14} />
              Patterns Identified
            </h3>
            <ul className="space-y-2">
              {analysis.repeatedPatterns.map((p, i) => (
                <li key={i} className="text-sm text-violet-800 flex items-start gap-2">
                  <span className="text-violet-400 mt-0.5">→</span>
                  {p}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Next Intervention */}
        <div className="bg-white rounded-2xl border-2 border-primary-200 p-6 animate-fade-in" style={{ animationDelay: '0.35s' }}>
          <div className="flex items-center gap-2 mb-3">
            <Zap size={18} className="text-primary-500" />
            <h2 className="text-sm font-semibold text-primary-700 uppercase tracking-wide">Your Next Coaching Action</h2>
          </div>
          <h3 className="text-lg font-bold text-surface-900 mb-2">{analysis.nextIntervention.title}</h3>
          <p className="text-sm text-surface-600 mb-2">{analysis.nextIntervention.description}</p>
          <div className="bg-primary-50 rounded-lg p-3 mb-4">
            <p className="text-sm text-primary-800 font-medium">
              <AlertTriangle size={14} className="inline mr-1.5" />
              Recommended: {analysis.nextIntervention.recommendedAction}
            </p>
            <p className="text-xs text-primary-600 mt-1">Estimated duration: {analysis.nextIntervention.estimatedDuration}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('roleplay', interactionId || undefined)}
              className="px-5 py-2.5 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-200 flex items-center gap-2"
            >
              <Play size={16} />
              Start practice now
            </button>
            <button
              onClick={() => navigate('dashboard')}
              className="px-5 py-2.5 bg-surface-100 text-surface-700 font-medium rounded-xl hover:bg-surface-200 transition-all flex items-center gap-2"
            >
              Back to dashboard
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
