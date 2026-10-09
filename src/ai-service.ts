import { store } from './store';
import { validateSemanticOutput } from './semantic-client';
import { Interaction, DealIntelligence, ScenarioPlan, PreparationBrief, RoleplayConfig } from './types';
import { createLLMProvider, RoleplayProvider } from './llm-provider';
import { scenarioContext } from './product-spec';
export { buildPerformancePlan as generateBrief } from './performance-intelligence';
export { generatePracticeAssessment as generatePracticeEvaluation } from './assessment-service';
export { analyzeSemantically as analyzeTranscript } from './analysis-pipeline';
export { updateCapabilityHistory } from './capability-memory';
export function resetRoleplayState() { /* Session state is owned by the store. */ }
export function generateRoleplayConfig(interaction:Interaction, brief:PreparationBrief):RoleplayConfig {
 const context=scenarioContext(interaction);
 return { stakeholderRole:interaction.stakeholderRole||'Stakeholder', personality:context.persona.decisionStyle,
 pressureLevel:interaction.experienceLevel==='Foundation'?'low':interaction.experienceLevel==='Executive'?'high':'medium',
 objectives:[interaction.objective],likelyObjections:brief.likelyObjections, commercialConstraints:'Only explicitly supplied company policy establishes authority.',hiddenPriorities:[],desiredOutcome:interaction.objective,
 ...interaction.scenarioPlan, ...context, interactionId:interaction.id, interactionContext:JSON.stringify(interaction),
 performancePlan:JSON.stringify(brief),intendedBehaviors:brief.intendedBehaviors,employeeCapabilityState:JSON.stringify(store.getState().capabilityHistory.filter(h=>h.capability===context.targetCapability)),
 stakeholderState:'OPEN' };
}
function asList(value: unknown, fallback: string[]): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).slice(0, 5)
    : fallback;
}

/**
 * Creates a session-specific sales simulation from user-supplied deal facts.
 * Unknowns are explicitly retained so the model does not invent account data.
 */
export async function generateScenarioPlan(
  interaction: Interaction,
  brief: PreparationBrief,
  deal: DealIntelligence
): Promise<ScenarioPlan> {
  const provider = createLLMProvider();
  const briefObjections = Array.isArray(brief.likelyObjections) ? brief.likelyObjections : [];
  const briefQuestions = Array.isArray(brief.recommendedQuestions) ? brief.recommendedQuestions : [];
  const moduleLabels: Record<DealIntelligence['module'], string> = {
    discovery: 'Discovery and Qualification',
    negotiation: 'Objection Handling and Commercial Negotiation',
    'renewal-expansion': 'Renewal and Expansion',
  };
  const systemPrompt = `You design realistic enterprise-sales practice simulations. Use only supplied facts. Never invent pricing, customer policies, stakeholders, outcomes, or commitments. Preserve unknowns as discovery gaps.
Return JSON only with this exact structure:
{
  "scenarioTitle":"string", "stakeholderRole":"string", "personality":"string", "pressureLevel":"low|medium|high",
  "objectives":["string"], "likelyObjections":["string"], "commercialConstraints":"string", "hiddenPriorities":["string"], "desiredOutcome":"string",
  "knownFacts":["string"], "unknowns":["string"], "objectionLadder":["string"], "triggerConditions":["string"],
  "requiredBehaviors":["string"], "forbiddenMoves":["string"]
}
Use 3-5 concise items per list. These are possible concerns, never a fixed dialogue sequence. Adapt to the supplied taxonomy and complexity profile.
Pressure design: foundation is collaborative and gives context after a good question; standard is skeptical and tests one concern at a time; advanced is time-constrained, asks for evidence, raises trade-offs, and escalates only when earned.`;
  const userPrompt = `Scenario context: ${JSON.stringify(scenarioContext(interaction))}
Practice module: ${moduleLabels[deal.module]}
Difficulty: ${deal.difficulty}
Interaction: ${interaction.name}; customer: ${interaction.customer}; seller role: ${interaction.role}
Preparation brief objections: ${briefObjections.join(' | ') || 'Not provided'}
Preparation brief questions: ${briefQuestions.join(' | ') || 'Not provided'}
Deal intelligence:
Stage: ${deal.dealStage || 'Not provided'}
Deal value: ${deal.dealValue || 'Not provided'}
Contract term / renewal timing: ${deal.contractTerm || 'Not provided'}
Solution: ${deal.solution || 'Not provided'}
Buyer role: ${deal.buyerRole || 'Not provided'}
Buyer context: ${deal.buyerContext || 'Not provided'}
Trigger event: ${deal.triggerEvent || 'Not provided'}
Business impact: ${deal.businessImpact || 'Not provided'}
Stakeholder map: ${deal.stakeholderMap || 'Not provided'}
Competition: ${deal.competition || 'Not provided'}
Commercial context: ${deal.commercialContext || 'Not provided'}
Seller objective: ${deal.sellerObjective || interaction.objective || 'Not provided'}
Desired next step: ${deal.desiredNextStep || 'Not provided'}
Known facts: ${deal.knownFacts || 'Not provided'}
Unknowns: ${deal.unknowns || 'Not provided'}`;
  const response = await provider.chat(
    [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
    { temperature: 0.25, maxTokens: 1800, jsonMode: true, operation: 'SCENARIO_PLAN_GENERATION' }
  );
  const data: Record<string, unknown> = validateSemanticOutput('SCENARIO_PLAN_GENERATION',JSON.parse(response.content));
  if (!data || typeof data !== 'object' || Array.isArray(data) || typeof data.scenarioTitle !== 'string' || !data.scenarioTitle.trim()
    || !Array.isArray(data.objectives) || !data.objectives.some(item => typeof item === 'string' && item.trim())) {
    throw new Error('The live AI returned an invalid scenario plan. Please generate it again.');
  }
  const pressureByDifficulty: Record<DealIntelligence['difficulty'], 'low' | 'medium' | 'high'> = {
    foundation: 'low', standard: 'medium', advanced: 'high',
  };
  return {
    interactionId: interaction.id,
    module: deal.module,
    dealIntelligence: deal,
    scenarioTitle: typeof data.scenarioTitle === 'string' ? data.scenarioTitle : `${moduleLabels[deal.module]} practice`,
    stakeholderRole: typeof data.stakeholderRole === 'string' ? data.stakeholderRole : deal.buyerRole || 'Decision Maker',
    personality: typeof data.personality === 'string' ? data.personality : 'Analytical and direct.',
    pressureLevel: pressureByDifficulty[deal.difficulty],
    objectives: asList(data.objectives, [deal.sellerObjective || interaction.objective || 'Advance the conversation']),
    likelyObjections: asList(data.likelyObjections, briefObjections.slice(0, 3)),
    commercialConstraints: deal.commercialContext || 'Unknown. Do not invent commercial authority or policies.',
    hiddenPriorities: asList(data.hiddenPriorities, ['Not provided']),
    desiredOutcome: typeof data.desiredOutcome === 'string' ? data.desiredOutcome : deal.desiredNextStep || 'Agree a specific next step',
    knownFacts: deal.knownFacts.split('\n').map(s => s.trim()).filter(Boolean),
    unknowns: deal.unknowns.split('\n').map(s => s.trim()).filter(Boolean),
    objectionLadder: asList(data.objectionLadder, briefObjections.slice(0, 3)),
    triggerConditions: asList(data.triggerConditions, ['Introduce the next objection only after a relevant seller response.']),
    requiredBehaviors: asList(data.requiredBehaviors, ['Acknowledge the concern', 'Ask a clarifying question', 'Secure a next step']),
    forbiddenMoves: asList(data.forbiddenMoves, ['Inventing facts', 'Offering an unapproved concession']),
  };
}


export type RoleplayResponse = Awaited<ReturnType<typeof RoleplayProvider.getRoleplayResponse>>;
export const getRoleplayResponse = RoleplayProvider.getRoleplayResponse;
