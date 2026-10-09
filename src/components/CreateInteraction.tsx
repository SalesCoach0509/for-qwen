import { taxonomy, profiles, rubricLibrary } from '../product-spec';
import { SmartIntake } from './SmartIntake';
import { useState } from 'react';
import { AppState, ExperienceLevel, StakeholderSeniority, CapabilityName } from '../types';
import { store } from '../store';
import { v4 as uuidv4 } from 'uuid';
import { ArrowLeft, Target, Calendar, User, Clock, FileText, MessageSquare } from 'lucide-react';
import { demoInteraction } from '../data/seed';

type Screen = 'login' | 'dashboard' | 'create' | 'brief' | 'roleplay' | 'results' | 'upload' | 'post' | 'capabilities' | 'roadmap';

interface Props {
  state: AppState;
  navigate: (screen: Screen, interactionId?: string) => void;
}

export default function CreateInteraction({ navigate }: Props) {
  const [form, setForm] = useState({
    stakeholder:'', interactionType:'renewal', experienceLevel:'Experienced' as ExperienceLevel, stakeholderSeniority:'Manager' as StakeholderSeniority, focusCapability:'Objection Handling' as CapabilityName, risks:'',
    name: '',
    customer: '',
    role: '',
    stakeholderRole: '',
    dateTime: '',
    objective: '',
    agenda: '',
    notes: '',
    additionalContext: '',
  });

  const loadDemo = () => {
    setForm({...form,
      name: demoInteraction.name || '',
      customer: demoInteraction.customer || '',
      role: demoInteraction.role || '',
      stakeholderRole: 'CFO',
      dateTime: demoInteraction.dateTime || '',
      objective: demoInteraction.objective || '',
      agenda: demoInteraction.agenda || '',
      notes: demoInteraction.notes || '',
      additionalContext: demoInteraction.additionalContext || '',
    });
  };

  const handleSubmit = () => {
    if (!form.name || !form.customer) return;
    
    const interaction = {
      id: uuidv4(),
      userId: store.getState().user?.id || '',
      name: form.name,
      customer: form.customer,
      role: form.role || 'Account Executive',
      stakeholderRole: form.stakeholderRole || 'Stakeholder',
      stakeholder: form.stakeholder || form.stakeholderRole || 'Stakeholder',
      interactionType: form.interactionType, experienceLevel:form.experienceLevel, stakeholderSeniority:form.stakeholderSeniority, risks:form.risks.split('\n').filter(Boolean), previousInteractionId:[...store.getState().analyses].reverse()[0]?.interactionId,
      priority: 'medium' as const,
      focusCapability: form.focusCapability,
      dateTime: form.dateTime || new Date(Date.now() + 86400000).toISOString().slice(0, 16),
      objective: form.objective,
      agenda: form.agenda,
      notes: form.notes,
      additionalContext: form.additionalContext,
      status: 'UPCOMING' as const,
      createdAt: new Date().toISOString(),
    };

    store.addInteraction(interaction);
    navigate('brief', interaction.id);
  };

  return (
    <div className="min-h-screen bg-surface-50">
      <header className="bg-white border-b border-surface-100">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate('dashboard')} className="p-2 hover:bg-surface-100 rounded-lg transition-all">
            <ArrowLeft size={18} className="text-surface-600" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-surface-900">Create Interaction</h1>
            <p className="text-sm text-surface-400">Tell your coach about the upcoming interaction</p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl border border-surface-100 p-6 shadow-sm animate-fade-in">
          <SmartIntake current={form} apply={values=>setForm(f=>({...f,...values}))} />
          {/* Demo loader */}
          {store.getState().mode==='DEMO' && <div className="mb-6 p-4 bg-primary-50 rounded-xl border border-primary-100">
            <p className="text-sm text-primary-700 mb-2 font-medium">New here?</p>
            <p className="text-sm text-primary-600 mb-3">Load a demo scenario to see the full experience.</p>
            <button
              onClick={loadDemo}
              className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-all"
            >
              Load Demo: Enterprise Renewal
            </button>
          </div>}

          <div className="space-y-5">
            <label className="block text-sm font-medium">Performance moment<select aria-label="Performance moment" value={form.interactionType} onChange={e=>setForm(f=>({...f,interactionType:e.target.value,focusCapability:taxonomy.find(m=>m.id===e.target.value)!.capabilities[0] as CapabilityName}))} className="block border rounded-lg p-3 w-full mt-1">{[...new Set(taxonomy.map(m=>m.category))].map(c=><optgroup key={c} label={c}>{taxonomy.filter(m=>m.category===c).map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</optgroup>)}</select></label>
            <div className="grid md:grid-cols-2 gap-4"><label className="text-sm font-medium">Experience / complexity<select aria-label="Experience / complexity" value={form.experienceLevel} onChange={e=>setForm(f=>({...f,experienceLevel:e.target.value as ExperienceLevel}))} className="block border rounded-lg p-3 w-full">{Object.keys(profiles).map(v=><option key={v}>{v}</option>)}</select></label><label className="text-sm font-medium">Stakeholder seniority<select aria-label="Stakeholder seniority" value={form.stakeholderSeniority} onChange={e=>setForm(f=>({...f,stakeholderSeniority:e.target.value as StakeholderSeniority}))} className="block border rounded-lg p-3 w-full">{['Individual Contributor','Manager','Director','VP','C-Level / Board'].map(v=><option key={v}>{v}</option>)}</select></label></div>
            <p className="text-xs text-surface-500">{profiles[form.experienceLevel].evaluationStandard}</p>
            <label className="block text-sm font-medium">Capability focus<select aria-label="Capability focus" value={form.focusCapability} onChange={e=>setForm(f=>({...f,focusCapability:e.target.value as CapabilityName}))} className="block border rounded-lg p-3 w-full">{Object.keys(rubricLibrary).map(v=><option key={v}>{v}</option>)}</select></label>
            <label className="block text-sm font-medium">Stakeholder name<input aria-label="Stakeholder name" className="block border rounded-lg p-3 w-full" value={form.stakeholder} onChange={e=>setForm(f=>({...f,stakeholder:e.target.value}))}/></label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-surface-700 mb-1.5">
                  <Target size={14} />
                  Interaction name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-surface-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-sm"
                  placeholder="e.g., Renewal Meeting"
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-surface-700 mb-1.5">
                  <User size={14} />
                  Customer / Stakeholder *
                </label>
                <input
                  type="text"
                  value={form.customer}
                  onChange={e => setForm(f => ({ ...f, customer: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-surface-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-sm"
                  placeholder="e.g., Acme Corporation"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-surface-700 mb-1.5">
                  <User size={14} />
                  Your role
                </label>
                <input
                  type="text"
                  value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-surface-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-sm"
                  placeholder="e.g., Account Executive"
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-surface-700 mb-1.5">Stakeholder role</label>
                <input
                  type="text"
                  value={form.stakeholderRole}
                  onChange={e => setForm(f => ({ ...f, stakeholderRole: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-surface-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-sm"
                  placeholder="e.g., CFO"
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-surface-700 mb-1.5">
                  <Calendar size={14} />
                  Date & time
                </label>
                <input
                  type="datetime-local"
                  value={form.dateTime}
                  onChange={e => setForm(f => ({ ...f, dateTime: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-surface-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-sm"
                />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-surface-700 mb-1.5">
                <Target size={14} />
                Objective
              </label>
              <input
                type="text"
                value={form.objective}
                onChange={e => setForm(f => ({ ...f, objective: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-surface-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-sm"
                placeholder="What does success look like?"
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-surface-700 mb-1.5">
                <FileText size={14} />
                Agenda
              </label>
              <textarea
                value={form.agenda}
                onChange={e => setForm(f => ({ ...f, agenda: e.target.value }))}
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl border border-surface-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-sm resize-none"
                placeholder="Key topics to cover..."
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-surface-700 mb-1.5">
                <MessageSquare size={14} />
                Notes & Context
              </label>
              <textarea
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                rows={5}
                className="w-full px-4 py-2.5 rounded-xl border border-surface-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-sm resize-none"
                placeholder="Paste customer information, opportunity details, previous meeting notes, relevant context..."
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-surface-700 mb-1.5">
                <Clock size={14} />
                Additional context (optional)
              </label>
              <textarea
                value={form.additionalContext}
                onChange={e => setForm(f => ({ ...f, additionalContext: e.target.value }))}
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl border border-surface-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-sm resize-none"
                placeholder="Any other relevant information..."
              />
            </div>

            <div className="pt-4 border-t border-surface-100">
              <button
                onClick={handleSubmit}
                disabled={!form.name || !form.customer}
                className="w-full py-3.5 bg-primary-600 hover:bg-primary-700 disabled:bg-surface-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all shadow-lg shadow-primary-200 flex items-center justify-center gap-2"
              >
                <Target size={18} />
                Generate Preparation Brief
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
