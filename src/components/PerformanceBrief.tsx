import { useState, useEffect } from 'react';
import { AppState, PreparationBrief } from '../types';
import { store } from '../store';
import { generateBrief } from '../ai-service';
import { ArrowLeft, Target, Users, AlertTriangle, MessageCircle, Shield, Brain, Clock, Play, ChevronDown, ChevronUp, Lightbulb, Ban } from 'lucide-react';

type Screen = 'login' | 'dashboard' | 'create' | 'brief' | 'roleplay' | 'results' | 'upload' | 'post' | 'capabilities' | 'roadmap';

interface Props {
  state: AppState;
  interactionId: string | null;
  navigate: (screen: Screen, interactionId?: string) => void;
}

export default function PerformanceBrief({ state, interactionId, navigate }: Props) {
  const [brief, setBrief] = useState<PreparationBrief | null>(null);
  const [loading, setLoading] = useState(true);

  const interaction = state.interactions.find(i => i.id === interactionId);

  useEffect(() => {
    if (!interactionId || !interaction) return;
    
    // Check if brief already exists
    const existing = store.getBriefForInteraction(interactionId);
    if (existing) {
      setBrief(existing);
      setLoading(false);
      return;
    }

    // Generate new brief with capability history for personalization
    generateBrief(interaction, state.capabilityHistory).then(b => {
      store.addBrief(b);
      store.updateInteraction(interactionId, { status: 'prepared' });
      setBrief(b);
      setLoading(false);
    });
  }, [interactionId, interaction]);



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
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('dashboard')} className="p-2 hover:bg-surface-100 rounded-lg transition-all">
              <ArrowLeft size={18} className="text-surface-600" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-surface-900">Pre-Performance Brief</h1>
              <p className="text-sm text-surface-400">{interaction?.customer} · {interaction?.name}</p>
            </div>
          </div>
          <button
            onClick={() => navigate('roleplay', interactionId || undefined)}
            className="px-5 py-2.5 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-200 flex items-center gap-2"
          >
            <Play size={16} />
            Practice this interaction
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Brain Map Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
          {/* Objective - Full Width */}
          <div className="md:col-span-2 bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white shadow-xl shadow-primary-200">
            <div className="flex items-center gap-2 mb-3">
              <Target size={18} className="text-primary-200" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-primary-200">Meeting Objective</h2>
            </div>
            <p className="text-lg font-medium leading-relaxed">{brief.objective}</p>
            <p className="text-sm text-primary-200 mt-3">Success = {interaction?.objective || 'Achieve stated goals with strong next steps'}</p>
          </div>

          {/* Stakeholder Priorities */}
          <BriefCard
            icon={<Users size={16} className="text-blue-500" />}
            title="Stakeholder Priorities"
            items={brief.stakeholderPriorities}
            color="blue"
          />

          {/* Relevant Context */}
          <BriefCard
            icon={<Lightbulb size={16} className="text-amber-500" />}
            title="Key Context"
            items={brief.relevantContext}
            color="amber"
          />

          {/* Likely Objections */}
          <BriefCard
            icon={<AlertTriangle size={16} className="text-red-500" />}
            title="Likely Objections"
            items={brief.likelyObjections}
            color="red"
          />

          {/* Recommended Questions */}
          <BriefCard
            icon={<MessageCircle size={16} className="text-emerald-500" />}
            title="Recommended Questions"
            items={brief.recommendedQuestions}
            color="emerald"
          />

          {/* Recommended Positioning */}
          <BriefCard
            icon={<Target size={16} className="text-purple-500" />}
            title="Positioning"
            items={brief.recommendedPositioning}
            color="purple"
          />

          {/* Things to Avoid */}
          <BriefCard
            icon={<Ban size={16} className="text-rose-500" />}
            title="Things to Avoid"
            items={brief.thingsToAvoid}
            color="rose"
          />

          {/* Commercial Guidance - Full Width */}
          <div className="md:col-span-2 bg-white rounded-xl border border-surface-100 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Shield size={16} className="text-surface-500" />
              <h3 className="text-sm font-semibold text-surface-700">Commercial Guidance</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-surface-400 mb-1">Discount Limits</p>
                <p className="text-sm text-surface-700">{brief.commercialGuidance.discountLimits}</p>
              </div>
              <div>
                <p className="text-xs text-surface-400 mb-1">Relevant Package</p>
                <p className="text-sm text-surface-700">{brief.commercialGuidance.relevantPackage}</p>
              </div>
              <div>
                <p className="text-xs text-surface-400 mb-1">Trade-offs to Consider</p>
                <ul className="text-sm text-surface-700 space-y-1">
                  {brief.commercialGuidance.tradeOffs.map((t, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-surface-300 mt-1">•</span>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs text-surface-400 mb-1">Escalation Items</p>
                <ul className="text-sm text-surface-700 space-y-1">
                  {brief.commercialGuidance.escalationItems.map((t, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-surface-300 mt-1">•</span>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mt-3">
              ⚠️ {brief.commercialGuidance.note}
            </p>
          </div>

          {/* Personal Coaching Focus - Full Width */}
          <div className="md:col-span-2 bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl border border-violet-100 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Brain size={16} className="text-violet-500" />
              <h3 className="text-sm font-semibold text-violet-700">Your Personal Coaching Focus</h3>
            </div>
            <p className="text-sm text-violet-800 leading-relaxed">{brief.personalCoachingFocus}</p>
          </div>

          {/* Practice Recommendation - Full Width */}
          <div className="md:col-span-2 bg-white rounded-xl border border-surface-100 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Clock size={16} className="text-primary-500" />
              <h3 className="text-sm font-semibold text-surface-700">Recommended Practice (5-10 minutes)</h3>
            </div>
            <p className="text-sm text-surface-700 leading-relaxed">{brief.practiceRecommendation}</p>
            <button
              onClick={() => navigate('roleplay', interactionId || undefined)}
              className="mt-4 px-5 py-2.5 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-200 flex items-center gap-2"
            >
              <Play size={16} />
              Start Practice Session
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

function BriefCard({ icon, title, items, color }: { icon: React.ReactNode; title: string; items: string[]; color: string }) {
  const [expanded, setExpanded] = useState(false);
  const displayItems = expanded ? items : items.slice(0, 3);
  const hasMore = items.length > 3;

  const bgColors: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-100',
    amber: 'bg-amber-50 border-amber-100',
    red: 'bg-red-50 border-red-100',
    emerald: 'bg-emerald-50 border-emerald-100',
    purple: 'bg-purple-50 border-purple-100',
    rose: 'bg-rose-50 border-rose-100',
  };

  return (
    <div className={`rounded-xl border p-5 ${bgColors[color] || 'bg-white border-surface-100'}`}>
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h3 className="text-sm font-semibold text-surface-700">{title}</h3>
      </div>
      <ul className="space-y-2">
        {displayItems.map((item, i) => (
          <li key={i} className="text-sm text-surface-700 flex items-start gap-2">
            <span className="text-surface-400 mt-0.5 text-xs">●</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-2 text-xs text-surface-500 hover:text-surface-700 flex items-center gap-1"
        >
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          {expanded ? 'Show less' : `${items.length - 3} more`}
        </button>
      )}
    </div>
  );
}
