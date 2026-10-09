import { Interaction } from '../types';

const stages = ['PREPARE', 'PRACTICE', 'PERFORM', 'ANALYZE', 'IMPROVE'] as const;

function stageFor(status: Interaction['status']): number {
  if (['UPCOMING', 'PREPARING', 'PREPARATION_FAILED'].includes(status)) return 0;
  if (['PREPARED', 'PRACTICING', 'PRACTICE_FAILED'].includes(status)) return 1;
  if (status === 'READY') return 2;
  if (['PERFORMED', 'ANALYZING', 'ANALYSIS_FAILED'].includes(status)) return 3;
  return 4;
}

export default function InteractionContextBar({ interaction }: { interaction?: Interaction }) {
  if (!interaction) return null;
  const current = stageFor(interaction.status);
  return <aside className="bg-slate-900 text-white px-4 py-3" aria-label="Performance moment context">
    <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3">
      <div><strong className="text-sm">{interaction.customer} · {interaction.name}</strong><p className="text-xs text-slate-300">{interaction.stakeholder || 'Stakeholder'} · {interaction.stakeholderRole || interaction.role} · {new Date(interaction.dateTime).toLocaleString()} · Focus: {interaction.focusCapability || 'Objection Handling'}</p></div>
      <ol className="flex flex-wrap items-center gap-2 text-xs" aria-label="Performance timeline">{stages.map((stage, index) => <li key={stage} className={`rounded-full px-2.5 py-1 ${index === current ? 'bg-blue-500 text-white font-bold' : index < current ? 'bg-emerald-700 text-white' : 'bg-slate-700 text-slate-300'}`}>{stage}{index < current ? ' ✓' : ''}</li>)}</ol>
    </div>
  </aside>;
}
