import { useMemo, useState } from 'react';
import { AlertCircle, ArrowLeft, ChevronRight, Loader2, ShieldAlert, Sparkles, Target, Users } from 'lucide-react';
import { generateScenarioPlan } from '../ai-service';
import { store } from '../store';
import { AppState, DealIntelligence, PracticeModule, ScenarioPlan } from '../types';

type Screen = 'dashboard' | 'brief' | 'roleplay' | 'post' | 'scenario';

interface ScenarioPlannerProps {
  state: AppState;
  interactionId?: string;
  navigate: (screen: Screen, interactionId?: string) => void;
}

const moduleOptions: Array<{ value: PracticeModule; title: string; description: string }> = [
  { value: 'discovery', title: 'Discovery & qualification', description: 'Uncover business impact, stakeholders, urgency and a credible next step.' },
  { value: 'negotiation', title: 'Objections & commercial', description: 'Handle value, competition, procurement and discount pressure without giving ground away.' },
  { value: 'renewal-expansion', title: 'Renewal & expansion', description: 'Protect renewal value, prove outcomes and find expansion paths.' },
];

const demoDeals: Record<PracticeModule, Omit<DealIntelligence, 'module' | 'difficulty'>> = {
  discovery: {
    dealStage: 'Discovery', dealValue: '$180,000 ARR', contractTerm: '12-month subscription',
    solution: 'Revenue intelligence platform', buyerRole: 'VP Sales Operations',
    buyerContext: 'Owns forecast accuracy and CRM adoption across a 240-person sales team.',
    triggerEvent: 'New CRO requires a credible forecast before the next board meeting.',
    businessImpact: 'Forecast misses have created a $1.2M pipeline coverage gap and executive risk.',
    stakeholderMap: 'Champion: RevOps director; economic buyer: CRO; evaluator: IT; blocker: Finance.',
    competition: 'Status quo spreadsheets and a lower-cost point solution.',
    commercialContext: 'Budget is unapproved; buyer wants a business case before involving Finance.',
    sellerObjective: 'Quantify the forecast problem, map the decision process, and secure a value-discovery workshop.',
    desiredNextStep: 'Book a 45-minute discovery workshop with RevOps, CRO staff, and IT.',
    knownFacts: 'Board meeting is in six weeks\nForecast accuracy is a CRO priority\nIT must review data access',
    unknowns: 'Current cost of forecast misses\nEvaluation criteria\nFinance approval threshold',
  },
  negotiation: {
    dealStage: 'Negotiation', dealValue: '$240,000 ARR', contractTerm: '24-month agreement',
    solution: 'Enterprise customer analytics platform', buyerRole: 'Chief Financial Officer',
    buyerContext: 'Accountable for margin protection and requires a quantified investment case.',
    triggerEvent: 'Procurement has requested a final commercial proposal before quarter end.',
    businessImpact: 'Manual reporting consumes 4,000 analyst hours annually and slows renewal-risk decisions.',
    stakeholderMap: 'Champion: VP Customer Success; economic buyer: CFO; procurement: sourcing lead; legal: counsel.',
    competition: 'Incumbent BI stack plus a competitor quoted at a lower headline price.',
    commercialContext: 'Buyer asks for 20% discount; seller authority is 10% only with a two-year term.',
    sellerObjective: 'Protect commercial value, understand the competitor comparison, and trade rather than concede.',
    desiredNextStep: 'Agree commercial give-get principles and schedule a procurement working session.',
    knownFacts: 'Customer wants to decide this quarter\nChampion supports the solution\nProcurement is comparing headline price',
    unknowns: 'Competitor scope and exclusions\nCFO success metric\nWhether a multi-year term is acceptable',
  },
  'renewal-expansion': {
    dealStage: 'Renewal', dealValue: '$320,000 ARR renewal + $90,000 expansion', contractTerm: 'Renewal due in 90 days',
    solution: 'Customer success and adoption platform', buyerRole: 'VP Customer Success',
    buyerContext: 'Owns retention, expansion, and adoption across strategic accounts.',
    triggerEvent: 'Renewal planning has started after uneven adoption in two business units.',
    businessImpact: 'At-risk accounts represent $2.4M in revenue; expansion depends on proving adoption impact.',
    stakeholderMap: 'Champion: CS operations leader; economic buyer: VP CS; procurement: sourcing; executive sponsor: COO.',
    competition: 'Incumbent is in place; customer may consolidate tools at renewal.',
    commercialContext: 'Customer seeks flat pricing; expansion requires a documented adoption and ROI plan.',
    sellerObjective: 'Validate realized value, surface renewal risk early, and earn an expansion discovery session.',
    desiredNextStep: 'Run an executive value review and confirm renewal decision criteria.',
    knownFacts: 'Renewal is due in 90 days\nTwo teams have low adoption\nCOO wants retention-risk visibility',
    unknowns: 'Renewal budget owner\nAdoption root cause\nExpansion decision process',
  },
};

function readPlanList(value: string): string[] {
  return value.split(/\n|,/).map(item => item.trim()).filter(Boolean);
}

function listText(value: unknown): string {
  return Array.isArray(value) ? value.filter(item => typeof item === 'string').join('\n') : '';
}

function planList(value: unknown, fallback: string[] = []): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : fallback;
}

export function ScenarioPlanner({ state, interactionId, navigate }: ScenarioPlannerProps) {
  const interaction = useMemo(
    () => state.interactions.find(item => item.id === interactionId),
    [state.interactions, interactionId],
  );
  const brief = useMemo(
    () => state.briefs.find(item => item.interactionId === interactionId),
    [state.briefs, interactionId],
  );
  const existing = interaction?.scenarioPlan;
  const [plan, setPlan] = useState<ScenarioPlan | undefined>(existing);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deal, setDeal] = useState<DealIntelligence>(() => {
    const savedDeal = existing?.dealIntelligence;
    const module = savedDeal?.module || existing?.module || 'discovery';
    return {
      ...demoDeals[module],
      ...savedDeal,
      module,
      buyerRole: savedDeal?.buyerRole || existing?.stakeholderRole || demoDeals[module].buyerRole,
      sellerObjective: savedDeal?.sellerObjective || interaction?.objective || demoDeals[module].sellerObjective,
      desiredNextStep: savedDeal?.desiredNextStep || existing?.desiredOutcome || demoDeals[module].desiredNextStep,
      knownFacts: savedDeal?.knownFacts || listText(existing?.knownFacts) || demoDeals[module].knownFacts,
      unknowns: savedDeal?.unknowns || listText(existing?.unknowns) || demoDeals[module].unknowns,
      difficulty: savedDeal?.difficulty || (existing?.pressureLevel === 'high' ? 'advanced' : existing?.pressureLevel === 'low' ? 'foundation' : 'standard'),
    };
  });

  if (!interaction || !brief) {
    return (
      <div className="max-w-3xl mx-auto p-8">
        <button onClick={() => navigate('dashboard')} className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900">
          <ArrowLeft size={16} /> Back to dashboard
        </button>
        <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
          Prepare this interaction first. The scenario planner needs the interaction and its performance brief.
        </div>
      </div>
    );
  }

  const update = <K extends keyof DealIntelligence>(field: K, value: DealIntelligence[K]) => {
    setDeal(current => ({ ...current, [field]: value }));
    setPlan(undefined);
    setError(null);
  };

  const loadDemo = (module: PracticeModule) => {
    setDeal({ ...demoDeals[module], module, difficulty: 'standard' });
    setPlan(undefined);
    setError(null);
  };

  const createPlan = async () => {
    if (!deal.solution.trim() || !deal.buyerRole.trim() || !deal.sellerObjective.trim()) {
      setError('Add the solution, buyer role, and your seller objective before generating the scenario.');
      return;
    }
    setError(null);
    setIsGenerating(true);
    try {
      const generated = await generateScenarioPlan(interaction, brief, {
        ...deal,
        knownFacts: readPlanList(deal.knownFacts).join('\n'),
        unknowns: readPlanList(deal.unknowns).join('\n'),
      });
      setPlan(generated);
      store.updateInteraction(interaction.id, { scenarioPlan: generated, status: 'prepared' });
    } catch (generationError) {
      setError(generationError instanceof Error ? generationError.message : 'The live AI scenario could not be generated. Please retry.');
    } finally {
      setIsGenerating(false);
    }
  };

  const fieldClass = 'mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100';

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-8">
      <button onClick={() => navigate('brief', interaction.id)} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900">
        <ArrowLeft size={16} /> Back to brief
      </button>

      <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Deal intelligence intake</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-950">Build a realistic practice scenario</h1>
          <p className="mt-2 max-w-3xl text-slate-600">Give the AI the commercial context it needs. It will create an adaptive buyer, escalating objections, and evidence-based coaching criteria.</p>
        </div>
        <div className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600">{interaction.customer} · {interaction.role}</div>
      </div>

      <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-slate-900">1. Choose the skill to rehearse</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {moduleOptions.map(option => (
            <button key={option.value} type="button" onClick={() => loadDemo(option.value)} className={`rounded-xl border p-4 text-left transition ${deal.module === option.value ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600' : 'border-slate-200 hover:border-indigo-300'}`}>
              <span className="font-semibold text-slate-900">{option.title}</span>
              <span className="mt-1 block text-sm text-slate-600">{option.description}</span>
              <span className="mt-3 inline-block text-xs font-semibold text-indigo-600">Load demo case</span>
            </button>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-slate-700">Pressure level:</span>
          {(['foundation', 'standard', 'advanced'] as const).map(level => (
            <button key={level} type="button" onClick={() => update('difficulty', level)} className={`rounded-full px-3 py-1.5 text-sm capitalize ${deal.difficulty === level ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{level}</button>
          ))}
        </div>
      </section>

      <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-slate-900">2. Give the buyer and deal a point of view</h2>
        <p className="mt-1 text-sm text-slate-600">Choosing a skill above loads a complete demo case. Replace only the open fields that matter for your deal; explicit unknowns become discovery opportunities instead of AI-invented details.</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">Deal stage<select className={fieldClass} value={deal.dealStage} onChange={event => update('dealStage', event.target.value)}><option>Prospecting</option><option>Discovery</option><option>Qualification</option><option>Evaluation</option><option>Negotiation</option><option>Renewal</option><option>Expansion</option></select></label>
          <label className="text-sm font-medium text-slate-700">Deal value<input className={fieldClass} placeholder="e.g. $240,000 ARR" value={deal.dealValue} onChange={event => update('dealValue', event.target.value)} /></label>
          <label className="text-sm font-medium text-slate-700">Contract term / timing<input className={fieldClass} placeholder="e.g. 24 months; renewal due in 90 days" value={deal.contractTerm} onChange={event => update('contractTerm', event.target.value)} /></label>
          <label className="text-sm font-medium text-slate-700">Buyer role *<select className={fieldClass} value={['CFO', 'Chief Financial Officer', 'VP Sales Operations', 'VP Customer Success', 'VP Operations', 'Procurement Lead', 'Chief Information Officer'].includes(deal.buyerRole) ? deal.buyerRole : 'Custom / other'} onChange={event => update('buyerRole', event.target.value === 'Custom / other' ? '' : event.target.value)}><option>VP Sales Operations</option><option>VP Customer Success</option><option>VP Operations</option><option>CFO</option><option>Chief Financial Officer</option><option>Chief Information Officer</option><option>Procurement Lead</option><option>Custom / other</option></select>{!['CFO', 'Chief Financial Officer', 'VP Sales Operations', 'VP Customer Success', 'VP Operations', 'Procurement Lead', 'Chief Information Officer'].includes(deal.buyerRole) && <input className={fieldClass} placeholder="Enter buyer role" value={deal.buyerRole} onChange={event => update('buyerRole', event.target.value)} />}</label>
          <label className="text-sm font-medium text-slate-700">Solution being sold *<input className={fieldClass} placeholder="e.g. Enterprise analytics platform" value={deal.solution} onChange={event => update('solution', event.target.value)} /></label>
          <label className="text-sm font-medium text-slate-700">Buyer context<input className={fieldClass} placeholder="What they own, what they are measured on" value={deal.buyerContext} onChange={event => update('buyerContext', event.target.value)} /></label>
          <label className="text-sm font-medium text-slate-700">Trigger event<input className={fieldClass} placeholder="Why now?" value={deal.triggerEvent} onChange={event => update('triggerEvent', event.target.value)} /></label>
          <label className="text-sm font-medium text-slate-700">Business impact at stake<input className={fieldClass} placeholder="Cost, revenue, risk, time or customer impact" value={deal.businessImpact} onChange={event => update('businessImpact', event.target.value)} /></label>
          <label className="text-sm font-medium text-slate-700">Stakeholder map<input className={fieldClass} placeholder="Champion, economic buyer, procurement, blockers" value={deal.stakeholderMap} onChange={event => update('stakeholderMap', event.target.value)} /></label>
          <label className="text-sm font-medium text-slate-700">Incumbent / competition<input className={fieldClass} placeholder="Status quo, competitor, internal build" value={deal.competition} onChange={event => update('competition', event.target.value)} /></label>
          <label className="text-sm font-medium text-slate-700">Commercial context<input className={fieldClass} placeholder="Value, term, discount pressure, authority, red lines" value={deal.commercialContext} onChange={event => update('commercialContext', event.target.value)} /></label>
          <label className="text-sm font-medium text-slate-700">Seller objective *<input className={fieldClass} placeholder="What must you learn, protect or advance?" value={deal.sellerObjective} onChange={event => update('sellerObjective', event.target.value)} /></label>
          <label className="text-sm font-medium text-slate-700 md:col-span-2">Desired next step<input className={fieldClass} placeholder="e.g. Align technical and finance sponsors in a 45-minute value review" value={deal.desiredNextStep} onChange={event => update('desiredNextStep', event.target.value)} /></label>
          <label className="text-sm font-medium text-slate-700">Known facts<textarea className={fieldClass} rows={4} placeholder="One fact per line. These are safe for the buyer to reference." value={deal.knownFacts} onChange={event => update('knownFacts', event.target.value)} /></label>
          <label className="text-sm font-medium text-slate-700">Important unknowns<textarea className={fieldClass} rows={4} placeholder="One unknown per line. The buyer should not state these as facts." value={deal.unknowns} onChange={event => update('unknowns', event.target.value)} /></label>
        </div>
      </section>

      {error && <div className="mt-5 flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><AlertCircle className="shrink-0" size={18} /><span>{error}</span></div>}

      <div className="mt-6 flex justify-end">
        <button type="button" onClick={createPlan} disabled={isGenerating} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70">
          {isGenerating ? <><Loader2 className="animate-spin" size={18} /> Building live scenario…</> : <><Sparkles size={18} /> Generate scenario plan</>}
        </button>
      </div>

      {plan && <section className="mt-6 rounded-2xl border border-indigo-200 bg-indigo-50/50 p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">AI-generated plan</p>
            <h2 className="mt-1 text-xl font-bold text-slate-950">{plan.scenarioTitle}</h2>
            <p className="mt-1 text-sm text-slate-700">Buyer: {plan.stakeholderRole} · Pressure: {plan.pressureLevel}</p>
          </div>
          <button type="button" onClick={() => navigate('roleplay', interaction.id)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 font-semibold text-white hover:bg-slate-800">Launch live roleplay <ChevronRight size={18} /></button>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl bg-white p-4"><Target className="mb-2 text-indigo-600" size={19} /><p className="text-sm font-semibold text-slate-900">Success outcome</p><p className="mt-1 text-sm text-slate-600">{plan.desiredOutcome}</p></div>
          <div className="rounded-xl bg-white p-4"><Users className="mb-2 text-indigo-600" size={19} /><p className="text-sm font-semibold text-slate-900">Objection path</p><ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-600">{planList(plan.objectionLadder, planList(plan.likelyObjections)).map(item => <li key={item}>{item}</li>)}</ul></div>
          <div className="rounded-xl bg-white p-4"><p className="text-sm font-semibold text-slate-900">Evidence the coach will look for</p><ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-600">{planList(plan.requiredBehaviors, ['Acknowledge the concern', 'Ask a clarifying question', 'Secure a next step']).map(item => <li key={item}>{item}</li>)}</ul></div>
          <div className="rounded-xl bg-white p-4"><ShieldAlert className="mb-2 text-amber-600" size={19} /><p className="text-sm font-semibold text-slate-900">Commercial guardrails</p><ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-600">{planList(plan.forbiddenMoves, ['Do not invent facts or give unapproved concessions']).map(item => <li key={item}>{item}</li>)}</ul></div>
        </div>
      </section>}
    </div>
  );
}
