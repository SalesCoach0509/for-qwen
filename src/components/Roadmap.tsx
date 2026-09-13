import { AppState } from '../types';
import { ArrowLeft, Target, Mic, Radio, Brain, Shield, Zap, ArrowRight, Check, Clock, Circle, BarChart3, MessageSquare, Users, TrendingUp, Play, Upload, FileText } from 'lucide-react';

type Screen = 'login' | 'dashboard' | 'create' | 'brief' | 'roleplay' | 'results' | 'upload' | 'post' | 'capabilities' | 'roadmap';

interface Props {
  state: AppState;
  navigate: (screen: Screen) => void;
}

export default function Roadmap({ state, navigate }: Props) {
  return (
    <div className="min-h-screen bg-surface-50">
      <header className="bg-white border-b border-surface-100">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate('dashboard')} className="p-2 hover:bg-surface-100 rounded-lg transition-all">
            <ArrowLeft size={18} className="text-surface-600" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-surface-900">Product Vision & Roadmap</h1>
            <p className="text-sm text-surface-400">From MVP to Live Performance Coach</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Current Capabilities */}
        <section className="animate-fade-in">
          <h2 className="text-xl font-bold text-surface-900 mb-4 flex items-center gap-2">
            <Check size={20} className="text-emerald-500" />
            What This Can Do Today
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <CapabilityCard
              icon={<Target size={18} className="text-primary-500" />}
              title="Smart Preparation"
              description="Generates personalized brain-map briefs from interaction context, adapting to your known weaknesses."
              status="live"
            />
            <CapabilityCard
              icon={<Play size={18} className="text-purple-500" />}
              title="Adaptive Roleplay"
              description="AI becomes your stakeholder with configurable personality, pressure, objections, and hidden priorities."
              status="live"
            />
            <CapabilityCard
              icon={<BarChart3 size={18} className="text-blue-500" />}
              title="Evidence-Based Scoring"
              description="Every capability score backed by specific behavioral evidence with confidence levels."
              status="live"
            />
            <CapabilityCard
              icon={<FileText size={18} className="text-amber-500" />}
              title="Plan vs Actual Analysis"
              description="Compares what you planned to do against what actually happened, with impact ratings."
              status="live"
            />
            <CapabilityCard
              icon={<TrendingUp size={18} className="text-emerald-500" />}
              title="Capability Memory"
              description="Tracks your 8 capabilities over time with trends, weaknesses, interventions, and recommendations."
              status="live"
            />
            <CapabilityCard
              icon={<Zap size={18} className="text-violet-500" />}
              title="Personalized Coaching"
              description="Identifies your single most important improvement area and creates the next intervention."
              status="live"
            />
            <CapabilityCard
              icon={<Shield size={18} className="text-red-500" />}
              title="Safety & Trust"
              description="Never fabricates policy, pricing, or data. Clearly marks unknowns. Evidence-grounded."
              status="live"
            />
            <CapabilityCard
              icon={<Users size={18} className="text-teal-500" />}
              title="Multi-Role Support"
              description="Works for Sales, Customer Success, and Customer Support with the same underlying engine."
              status="live"
            />
            <CapabilityCard
              icon={<MessageSquare size={18} className="text-indigo-500" />}
              title="Pattern Detection"
              description="Identifies repeated behavioral patterns across interactions (e.g., 'discounts too quickly')."
              status="live"
            />
          </div>
        </section>

        {/* The Core Loop */}
        <section className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-xl font-bold text-surface-900 mb-4 flex items-center gap-2">
            <Radio size={20} className="text-primary-500" />
            The Core Performance Loop
          </h2>
          <div className="bg-white rounded-2xl border border-surface-100 p-6">
            <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
              {['Prepare', 'Practice', 'Perform', 'Analyze', 'Coach', 'Improve'].map((step, idx) => (
                <div key={step} className="flex items-center gap-2">
                  <div className={`px-4 py-2 rounded-xl font-medium ${
                    idx === 0 ? 'bg-primary-100 text-primary-700' :
                    idx === 1 ? 'bg-purple-100 text-purple-700' :
                    idx === 2 ? 'bg-amber-100 text-amber-700' :
                    idx === 3 ? 'bg-blue-100 text-blue-700' :
                    idx === 4 ? 'bg-violet-100 text-violet-700' :
                    'bg-emerald-100 text-emerald-700'
                  }`}>
                    {step}
                  </div>
                  {idx < 5 && <ArrowRight size={16} className="text-surface-300" />}
                </div>
              ))}
            </div>
            <p className="text-center text-sm text-surface-500 mt-4">
              This loop runs continuously. Each cycle makes the next one more personalized and effective.
            </p>
          </div>
        </section>

        {/* Roadmap to Live Coach */}
        <section className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-xl font-bold text-surface-900 mb-4 flex items-center gap-2">
            <Mic size={20} className="text-red-500" />
            Path to Live Coach
          </h2>
          <div className="space-y-4">
            <RoadmapPhase
              phase={1}
              title="Real LLM Integration"
              duration="1-2 weeks"
              status="next"
              items={[
                'Replace simulated AI with real OpenAI/Gemini/Qwen calls',
                'Add structured output (JSON mode) for reliable parsing',
                'Implement streaming for real-time response feel',
                'Add provider abstraction layer (swap models without code changes)',
                'Environment-based configuration (.env)',
              ]}
            />
            <RoadmapPhase
              phase={2}
              title="Audio Pipeline"
              duration="3-4 weeks"
              status="planned"
              items={[
                'Streaming transcription via Deepgram / AssemblyAI / local Whisper',
                'WebSocket audio ingestion from meeting platforms',
                'Real-time transcript buffer with speaker diarization',
                'Audio processing pipeline with noise handling',
                'Fallback to post-meeting transcript upload',
              ]}
            />
            <RoadmapPhase
              phase={3}
              title="Context Engine"
              duration="2-3 weeks"
              status="planned"
              items={[
                'Real-time brief matching (compare live words vs preparation)',
                'Capability state tracking during conversation',
                'Intervention trigger logic (when to surface guidance)',
                'Relevance scoring (is this moment important?)',
                'Interruption detection and response timing',
              ]}
            />
            <RoadmapPhase
              phase={4}
              title="Delivery Mechanism"
              duration="3-4 weeks"
              status="planned"
              items={[
                'Browser extension (Chrome/Edge) — side panel during meetings',
                'Progressive disclosure: subtle → card → alert based on priority',
                'Mobile companion app for in-person meetings',
                'Desktop overlay for system-wide audio capture',
                'Meeting bot option (joins as participant)',
              ]}
            />
            <RoadmapPhase
              phase={5}
              title="Enterprise Features"
              duration="4-6 weeks"
              status="future"
              items={[
                'Company knowledge ingestion (products, pricing, SOPs, policies)',
                'Document chunking + embeddings for grounded coaching',
                'Organization-level capability heatmaps',
                'Manager dashboards (with employee consent)',
                'CRM/Calendar integrations (Salesforce, HubSpot)',
                'SSO + enterprise authentication',
              ]}
            />
          </div>
        </section>

        {/* Architecture Diagram */}
        <section className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <h2 className="text-xl font-bold text-surface-900 mb-4 flex items-center gap-2">
            <Brain size={20} className="text-violet-500" />
            Live Coach Architecture
          </h2>
          <div className="bg-white rounded-2xl border border-surface-100 p-6">
            <div className="space-y-4">
              {/* Input Layer */}
              <div className="border border-surface-200 rounded-xl p-4">
                <p className="text-xs font-semibold text-surface-400 uppercase tracking-wide mb-3">Input Layer</p>
                <div className="flex flex-wrap gap-2">
                  {['Meeting Audio', 'Calendar Event', 'CRM Data', 'Company Knowledge'].map(item => (
                    <span key={item} className="px-3 py-1.5 bg-surface-50 border border-surface-200 rounded-lg text-xs font-medium text-surface-600">
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              {/* Processing Layer */}
              <div className="flex justify-center">
                <ArrowRight size={20} className="text-surface-300 rotate-90" />
              </div>
              <div className="border border-primary-200 rounded-xl p-4 bg-primary-50/30">
                <p className="text-xs font-semibold text-primary-500 uppercase tracking-wide mb-3">Processing Engine</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {['Transcription', 'Context Matching', 'Capability Tracking', 'Intervention Triggers'].map(item => (
                    <span key={item} className="px-3 py-1.5 bg-white border border-primary-200 rounded-lg text-xs font-medium text-primary-700 text-center">
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              {/* Intelligence Layer */}
              <div className="flex justify-center">
                <ArrowRight size={20} className="text-surface-300 rotate-90" />
              </div>
              <div className="border border-violet-200 rounded-xl p-4 bg-violet-50/30">
                <p className="text-xs font-semibold text-violet-500 uppercase tracking-wide mb-3">Intelligence Layer</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {['LLM (provider-agnostic)', 'Capability Model', 'Brief Context', 'Employee History', 'Company Knowledge', 'Safety Review'].map(item => (
                    <span key={item} className="px-3 py-1.5 bg-white border border-violet-200 rounded-lg text-xs font-medium text-violet-700 text-center">
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              {/* Output Layer */}
              <div className="flex justify-center">
                <ArrowRight size={20} className="text-surface-300 rotate-90" />
              </div>
              <div className="border border-emerald-200 rounded-xl p-4 bg-emerald-50/30">
                <p className="text-xs font-semibold text-emerald-500 uppercase tracking-wide mb-3">Delivery Layer</p>
                <div className="flex flex-wrap gap-2">
                  {['Browser Extension', 'Mobile Widget', 'Desktop Overlay', 'Slack/Teams DM', 'Post-Meeting Summary'].map(item => (
                    <span key={item} className="px-3 py-1.5 bg-white border border-emerald-200 rounded-lg text-xs font-medium text-emerald-700">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Key Metrics */}
        <section className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <h2 className="text-xl font-bold text-surface-900 mb-4 flex items-center gap-2">
            <Target size={20} className="text-amber-500" />
            Design Principles
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-surface-100 p-5">
              <h3 className="font-semibold text-surface-800 mb-2">Preparation Time</h3>
              <p className="text-2xl font-bold text-primary-600">5-10 min</p>
              <p className="text-sm text-surface-500 mt-1">Brief must be scannable in under 2 minutes</p>
            </div>
            <div className="bg-white rounded-xl border border-surface-100 p-5">
              <h3 className="font-semibold text-surface-800 mb-2">Practice Duration</h3>
              <p className="text-2xl font-bold text-purple-600">5-15 min</p>
              <p className="text-sm text-surface-500 mt-1">Focused, scenario-specific roleplay</p>
            </div>
            <div className="bg-white rounded-xl border border-surface-100 p-5">
              <h3 className="font-semibold text-surface-800 mb-2">Live Nudge Latency</h3>
              <p className="text-2xl font-bold text-amber-600">&lt; 2 sec</p>
              <p className="text-sm text-surface-500 mt-1">From speech to guidance delivery</p>
            </div>
            <div className="bg-white rounded-xl border border-surface-100 p-5">
              <h3 className="font-semibold text-surface-800 mb-2">Hallucination Rate</h3>
              <p className="text-2xl font-bold text-emerald-600">0%</p>
              <p className="text-sm text-surface-500 mt-1">Never fabricates policy, pricing, or data</p>
            </div>
          </div>
        </section>

        {/* What It's NOT */}
        <section className="animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <h2 className="text-xl font-bold text-surface-900 mb-4">What This Is NOT</h2>
          <div className="bg-red-50 rounded-xl border border-red-100 p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[
                'Not an LMS or course marketplace',
                'Not a generic chatbot',
                'Not a meeting transcription tool',
                'Not employee surveillance',
                'Not a sales copilot that replaces you',
                'Not making employment decisions',
                'Not fabricating company policies',
                'Not claiming outcomes without evidence',
              ].map((item, i) => (
                <p key={i} className="text-sm text-red-700 flex items-center gap-2">
                  <span className="text-red-400">✕</span>
                  {item}
                </p>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-8 text-white text-center">
            <h2 className="text-2xl font-bold mb-2">Ready to experience the loop?</h2>
            <p className="text-primary-100 mb-6">Try the full prepare → practice → analyze → coach cycle with demo data.</p>
            <button
              onClick={() => navigate('dashboard')}
              className="px-6 py-3 bg-white text-primary-700 font-semibold rounded-xl hover:bg-primary-50 transition-all shadow-lg inline-flex items-center gap-2"
            >
              <Target size={18} />
              Go to Dashboard
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

function CapabilityCard({ icon, title, description, status }: { icon: React.ReactNode; title: string; description: string; status: 'live' | 'planned' | 'future' }) {
  return (
    <div className="bg-white rounded-xl border border-surface-100 p-4 hover:shadow-md hover:border-surface-200 transition-all">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <h3 className="text-sm font-semibold text-surface-800">{title}</h3>
        {status === 'live' && (
          <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">Live</span>
        )}
      </div>
      <p className="text-xs text-surface-500 leading-relaxed">{description}</p>
    </div>
  );
}

function RoadmapPhase({ phase, title, duration, status, items }: {
  phase: number;
  title: string;
  duration: string;
  status: 'next' | 'planned' | 'future';
  items: string[];
}) {
  const statusConfig = {
    next: { color: 'border-primary-300 bg-primary-50/50', badge: 'bg-primary-600 text-white', icon: <Clock size={14} /> },
    planned: { color: 'border-surface-200 bg-white', badge: 'bg-surface-200 text-surface-600', icon: <Circle size={14} /> },
    future: { color: 'border-surface-100 bg-surface-50/50', badge: 'bg-surface-100 text-surface-500', icon: <Circle size={14} /> },
  };
  const config = statusConfig[status];

  return (
    <div className={`rounded-xl border p-5 ${config.color}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${config.badge}`}>
            {phase}
          </div>
          <div>
            <h3 className="font-semibold text-surface-800">{title}</h3>
            <p className="text-xs text-surface-500">{duration}</p>
          </div>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${config.badge}`}>
          {status === 'next' ? 'Next' : status === 'planned' ? 'Planned' : 'Future'}
        </span>
      </div>
      <ul className="space-y-1.5 ml-11">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-surface-600 flex items-start gap-2">
            <span className="text-surface-300 mt-1">•</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
