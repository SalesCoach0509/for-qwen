import { AppState, Interaction } from '../types';
import { store } from '../store';
import { Target, Calendar, TrendingUp, Clock, ChevronRight, BarChart3, LogOut, Plus, Zap } from 'lucide-react';
import LLMStatus from './LLMStatus';

type Screen = 'login' | 'dashboard' | 'create' | 'brief' | 'roleplay' | 'results' | 'upload' | 'post' | 'capabilities' | 'roadmap' | 'validation' | 'demo';

interface Props {
  state: AppState;
  navigate: (screen: Screen, interactionId?: string) => void;
}

export default function Dashboard({ state, navigate }: Props) {
  const upcomingInteractions = state.interactions.filter(i => i.status === 'upcoming' || i.status === 'prepared' || i.status === 'practiced');
  const analyzedInteractions = state.interactions.filter(i => i.status === 'analyzed');
  
  const topImprovement = state.capabilityHistory
    .filter(c => c.trend === 'improving')
    .sort((a, b) => {
      const aImprovement = a.scores.length >= 2 ? a.scores[a.scores.length - 1].score - a.scores[0].score : 0;
      const bImprovement = b.scores.length >= 2 ? b.scores[b.scores.length - 1].score - b.scores[0].score : 0;
      return bImprovement - aImprovement;
    })[0];

  const nextRecommendation = state.capabilityHistory
    .filter(c => c.nextRecommendation)
    .sort((a, b) => a.currentScore - b.currentScore)[0];

  const handleLogout = () => {
    store.logout();
    navigate('login');
  };

  const getStatusColor = (status: Interaction['status']) => {
    switch (status) {
      case 'upcoming': return 'bg-amber-100 text-amber-700';
      case 'prepared': return 'bg-blue-100 text-blue-700';
      case 'practiced': return 'bg-purple-100 text-purple-700';
      case 'performed': return 'bg-green-100 text-green-700';
      case 'analyzed': return 'bg-emerald-100 text-emerald-700';
      default: return 'bg-surface-100 text-surface-600';
    }
  };

  const getNextAction = (interaction: Interaction) => {
    switch (interaction.status) {
      case 'upcoming': return { label: 'Prepare me', screen: 'brief' as Screen };
      case 'prepared': return { label: 'Practice', screen: 'roleplay' as Screen };
      case 'practiced': return { label: 'Upload transcript', screen: 'upload' as Screen };
      case 'performed': return { label: 'Analyze', screen: 'upload' as Screen };
      case 'analyzed': return { label: 'View results', screen: 'post' as Screen };
      default: return { label: 'View', screen: 'brief' as Screen };
    }
  };

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Header */}
      <header className="bg-white border-b border-surface-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center">
              <Target size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-surface-900">Performance Coach</h1>
              <p className="text-xs text-surface-400">Welcome, {state.user?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LLMStatus />
            <button
              onClick={() => navigate('roadmap')}
              className="px-3 py-2 text-sm text-surface-600 hover:text-surface-800 hover:bg-surface-100 rounded-lg transition-all flex items-center gap-1.5"
            >
              <Zap size={15} />
              Vision
            </button>
            <button
              onClick={() => navigate('capabilities')}
              className="px-3 py-2 text-sm text-surface-600 hover:text-surface-800 hover:bg-surface-100 rounded-lg transition-all flex items-center gap-1.5"
            >
              <BarChart3 size={15} />
              Capabilities
            </button>
            <button
              onClick={() => navigate('validation')}
              className="px-3 py-2 text-sm text-surface-600 hover:text-surface-800 hover:bg-surface-100 rounded-lg transition-all flex items-center gap-1.5"
            >
              <Target size={15} />
              Validation
            </button>
            <button
              onClick={() => navigate('demo')}
              className="px-3 py-2 text-sm text-surface-600 hover:text-surface-800 hover:bg-surface-100 rounded-lg transition-all flex items-center gap-1.5"
            >
              <TrendingUp size={15} />
              Demo
            </button>
            <button
              onClick={handleLogout}
              className="px-3 py-2 text-sm text-surface-500 hover:text-surface-700 hover:bg-surface-100 rounded-lg transition-all flex items-center gap-1.5"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Primary CTA */}
        {upcomingInteractions.length === 0 && (
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-8 text-white shadow-xl shadow-primary-200 animate-fade-in">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">What do you have coming up?</h2>
                <p className="text-primary-100 mb-6">Create an interaction and let your coach help you prepare.</p>
                <button
                  onClick={() => navigate('create')}
                  className="px-6 py-3 bg-white text-primary-700 font-semibold rounded-xl hover:bg-primary-50 transition-all shadow-lg flex items-center gap-2"
                >
                  <Plus size={18} />
                  Prepare for my next interaction
                </button>
              </div>
              <Zap size={48} className="text-primary-300 opacity-50" />
            </div>
          </div>
        )}

        {/* Upcoming Interactions */}
        {upcomingInteractions.length > 0 && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-surface-900 flex items-center gap-2">
                <Calendar size={18} className="text-primary-500" />
                Upcoming Interactions
              </h2>
              <button
                onClick={() => navigate('create')}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
              >
                <Plus size={14} />
                New interaction
              </button>
            </div>
            <div className="space-y-3">
              {upcomingInteractions.map((interaction, idx) => {
                const action = getNextAction(interaction);
                return (
                  <div
                    key={interaction.id}
                    className="bg-white rounded-xl border border-surface-100 p-5 hover:shadow-md hover:border-surface-200 transition-all animate-fade-in"
                    style={{ animationDelay: `${idx * 0.05}s` }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-surface-900">{interaction.name}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(interaction.status)}`}>
                            {interaction.status}
                          </span>
                        </div>
                        <p className="text-sm text-surface-500">{interaction.customer} · {interaction.role}</p>
                        <p className="text-xs text-surface-400 mt-1">
                          {new Date(interaction.dateTime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                        </p>
                      </div>
                      <button
                        onClick={() => navigate(action.screen, interaction.id)}
                        className="px-4 py-2 bg-primary-50 text-primary-700 font-medium text-sm rounded-lg hover:bg-primary-100 transition-all flex items-center gap-1.5"
                      >
                        {action.label}
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Coaching Focus & Progress */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Current Focus */}
          {nextRecommendation && (
            <div className="bg-white rounded-xl border border-surface-100 p-5 animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <h3 className="text-sm font-semibold text-surface-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                <Zap size={14} className="text-amber-500" />
                Coaching Focus
              </h3>
              <p className="text-surface-800 font-medium mb-1">{nextRecommendation.capability}</p>
              <p className="text-sm text-surface-500">{nextRecommendation.nextRecommendation}</p>
              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 h-2 bg-surface-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-500 rounded-full transition-all"
                    style={{ width: `${(nextRecommendation.currentScore / 5) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-surface-500">{nextRecommendation.currentScore.toFixed(1)}/5</span>
              </div>
            </div>
          )}

          {/* Recent Improvement */}
          {topImprovement && (
            <div className="bg-white rounded-xl border border-surface-100 p-5 animate-fade-in" style={{ animationDelay: '0.15s' }}>
              <h3 className="text-sm font-semibold text-surface-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                <TrendingUp size={14} className="text-emerald-500" />
                Recent Improvement
              </h3>
              <p className="text-surface-800 font-medium mb-1">{topImprovement.capability}</p>
              <p className="text-sm text-surface-500">
                {topImprovement.scores.length >= 2 && (
                  <>
                    {topImprovement.scores[0].score.toFixed(1)} → {topImprovement.scores[topImprovement.scores.length - 1].score.toFixed(1)} over {topImprovement.scores.length} observations
                  </>
                )}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full">
                  ↑ Improving
                </span>
                <span className="text-xs text-surface-400">{topImprovement.scores.length} data points</span>
              </div>
            </div>
          )}
        </div>

        {/* Previous Interactions */}
        {analyzedInteractions.length > 0 && (
          <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <h2 className="text-lg font-bold text-surface-900 mb-4 flex items-center gap-2">
              <Clock size={18} className="text-surface-400" />
              Recent Analyses
            </h2>
            <div className="space-y-2">
              {analyzedInteractions.slice(-3).reverse().map(interaction => (
                <div
                  key={interaction.id}
                  className="bg-white rounded-xl border border-surface-100 p-4 flex items-center justify-between hover:shadow-sm transition-all cursor-pointer"
                  onClick={() => navigate('post', interaction.id)}
                >
                  <div>
                    <p className="font-medium text-surface-800">{interaction.name}</p>
                    <p className="text-sm text-surface-500">{interaction.customer} · Analyzed {new Date(interaction.createdAt).toLocaleDateString()}</p>
                  </div>
                  <ChevronRight size={16} className="text-surface-300" />
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
