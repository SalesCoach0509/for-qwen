import { CapabilityScore, CoachingIntervention, Interaction, PlanVsActual, PostInteractionAnalysis, PreparationBrief, OBJECTION_DIMENSIONS, ObjectionHandlingDimension } from './types';
import { createLLMProvider } from './llm-provider';
import { v4 as uuidv4 } from 'uuid';

type Fact = { id: string; line: number; speaker: string; speakerType: 'EMPLOYEE' | 'STAKEHOLDER' | 'UNKNOWN'; sourceText: string; eventType: string; confidence: number };
type Behavior = { description: string; evidenceIds: string[]; classification: 'OBSERVED' | 'INFERRED' };

const provider = createLLMProvider();

async function callJson<T>(operation: string, instructions: string, data: unknown): Promise<T> {
  const response = await provider.chat([
      { role: 'system', content: `${instructions}\nReturn valid JSON only. Never include chain-of-thought.` },
      { role: 'user', content: JSON.stringify(data) },
    ], { temperature: 0.1, jsonMode: true, maxTokens: 3000, operation });
  return JSON.parse(response.content) as T;
}

function validFacts(raw: unknown, lines: string[]): Fact[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((candidate, index): Fact[] => {
    const line = Number(candidate?.line);
    const quote = String(candidate?.sourceText || '').trim();
    if (!Number.isInteger(line) || line < 1 || line > lines.length || quote.length < 3 || !lines[line - 1].includes(quote)) return [];
    return [{
      id: `fact-${index + 1}`, line,
      speaker: String(candidate.speaker || lines[line - 1].split(':')[0] || 'Unknown'),
      speakerType: /^(you|employee|seller|salesperson|rep|agent|account executive)$/i.test(String(candidate.speaker || lines[line - 1].split(':')[0]).trim())
        ? 'EMPLOYEE' : candidate.speakerType === 'EMPLOYEE' ? 'EMPLOYEE' : candidate.speakerType === 'STAKEHOLDER' ? 'STAKEHOLDER' : 'UNKNOWN',
      sourceText: quote,
      eventType: String(candidate.eventType || 'OTHER'),
      confidence: Math.max(0, Math.min(1, Number(candidate.confidence) || 0.5)),
    }];
  });
}

export async function analyzeSemantically(transcript: string, interaction: Interaction, brief: PreparationBrief): Promise<PostInteractionAnalysis> {
  const lines = transcript.split(/\r?\n/);
  const numberedTranscript = lines.map((text, index) => ({ line: index + 1, text })).filter(item => item.text.trim());
  const factResult = await callJson<{ facts: unknown[] }>(
    'TRANSCRIPT_FACT_EXTRACTION',
    'Extract only factual events from the transcript. No coaching or inference. Each fact must have line, speaker, speakerType (EMPLOYEE or STAKEHOLDER or UNKNOWN), sourceText copied exactly from that line, eventType, confidence. Event types: OBJECTION, QUESTION, CLARIFICATION, VALUE_STATEMENT, CONCESSION, COMMITMENT, NEXT_STEP, COMPETITOR_REFERENCE, BUSINESS_PAIN, DECISION_CRITERIA, RISK, ESCALATION, OTHER. Return {"facts":[]}.',
    { lines: numberedTranscript }
  );
  const facts = validFacts(factResult.facts, lines);

  const [behaviorResult, planResult] = await Promise.all([
    callJson<{ behaviors: Behavior[] }>(
      'BEHAVIOR_EXTRACTION',
      'Convert facts to observable employee behaviours only. Use evidenceIds from the supplied facts. Do not invent events. Mark OBSERVED or INFERRED. Return {"behaviors":[{"description":"","evidenceIds":[],"classification":"OBSERVED"}]}.',
      { facts }
    ),
    callJson<{ rows: Array<{ intended: string; actual: string; evidenceIds: string[]; impact: 'Low' | 'Medium' | 'High'; explanation: string }> }>(
      'PLAN_VS_ACTUAL',
      'Compare the plan with transcript facts. Every observed actual claim must cite fact evidenceIds. If no supporting fact exists say NOT OBSERVED or INSUFFICIENT EVIDENCE. Never claim success from silence. Return {"rows":[{"intended":"","actual":"","evidenceIds":[],"impact":"Low","explanation":""}]}.',
      { plan: { objective: brief.objective, questions: brief.recommendedQuestions, positioning: brief.recommendedPositioning, avoid: brief.thingsToAvoid, focus: brief.personalCoachingFocus }, facts }
    ),
  ]);

  const factById = new Map(facts.map(f => [f.id, f]));
  const behaviors = (Array.isArray(behaviorResult.behaviors) ? behaviorResult.behaviors : [])
    .filter(b => Array.isArray(b.evidenceIds) && b.evidenceIds.some(id => factById.get(id)?.speakerType === 'EMPLOYEE'))
    .map(b => ({ ...b, evidenceIds: b.evidenceIds.filter(id => factById.get(id)?.speakerType === 'EMPLOYEE') }));

  const rows: PlanVsActual[] = (Array.isArray(planResult.rows) ? planResult.rows : []).map(row => {
    const citations = (Array.isArray(row.evidenceIds) ? row.evidenceIds : []).filter(id => factById.get(id)?.speakerType === 'EMPLOYEE');
    const citedFacts = citations.map(id => factById.get(id)!);
    const observation = citedFacts.length ? 'OBSERVED' : /not observed|insufficient evidence/i.test(row.actual) ? 'NOT_OBSERVED' : 'INSUFFICIENT_EVIDENCE';
    return {
      intended: String(row.intended || ''),
      actual: citedFacts.length ? `${String(row.actual || '')} (Line ${citedFacts[0].line})` : observation.replace(/_/g, ' '),
      evidenceIds: citations,
      sourceText: citedFacts.map(f => f.sourceText).join(' · '),
      observation,
      impact: ['Low', 'Medium', 'High'].includes(row.impact) ? row.impact : 'Medium',
      explanation: String(row.explanation || ''),
    };
  });

  const evaluation = await callJson<{ score: number | null; confidence: number; strengths: string[]; missedOpportunities: string[]; likelyImpact: string; weakness: string; dimensions?: Partial<Record<ObjectionHandlingDimension, { score: number | null; evidenceIds: string[] }>> }>(
    'CAPABILITY_ASSESSMENT',
    'Assess Objection Handling from the cited observable behaviours. Score 1 to 5 only when there is relevant evidence; otherwise score null. Assess Recognition, Clarification, Acknowledgement, Response Relevance, Value Preservation, Commercial Discipline, Conversational Control, Advancement separately. Each dimension must be {"score":1-5 or null,"evidenceIds":[]} and null without direct relevant evidence. Do not infer discounting, competitors, or next steps without facts. Return {"score":null,"confidence":0,"strengths":[],"missedOpportunities":[],"likelyImpact":"","weakness":"","dimensions":{}}.',
    { facts, behaviors }
  );

  const judge = behaviors.length ? await callJson<{ approvedEvidenceIds: string[]; approvedRowIndices: number[]; scoreSupported: boolean }>(
    'GROUNDING_JUDGE',
    'Verify each claimed employee behaviour and plan-versus-actual row against the exact cited transcript quote. Check whether the score matches the rubric and whether observations are supported. Return {"approvedEvidenceIds":["fact-1"],"approvedRowIndices":[0],"scoreSupported":true}. Exclude unsupported or stakeholder-only claims. Be conservative.',
    { facts, behaviors, rows, proposedScore: evaluation.score, dimensions: evaluation.dimensions }
  ) : { approvedEvidenceIds: [], approvedRowIndices: [], scoreSupported: false };
  const approved = new Set(Array.isArray(judge.approvedEvidenceIds) ? judge.approvedEvidenceIds : []);
  const approvedRows = new Set(Array.isArray(judge.approvedRowIndices) ? judge.approvedRowIndices : []);
  const groundedRows = rows.map((row, index): PlanVsActual => row.observation === 'OBSERVED' && !approvedRows.has(index)
    ? { ...row, actual: 'INSUFFICIENT EVIDENCE', sourceText: undefined, evidenceIds: [], observation: 'INSUFFICIENT_EVIDENCE' }
    : row);

  const evidence = behaviors.flatMap(b => b.evidenceIds.filter(id => approved.has(id)).map(id => {
    const fact = factById.get(id)!;
    return {
      evidenceId: uuidv4(), interactionId: interaction.id, sourceType: 'TRANSCRIPT' as const,
      sourceId: '', speaker: fact.speaker, sourceText: fact.sourceText,
      behaviorObserved: b.description, classification: b.classification,
      statement: b.description, source: 'transcript' as const,
      confidence: fact.confidence, observationType: b.classification === 'INFERRED' ? 'inferred' as const : 'observed' as const,
      lineReference: `Line ${fact.line}`,
    };
  }));
  const supported = judge.scoreSupported === true && evidence.length > 0 && typeof evaluation.score === 'number' && evaluation.score >= 1 && evaluation.score <= 5;
  const score = supported ? evaluation.score! : 0;
  const dimensions = Object.fromEntries(OBJECTION_DIMENSIONS.map(dimension => {
    const proposed = evaluation.dimensions?.[dimension];
    const supportedDimension = proposed && Array.isArray(proposed.evidenceIds) && proposed.evidenceIds.some(id => approved.has(id)) && typeof proposed.score === 'number' && proposed.score >= 1 && proposed.score <= 5;
    return [dimension, supported && supportedDimension ? proposed.score : null];
  })) as Record<ObjectionHandlingDimension, number | null>;
  const diagnosis: CapabilityScore = {
    capability: 'Objection Handling', score,
    level: (supported ? Math.ceil(score) : 1) as CapabilityScore['level'],
    evidence, confidence: supported ? Math.max(0, Math.min(1, Number(evaluation.confidence) || 0)) : 0,
    weakness: supported ? evaluation.weakness : undefined,
    dimensions,
  };

  const interventionData = await callJson<{ title: string; description: string; recommendedAction: string; estimatedDuration: string; behaviour?: string; whyItMatters?: string; exercise?: string; difficulty?: 'low' | 'medium' | 'high'; successCriterion?: string }>(
    'INTERVENTION_GENERATION',
    'Recommend exactly one practice intervention based only on the supported diagnosis. If evidence is insufficient, recommend collecting a fuller transcript or practicing the moment without a claimed weakness. Return {"title":"","description":"","recommendedAction":"","estimatedDuration":"","behaviour":"","whyItMatters":"","exercise":"","difficulty":"low|medium|high","successCriterion":"observable criterion"}.',
    { diagnosis: { score, evidence, weakness: diagnosis.weakness }, focus: brief.personalCoachingFocus }
  );
  const intervention: CoachingIntervention = {
    id: uuidv4(), title: String(interventionData.title || 'Practice the next moment'),
    description: String(interventionData.description || 'Build more evidence with targeted practice.'),
    targetCapability: 'Objection Handling',
    recommendedAction: String(interventionData.recommendedAction || 'Practice clarification before responding.'),
    estimatedDuration: String(interventionData.estimatedDuration || '5 minutes'),
    priority: supported && score < 3 ? 'high' : 'medium',
    behaviour: String(interventionData.behaviour || diagnosis.weakness || 'Clarification in a customer conversation'),
    whyItMatters: String(interventionData.whyItMatters || 'This is the next behaviour to test.'),
    exercise: String(interventionData.exercise || interventionData.recommendedAction || 'Practice the moment.'),
    difficulty: ['low', 'medium', 'high'].includes(interventionData.difficulty || '') ? interventionData.difficulty : 'medium',
    successCriterion: String(interventionData.successCriterion || 'Demonstrate the target behaviour in the next practice.'),
  };

  return {
    id: uuidv4(), interactionId: interaction.id, transcriptId: '',
    planVsActual: groundedRows,
    strengths: supported && Array.isArray(evaluation.strengths) ? evaluation.strengths : [],
    missedOpportunities: supported && Array.isArray(evaluation.missedOpportunities) ? evaluation.missedOpportunities : [],
    capabilityDiagnosis: [diagnosis], repeatedPatterns: [],
    likelyImpact: supported ? String(evaluation.likelyImpact || 'Evidence supports a limited assessment.') : 'Insufficient evidence to assess this capability.',
    nextIntervention: intervention, generatedAt: new Date().toISOString(),
  };
}
