import { useState, useEffect } from 'react';
import { AppState, PreparationBrief } from '../types';
import { store } from '../store';
import { generateBrief } from '../ai-service';
import { ArrowLeft, Brain, Play } from 'lucide-react';
import PlanContent from './PlanContent';

type Screen = 'login' | 'dashboard' | 'create' | 'brief' | 'scenario' | 'roleplay' | 'results' | 'upload' | 'post' | 'capabilities' | 'roadmap';

interface Props {
  state: AppState;
  interactionId: string | null;
  navigate: (screen: Screen, interactionId?: string) => void;
}

export default function PerformanceBrief({ state, interactionId, navigate }: Props) {
  const [brief, setBrief] = useState<PreparationBrief | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const interaction = state.interactions.find(i => i.id === interactionId);

  useEffect(() => {
    if (!interactionId || !interaction) { setLoading(false); return; }
    
    // Check if brief already exists
    const existing = store.getBriefForInteraction(interactionId);
    if (existing) {
      setBrief(existing);
      setLoading(false);
      store.recordProductEvent('PREPARATION_VIEWED', interactionId);
      return;
    }

    // Generate new brief with capability history for personalization
    let active = true;
    if (interaction.status !== 'PREPARING') store.transitionInteraction(interactionId, 'PREPARING');
    const previous = [...state.analyses].reverse().find(a => a.interactionId !== interactionId && a.capabilityDiagnosis.some(c => c.evidence.length > 0));
    const priorLearning = previous ? [previous.missedOpportunities[0] || previous.strengths[0], previous.nextIntervention.recommendedAction, previous.nextIntervention.successCriterion].filter(Boolean).join(' · ') : undefined;
    generateBrief(interaction, state.capabilityHistory, state.companyContext, priorLearning).then(b => {
      if (!active) return;
      store.addBrief(b);
      store.transitionInteraction(interactionId, 'PREPARED');
      setBrief(b);
      store.recordProductEvent('PREPARATION_VIEWED', interactionId);
    }).catch(e => {
      if (!active) return;
      store.transitionInteraction(interactionId, 'PREPARATION_FAILED');
      setError(e instanceof Error ? e.message : 'Preparation failed.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [interactionId]);



  if (!loading && !brief) return <div className="min-h-screen bg-surface-50 flex items-center justify-center"><div className="bg-white p-6 rounded-xl max-w-md"><h1 className="text-xl font-bold">Performance plan unavailable</h1><p className="text-sm mt-2">{error || 'This performance moment could not be found.'}</p><button onClick={() => navigate('dashboard')} className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg">Return home</button></div></div>;

  if (loading || !brief) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center">
        <div className="text-center animate-pulse-soft">
          <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4">
            <Brain size={24} className="text-primary-600" />
          </div>
          <p className="text-surface-600 font-medium">Preparing your brief...</p>
          <p className="text-sm text-surface-400 mt-1">Analyzing context and your capability profile</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50">
      <header className="bg-white border-b border-surface-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('dashboard')} className="p-2 hover:bg-surface-100 rounded-lg transition-all">
              <ArrowLeft size={18} className="text-surface-600" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-surface-900">Performance Plan</h1>
              <p className="text-sm text-surface-400">{interaction?.customer} · {interaction?.name}</p>
            </div>
          </div>
          <button
            onClick={() => navigate('roleplay', interactionId || undefined)}
            className="w-full sm:w-auto px-5 py-2.5 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-200 flex items-center justify-center gap-2"
          >
            <Play size={16} />
            Practice this moment
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6"><PlanContent brief={brief} />
      <div className="flex flex-wrap gap-3 mt-5"><button className="px-5 py-3 rounded-xl bg-primary-600 text-white" onClick={()=>navigate('roleplay',interactionId||undefined)}>Practice this moment</button><button className="px-5 py-3 rounded-xl border" onClick={()=>navigate('scenario',interactionId||undefined)}>Customize practice scenario</button><button className="px-5 py-3 rounded-xl border" onClick={()=>navigate('upload',interactionId||undefined)}>Add real performance</button></div>
      </main>
    </div>
  );
}
