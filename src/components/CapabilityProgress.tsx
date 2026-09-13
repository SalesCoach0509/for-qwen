import { AppState, CapabilityHistory } from '../types';
import { ArrowLeft, TrendingUp, TrendingDown, Minus, Target, BarChart3 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

type Screen = 'login' | 'dashboard' | 'create' | 'brief' | 'roleplay' | 'results' | 'upload' | 'post' | 'capabilities' | 'roadmap';

interface Props {
  state: AppState;
  navigate: (screen: Screen) => void;
}

export default function CapabilityProgress({ state, navigate }: Props) {
  const capabilities = state.capabilityHistory;
  
  const radarData = capabilities.map(cap => ({
    capability: cap.capability,
    score: cap.currentScore,
    fullMark: 5,
  }));

  const getTrendIcon = (trend: CapabilityHistory['trend']) => {
    switch (trend) {
      case 'improving': return <TrendingUp size={14} className="text-emerald-500" />;
      case 'declining': return <TrendingDown size={14} className="text-red-500" />;
      default: return <Minus size={14} className="text-surface-400" />;
    }
  };

  const getTrendLabel = (trend: CapabilityHistory['trend']) => {
    switch (trend) {
      case 'improving': return 'Improving';
      case 'declining': return 'Declining';
      default: return 'Stable';
    }
  };

  const getLevelLabel = (score: number) => {
    if (score >= 4.5) return 'Advanced';
    if (score >= 3.5) return 'Strong';
    if (score >= 2.5) return 'Functional';
    if (score >= 1.5) return 'Developing';
    return 'Novice';
  };

  const getScoreColor = (score: number) => {
    if (score >= 4) return 'text-emerald-600';
    if (score >= 3) return 'text-blue-600';
    if (score >= 2) return 'text-amber-600';
    return 'text-red-600';
  };

  const getBarColor = (score: number) => {
    if (score >= 4) return 'bg-emerald-500';
    if (score >= 3) return 'bg-blue-500';
    if (score >= 2) return 'bg-amber-500';
    return 'bg-red-500';
  };

  // Generate time series data for the line chart
  const allDates = new Set<string>();
  capabilities.forEach(cap => {
    cap.scores.forEach(s => allDates.add(s.date));
  });
  const sortedDates = Array.from(allDates).sort();

  const lineData = sortedDates.map(date => {
    const point: Record<string, string | number> = { date };
    capabilities.forEach(cap => {
      const scoreEntry = cap.scores.find(s => s.date === date);
      if (scoreEntry) {
        point[cap.capability] = scoreEntry.score;
      }
    });
    return point;
  });

  const overallAvg = capabilities.reduce((sum, c) => sum + c.currentScore, 0) / capabilities.length;

  return (
    <div className="min-h-screen bg-surface-50">
      <header className="bg-white border-b border-surface-100">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('dashboard')} className="p-2 hover:bg-surface-100 rounded-lg transition-all">
              <ArrowLeft size={18} className="text-surface-600" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-surface-900">Capability Progress</h1>
              <p className="text-sm text-surface-400">Your performance development over time</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-surface-100 p-5 animate-fade-in">
            <p className="text-xs text-surface-400 uppercase tracking-wide mb-1">Overall Level</p>
            <p className={`text-3xl font-bold ${getScoreColor(overallAvg)}`}>{overallAvg.toFixed(1)}</p>
            <p className="text-sm text-surface-500">/5 · {getLevelLabel(overallAvg)}</p>
          </div>
          <div className="bg-white rounded-xl border border-surface-100 p-5 animate-fade-in" style={{ animationDelay: '0.05s' }}>
            <p className="text-xs text-surface-400 uppercase tracking-wide mb-1">Capabilities Tracked</p>
            <p className="text-3xl font-bold text-surface-800">{capabilities.length}</p>
            <p className="text-sm text-surface-500">performance dimensions</p>
          </div>
          <div className="bg-white rounded-xl border border-surface-100 p-5 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <p className="text-xs text-surface-400 uppercase tracking-wide mb-1">Improving</p>
            <p className="text-3xl font-bold text-emerald-600">{capabilities.filter(c => c.trend === 'improving').length}</p>
            <p className="text-sm text-surface-500">of {capabilities.length} capabilities</p>
          </div>
        </div>

        {/* Radar Chart */}
        <div className="bg-white rounded-2xl border border-surface-100 p-6 animate-fade-in" style={{ animationDelay: '0.15s' }}>
          <h2 className="text-sm font-semibold text-surface-500 uppercase tracking-wide mb-4 flex items-center gap-2">
            <Target size={14} className="text-primary-500" />
            Capability Profile
          </h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="capability" tick={{ fontSize: 11, fill: '#6b7280' }} />
                <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fontSize: 10 }} />
                <Radar name="Current" dataKey="score" stroke="#4c6ef5" fill="#4c6ef5" fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Progress Over Time */}
        <div className="bg-white rounded-2xl border border-surface-100 p-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-sm font-semibold text-surface-500 uppercase tracking-wide mb-4 flex items-center gap-2">
            <BarChart3 size={14} className="text-primary-500" />
            Progress Over Time
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                <YAxis domain={[0, 5]} tick={{ fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                  labelFormatter={(v) => new Date(v).toLocaleDateString()}
                />
                {capabilities.slice(0, 4).map((cap, idx) => (
                  <Line
                    key={cap.capability}
                    type="monotone"
                    dataKey={cap.capability}
                    stroke={['#4c6ef5', '#12b886', '#f59f00', '#e64980'][idx]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-3 mt-3">
            {capabilities.slice(0, 4).map((cap, idx) => (
              <div key={cap.capability} className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 rounded" style={{ backgroundColor: ['#4c6ef5', '#12b886', '#f59f00', '#e64980'][idx] }} />
                <span className="text-xs text-surface-500">{cap.capability}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Individual Capabilities */}
        <div className="bg-white rounded-2xl border border-surface-100 p-6 animate-fade-in" style={{ animationDelay: '0.25s' }}>
          <h2 className="text-sm font-semibold text-surface-500 uppercase tracking-wide mb-4">Detailed Breakdown</h2>
          <div className="space-y-4">
            {capabilities
              .sort((a, b) => a.currentScore - b.currentScore)
              .map((cap, idx) => (
              <div key={cap.capability} className="p-4 rounded-xl bg-surface-50 animate-slide-in" style={{ animationDelay: `${idx * 0.03}s` }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-surface-800">{cap.capability}</span>
                    {getTrendIcon(cap.trend)}
                    <span className={`text-xs font-medium ${
                      cap.trend === 'improving' ? 'text-emerald-600' : cap.trend === 'declining' ? 'text-red-600' : 'text-surface-500'
                    }`}>
                      {getTrendLabel(cap.trend)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-lg font-bold ${getScoreColor(cap.currentScore)}`}>{cap.currentScore.toFixed(1)}</span>
                    <span className="text-xs text-surface-400">/5</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-surface-200 text-surface-600 font-medium">
                      {getLevelLabel(cap.currentScore)}
                    </span>
                  </div>
                </div>
                <div className="h-2 bg-surface-200 rounded-full overflow-hidden mb-3">
                  <div className={`h-full rounded-full transition-all ${getBarColor(cap.currentScore)}`} style={{ width: `${(cap.currentScore / 5) * 100}%` }} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  {cap.knownWeakness && (
                    <div className="text-red-600">
                      <span className="font-medium">Weakness:</span> {cap.knownWeakness}
                    </div>
                  )}
                  {cap.recentIntervention && (
                    <div className="text-surface-600">
                      <span className="font-medium">Last intervention:</span> {cap.recentIntervention}
                    </div>
                  )}
                  {cap.nextRecommendation && (
                    <div className="text-primary-600">
                      <span className="font-medium">Next:</span> {cap.nextRecommendation}
                    </div>
                  )}
                </div>
                {cap.scores.length > 1 && (
                  <div className="mt-2 flex items-center gap-1">
                    <span className="text-xs text-surface-400">History:</span>
                    {cap.scores.map((s, i) => (
                      <span key={i} className="text-xs text-surface-500 bg-surface-100 px-1.5 py-0.5 rounded">
                        {s.score.toFixed(1)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
