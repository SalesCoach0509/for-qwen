import { ArrowLeft } from 'lucide-react';

type Screen = 'login' | 'dashboard' | 'create' | 'brief' | 'roleplay' | 'results' | 'upload' | 'post' | 'capabilities' | 'roadmap' | 'validation' | 'demo';

export default function BeforeAfterDemo({ navigate }: { navigate: (screen: Screen) => void }) {
  const story = [
    { step: '01', title: 'An important moment is coming', text: 'An employee has an upcoming CFO renewal and a clear outcome to achieve.' },
    { step: '02', title: 'The coach understands the employee', text: 'Relevant observations show where the employee may struggle under commercial pressure. Without evidence, the coach says so.' },
    { step: '03', title: 'Prepare me', text: 'The performance plan combines customer context, the employee’s capability history, and any approved company information.' },
    { step: '04', title: 'Practice this', text: 'The employee rehearses the one moment most likely to challenge them with a dynamic stakeholder.' },
    { step: '05', title: 'Go perform', text: 'The coach summarizes readiness, then the employee has the real customer conversation.' },
    { step: '06', title: 'Show me what happened', text: 'The actual transcript is linked to the same moment and compared with the plan using cited evidence.' },
    { step: '07', title: 'Help me improve', text: 'One diagnosed gap leads to one targeted practice intervention.' },
    { step: '08', title: 'The next moment changes', text: 'The next plan uses what the coach learned from the prior real interaction.' },
  ];

  return <div className="min-h-screen bg-slate-50 text-slate-900">
    <header className="bg-white border-b border-slate-200"><div className="max-w-4xl mx-auto px-5 py-4 flex items-center gap-3"><button onClick={() => navigate('dashboard')} aria-label="Back home" className="p-2 rounded-lg hover:bg-slate-100"><ArrowLeft size={18} /></button><div><h1 className="text-xl font-bold">One complete performance story</h1><p className="text-sm text-slate-500">A five-minute walkthrough of the product loop</p></div></div></header>
    <main className="max-w-4xl mx-auto p-5 md:py-8">
      <div className="rounded-2xl bg-blue-700 text-white p-6 mb-6"><p className="text-sm uppercase tracking-wider text-blue-100">AI Performance Coach</p><h2 className="text-2xl font-bold mt-2">Get better at the work that matters, one performance moment at a time.</h2><p className="mt-3 text-blue-100 text-sm">The example is synthetic. The live app uses the employee’s own interaction context and evidence.</p></div>
      <ol className="grid md:grid-cols-2 gap-4">{story.map(item => <li key={item.step} className="bg-white border border-slate-200 rounded-xl p-5"><span className="text-sm font-bold text-blue-700">{item.step}</span><h3 className="font-bold text-lg mt-2">{item.title}</h3><p className="text-sm text-slate-600 mt-2">{item.text}</p></li>)}</ol>
      <div className="bg-white border border-slate-200 rounded-xl p-6 mt-6"><p className="font-semibold">The product learns from work and changes how it prepares the employee for the next moment.</p><button onClick={() => navigate('create')} className="mt-4 px-5 py-3 bg-blue-600 text-white rounded-lg font-semibold">Try the complete journey</button></div>
    </main>
  </div>;
}
