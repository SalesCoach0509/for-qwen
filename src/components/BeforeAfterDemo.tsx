import { beforeDemoEvaluation, afterDemoEvaluation, demoCapabilityImprovement } from '../data/before-after-demo';
import { ArrowLeft, TrendingUp, CheckCircle, AlertCircle, Play } from 'lucide-react';

type Screen = 'login' | 'dashboard' | 'create' | 'brief' | 'roleplay' | 'results' | 'upload' | 'post' | 'capabilities' | 'roadmap' | 'validation' | 'demo';

interface Props {
  navigate: (screen: Screen) => void;
}

export default function BeforeAfterDemo({ navigate }: Props) {
  return (
    <div className="min-h-screen bg-surface-50">
      <header className="bg-white border-b border-surface-100">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate('dashboard')} className="p-2 hover:bg-surface-100 rounded-lg transition-all">
            <ArrowLeft size={18} className="text-surface-600" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-surface-900">BEFORE vs AFTER Demo</h1>
            <p className="text-sm text-surface-400">See how the coach improves performance</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Intro */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white animate-fade-in">
          <h2 className="text-xl font-bold mb-2">The Performance Loop in Action</h2>
          <p className="text-primary-100">
            This demo shows an employee's journey from struggling with price objections to handling them effectively.
            The AI coach identifies the weakness, provides targeted practice, and tracks improvement over time.
          </p>
          <p className="text-xs text-primary-200 mt-3">
            ⚠️ This is demonstration data showing the product's capability. Real users would see their own actual performance data.
          </p>
        </div>

        {/* BEFORE */}
        <div className="bg-white rounded-2xl border-2 border-red-200 p-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle size={24} className="text-red-500" />
            <h2 className="text-xl font-bold text-red-700">BEFORE: First Practice Session</h2>
          </div>
          
          <div className="mb-4 p-4 bg-red-50 rounded-xl border border-red-100">
            <p className="text-sm font-semibold text-red-700 mb-2">Scenario: CFO raises price objection</p>
            <div className="space-y-2 text-sm">
              <p><span className="font-semibold">CFO:</span> "Your pricing is too high. We're looking at other options."</p>
              <p><span className="font-semibold text-red-600">Employee:</span> "I can offer you a 15% discount right now if you sign today."</p>
              <p><span className="font-semibold">CFO:</span> "That's interesting, but we got a quote 30% less."</p>
              <p><span className="font-semibold text-red-600">Employee:</span> "I can go up to 20% off."</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-semibold text-surface-700 mb-2">Objection Handling Score</p>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold text-red-600">{beforeDemoEvaluation.capabilityScores[0].score.toFixed(1)}</span>
                <span className="text-sm text-surface-500">/5 (Level 1: Novice)</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-surface-700 mb-2">Overall Readiness</p>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold text-red-600">{beforeDemoEvaluation.overallReadiness}%</span>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-sm font-semibold text-surface-700 mb-2">Diagnosis</p>
            <ul className="space-y-1">
              {beforeDemoEvaluation.weaknesses.map((w, i) => (
                <li key={i} className="text-sm text-red-700 flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">✗</span>
                  {w}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-sm font-semibold text-amber-800 mb-1">📋 Next Intervention</p>
            <p className="text-sm text-amber-700">{beforeDemoEvaluation.nextPractice}</p>
          </div>
        </div>

        {/* Arrow */}
        <div className="flex justify-center">
          <div className="bg-primary-100 rounded-full p-4">
            <TrendingUp size={32} className="text-primary-600" />
          </div>
        </div>

        {/* INTERVENTION */}
        <div className="bg-white rounded-2xl border border-surface-200 p-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-xl font-bold text-surface-900 mb-4 flex items-center gap-2">
            <Play size={20} className="text-primary-500" />
            Targeted Practice (3 sessions over 2 weeks)
          </h2>
          <ul className="space-y-2">
            {demoCapabilityImprovement.interventions.map((intervention, i) => (
              <li key={i} className="text-sm text-surface-700 flex items-start gap-2">
                <span className="text-primary-500 mt-0.5">✓</span>
                {intervention}
              </li>
            ))}
          </ul>
        </div>

        {/* Arrow */}
        <div className="flex justify-center">
          <div className="bg-emerald-100 rounded-full p-4">
            <TrendingUp size={32} className="text-emerald-600" />
          </div>
        </div>

        {/* AFTER */}
        <div className="bg-white rounded-2xl border-2 border-emerald-200 p-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle size={24} className="text-emerald-500" />
            <h2 className="text-xl font-bold text-emerald-700">AFTER: After Targeted Practice</h2>
          </div>
          
          <div className="mb-4 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
            <p className="text-sm font-semibold text-emerald-700 mb-2">Scenario: CFO raises price objection (same situation)</p>
            <div className="space-y-2 text-sm">
              <p><span className="font-semibold">CFO:</span> "Your pricing is too high. We're looking at other options."</p>
              <p><span className="font-semibold text-emerald-600">Employee:</span> "I understand pricing is a concern. Can you help me understand what's driving that? Is it the total cost, or are you comparing to a specific alternative?"</p>
              <p><span className="font-semibold">CFO:</span> "We got a quote from DataFlow Pro for 30% less."</p>
              <p><span className="font-semibold text-emerald-600">Employee:</span> "I appreciate you sharing that. Before we discuss pricing, can I ask — what's the business impact of the limitations you're experiencing? If we could eliminate those issues, what would that be worth?"</p>
              <p><span className="font-semibold">CFO:</span> "That's... actually a fair point. We're losing about $200K per year."</p>
              <p><span className="font-semibold text-emerald-600">Employee:</span> "So if we can deliver $200K in annual savings, and our solution is $240K per year, that's a strong ROI. Let me also show you what you'd lose if you switched..."</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-semibold text-surface-700 mb-2">Objection Handling Score</p>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold text-emerald-600">{afterDemoEvaluation.capabilityScores[0].score.toFixed(1)}</span>
                <span className="text-sm text-surface-500">/5 (Level 4: Strong)</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-surface-700 mb-2">Overall Readiness</p>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold text-emerald-600">{afterDemoEvaluation.overallReadiness}%</span>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-sm font-semibold text-surface-700 mb-2">What Improved</p>
            <ul className="space-y-1">
              {afterDemoEvaluation.strengths.map((s, i) => (
                <li key={i} className="text-sm text-emerald-700 flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">✓</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Capability Improvement */}
        <div className="bg-white rounded-2xl border border-surface-200 p-6 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <h2 className="text-xl font-bold text-surface-900 mb-4">Capability Improvement Over Time</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-red-50 rounded-xl">
              <p className="text-sm text-surface-600 mb-1">Before</p>
              <p className="text-2xl font-bold text-red-600">{demoCapabilityImprovement.before.score}/5</p>
              <p className="text-xs text-surface-500">{demoCapabilityImprovement.before.label}</p>
            </div>
            <div className="text-center p-4 bg-primary-50 rounded-xl">
              <p className="text-sm text-surface-600 mb-1">Improvement</p>
              <p className="text-2xl font-bold text-primary-600">{demoCapabilityImprovement.improvement}</p>
              <p className="text-xs text-surface-500">Over {demoCapabilityImprovement.interventions.length} interventions</p>
            </div>
            <div className="text-center p-4 bg-emerald-50 rounded-xl">
              <p className="text-sm text-surface-600 mb-1">After</p>
              <p className="text-2xl font-bold text-emerald-600">{demoCapabilityImprovement.after.score}/5</p>
              <p className="text-xs text-surface-500">{demoCapabilityImprovement.after.label}</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white text-center animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <h2 className="text-xl font-bold mb-2">Ready to see your own improvement?</h2>
          <p className="text-primary-100 mb-4">
            The AI coach will identify your specific weaknesses and help you improve through targeted practice.
          </p>
          <button
            onClick={() => navigate('create')}
            className="px-6 py-3 bg-white text-primary-700 font-semibold rounded-xl hover:bg-primary-50 transition-all shadow-lg inline-flex items-center gap-2"
          >
            Try It Yourself
          </button>
        </div>
      </main>
    </div>
  );
}
