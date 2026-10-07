import { Interaction, DealIntelligence, ScenarioPlan, PreparationBrief, RoleplayConfig, PracticeEvaluation, CapabilityScore, PostInteractionAnalysis, CapabilityHistory, EvidenceItem, CompanyContext } from './types';
import { createLLMProvider, isLLMAvailable, RoleplayProvider } from './llm-provider';
import { calculateWeightedScore, detectPatterns } from './capability-memory';
import { v4 as uuidv4 } from 'uuid';
import { judgeCapabilityAssessment } from './judge';

// ============================================================================
// PREPARATION BRIEF
// ============================================================================

export async function generateBrief(
  interaction: Interaction,
  capabilityHistory?: CapabilityHistory[],
  companyContext?: CompanyContext | null,
  priorLearning?: string
): Promise<PreparationBrief> {
  // Check at runtime if backend is available
  if (isLLMAvailable()) {
    // CRITICAL: In LIVE MODE, do NOT silently fall back to mock
    // If LLM call fails, throw error so user knows something went wrong
    return await generateBriefWithLLM(interaction, capabilityHistory, companyContext, priorLearning);
  }
  // Only use mock in DEMO MODE
  return generateBriefMock(interaction, capabilityHistory, companyContext, priorLearning);
}

async function generateBriefWithLLM(
  interaction: Interaction,
  capabilityHistory?: CapabilityHistory[],
  companyContext?: CompanyContext | null,
  priorLearning?: string
): Promise<PreparationBrief> {
  const provider = createLLMProvider();
  const systemPrompt = `You are an AI performance coach for enterprise sales. Generate a concise preparation brief.
CRITICAL: Never invent customer facts, stakeholder priorities, pricing, discounts, products, or company policies. If unknown, state "Unknown". Label likely concerns as hypotheses, not facts. Use employee history only when supported by observations.
PERSONALIZATION: Use the employee's capability history to identify specific risks and tailor coaching focus.
Output JSON:
{
  "objective": "What success looks like",
  "stakeholderPriorities": ["priority1"],
  "relevantContext": ["context1"],
  "commercialGuidance": {"discountLimits": "string", "relevantPackage": "string", "tradeOffs": [], "escalationItems": [], "note": "string"},
  "likelyObjections": ["objection1"],
  "recommendedQuestions": ["question1"],
  "recommendedPositioning": ["positioning1"],
  "thingsToAvoid": ["avoid1"],
  "personalCoachingFocus": "coaching text based on capability history",
  "practiceRecommendation": "practice text based on capability history",
  "unknowns": ["material information not supplied"],
  "risks": ["supported or conditional risk"],
  "whyPersonalized": "short explanation tied to history, or insufficient evidence"
}`;

  // Build capability context from history
  let capabilityContext = 'No capability history available.';
  if (capabilityHistory && capabilityHistory.some(cap => cap.scores.length > 0)) {
    const capabilities = capabilityHistory.filter(cap => cap.scores.length > 0).map(cap => {
      const weightedScore = calculateWeightedScore(cap);
      const patterns = detectPatterns(cap);
      return `- ${cap.capability}: ${weightedScore.toFixed(1)}/5 (trend: ${cap.trend}, weakness: ${cap.knownWeakness || 'none'}, patterns: ${patterns.length > 0 ? patterns.join('; ') : 'none'})`;
    }).join('\n');
    capabilityContext = `Employee Capability Profile:\n${capabilities}`;
  }

  const userPrompt = `Interaction: ${interaction.name} with ${interaction.customer}
Role: ${interaction.role}, Date: ${interaction.dateTime}
Objective: ${interaction.objective}
Agenda: ${interaction.agenda}
Notes: ${interaction.notes || 'None'}
Context: ${interaction.additionalContext || 'None'}

${capabilityContext}

Company context (approved information only): ${companyContext ? JSON.stringify(companyContext) : 'Unknown'}
Learning from the previous evidenced performance moment: ${priorLearning || 'None available'}

Generate a personalized brief that addresses the employee's specific risks based on their capability history.`;

  const response = await provider.chat(
    [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
    { temperature: 0.4, maxTokens: 1800, jsonMode: true, operation: 'PERFORMANCE_PLAN_GENERATION' }
  );

  const data = JSON.parse(response.content);
  const lists = ['stakeholderPriorities', 'relevantContext', 'likelyObjections', 'recommendedQuestions', 'recommendedPositioning', 'thingsToAvoid'];
  if (!data || typeof data !== 'object' || typeof data.objective !== 'string' || !data.objective.trim()
    || lists.some(key => !Array.isArray(data[key]) || data[key].some((item: unknown) => typeof item !== 'string'))
    || typeof data.personalCoachingFocus !== 'string' || typeof data.practiceRecommendation !== 'string'
    || !data.commercialGuidance || !Array.isArray(data.commercialGuidance.tradeOffs) || !Array.isArray(data.commercialGuidance.escalationItems)) {
    throw new Error('The AI returned an incomplete performance plan. Please retry.');
  }
  return {
    id: uuidv4(), interactionId: interaction.id,
    objective: data.objective, stakeholderPriorities: data.stakeholderPriorities,
    relevantContext: data.relevantContext, commercialGuidance: data.commercialGuidance,
    likelyObjections: data.likelyObjections, recommendedQuestions: data.recommendedQuestions,
    recommendedPositioning: data.recommendedPositioning, thingsToAvoid: data.thingsToAvoid,
    personalCoachingFocus: data.personalCoachingFocus, practiceRecommendation: data.practiceRecommendation,
    unknowns: Array.isArray(data.unknowns) ? data.unknowns : [],
    risks: Array.isArray(data.risks) ? data.risks : [],
    whyPersonalized: data.whyPersonalized || 'Personalization is based on the available performance history.',
    sourceMode: companyContext ? 'COMPANY_COACH' : 'GENERAL_COACH',
    companySource: companyContext ? 'Approved company context' : 'No company context connected',
    priorLearning,
    sourceProvenance: { objective: 'CUSTOMER_CONTEXT', relevantContext: 'CUSTOMER_CONTEXT', commercialGuidance: companyContext ? 'COMPANY_POLICY' : 'UNKNOWN', personalCoachingFocus: capabilityHistory?.some(c => c.scores.length) ? 'EMPLOYEE_HISTORY' : 'MODEL_RECOMMENDATION', likelyObjections: 'MODEL_RECOMMENDATION' },
    generatedAt: new Date().toISOString(),
  };
}

function generateBriefMock(interaction: Interaction, capabilityHistory?: CapabilityHistory[], companyContext?: CompanyContext | null, priorLearning?: string): PreparationBrief {
  const notes = (interaction.notes || '').toLowerCase();
  
  // Build personalized coaching focus from capability history
  let coachingFocus = 'Focus on core objection handling techniques.';
  let practiceRec = 'Practice handling common objections. Duration: 7-10 minutes.';
  
  if (capabilityHistory && capabilityHistory.some(cap => cap.scores.length > 0)) {
    // Find weakest capability
    const weakest = capabilityHistory.filter(cap => cap.scores.length > 0)
      .map(cap => ({ ...cap, weightedScore: calculateWeightedScore(cap) }))
      .sort((a, b) => a.weightedScore - b.weightedScore)[0];
    
    if (weakest) {
      const patterns = detectPatterns(weakest);
      const patternText = patterns.length > 0 ? ` Pattern detected: ${patterns[0]}.` : '';
      
      coachingFocus = `Your ${weakest.capability} capability (${weakest.weightedScore.toFixed(1)}/5) needs attention. ${weakest.knownWeakness || 'Focus on improvement.'}${patternText}`;
      
      if (weakest.knownWeakness?.toLowerCase().includes('discount') || 
          weakest.knownWeakness?.toLowerCase().includes('concession')) {
        practiceRec = 'Practice value-before-price: (1) Acknowledge concern, (2) Ask clarifying questions, (3) Reframe around value, (4) Offer structural alternatives before concessions. Duration: 10 minutes.';
      } else if (weakest.knownWeakness?.toLowerCase().includes('clarif') || 
                 weakest.knownWeakness?.toLowerCase().includes('understand')) {
        practiceRec = 'Practice clarification: After each objection, ask "Can you help me understand what\'s driving that concern?" before responding. Duration: 8 minutes.';
      } else {
        practiceRec = `Practice ${weakest.capability.toLowerCase()} techniques in realistic scenarios. Duration: 10 minutes.`;
      }
    }
  }
  
  return {
    id: uuidv4(), interactionId: interaction.id,
    objective: interaction.objective || 'Successfully complete the interaction.',
    stakeholderPriorities: extractPriorities(notes),
    relevantContext: extractContext(notes),
    commercialGuidance: {
      discountLimits: companyContext?.discountRules || 'Unknown — confirm company policy.',
      relevantPackage: companyContext?.products || 'Unknown — no product information connected.',
      tradeOffs: [],
      escalationItems: [],
      note: companyContext ? 'Use only the approved company information shown here.' : 'Company pricing and discount policy are not connected.',
    },
    likelyObjections: notes.includes('pric') ? ['Possible pricing concern (inferred from your notes)'] : ['Likely objections are unknown.'],
    recommendedQuestions: ['What does success look like?', 'What\'s the business impact?', 'Who else is involved?'],
    recommendedPositioning: notes.includes('renewal') ? ['Ask what value the customer has realized so far.'] : ['Connect your response to a need the stakeholder confirms.'],
    thingsToAvoid: ['Don\'t lead with pricing', 'Don\'t rush past objections', 'Don\'t discount without authority'],
    personalCoachingFocus: coachingFocus,
    practiceRecommendation: practiceRec,
    unknowns: ['Stakeholder priorities not confirmed', ...(!companyContext ? ['Company pricing and discount policy'] : [])],
    risks: notes.includes('pric') ? ['Pricing pressure may test value positioning.'] : ['Specific risks need more context.'],
    whyPersonalized: capabilityHistory?.some(c => c.scores.length > 0)
      ? `Your recent performance history informed the focus on ${coachingFocus}.`
      : 'No observed performance history yet. This plan is based on the interaction context.',
    sourceMode: companyContext ? 'COMPANY_COACH' : 'GENERAL_COACH',
    companySource: companyContext ? 'Approved company context' : 'No company context connected',
    priorLearning,
    sourceProvenance: { objective: 'CUSTOMER_CONTEXT', relevantContext: 'CUSTOMER_CONTEXT', commercialGuidance: companyContext ? 'COMPANY_POLICY' : 'UNKNOWN', personalCoachingFocus: capabilityHistory?.some(c => c.scores.length) ? 'EMPLOYEE_HISTORY' : 'MODEL_RECOMMENDATION', likelyObjections: 'MODEL_RECOMMENDATION' },
    generatedAt: new Date().toISOString(),
  };
}

function extractPriorities(notes: string): string[] {
  const p: string[] = [];
  if (notes.includes('cost') || notes.includes('budget') || notes.includes('pric')) p.push('Cost reduction');
  if (notes.includes('implementation') || notes.includes('delay')) p.push('Implementation certainty');
  if (notes.includes('roi') || notes.includes('value')) p.push('ROI demonstration');
  if (notes.includes('competitor')) p.push('Vendor validation');
  return p.length ? p : ['Not confirmed — ask the stakeholder.'];
}

function extractContext(notes: string): string[] {
  const c: string[] = [];
  if (notes.includes('renewal')) c.push('Renewal situation — relationship history matters');
  if (notes.includes('competitor')) c.push('Active competitive situation');
  if (notes.includes('delay')) c.push('Recent service issues may create negative sentiment');
  return c.length ? c : ['No customer context provided yet.'];
}

// ============================================================================
// ROLEPLAY CONFIG
// ============================================================================

export function generateRoleplayConfig(interaction: Interaction, brief: PreparationBrief): RoleplayConfig {
  if (interaction.scenarioPlan) return { ...interaction.scenarioPlan, targetCapability: interaction.focusCapability || 'Objection Handling', employeeCapabilityState: brief.whyPersonalized, performancePlan: brief.personalCoachingFocus };
  const notes = `${interaction.notes || ''} ${interaction.additionalContext || ''}`.toLowerCase();
  const role = interaction.stakeholderRole || 'Stakeholder';
  const personality = notes.includes('skeptic') ? 'Skeptical and direct.' : 'Professional and curious.';
  const pressure: 'low' | 'medium' | 'high' = interaction.priority === 'high' ? 'high' : interaction.priority === 'low' ? 'low' : 'medium';

  return {
    stakeholderRole: role, personality, pressureLevel: pressure,
    objectives: [interaction.objective || 'Understand the proposal', brief.personalCoachingFocus],
    likelyObjections: brief.likelyObjections.slice(0, 3),
    commercialConstraints: 'Only use constraints explicitly stated in the interaction context.',
    hiddenPriorities: [],
    desiredOutcome: interaction.objective || 'Determine a useful next step.',
    interactionContext: `${interaction.name}; ${interaction.customer}; ${interaction.agenda}; ${interaction.notes || ''}; ${interaction.additionalContext || ''}`,
    performancePlan: `${brief.objective}; ${brief.personalCoachingFocus}; ${brief.recommendedQuestions.join('; ')}`,
    targetCapability: interaction.focusCapability || 'Objection Handling',
    employeeCapabilityState: brief.whyPersonalized || 'Insufficient performance evidence',
  };
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
Use 3-5 concise items per list. Make the objection ladder progress only after the seller has handled the earlier concern.
Pressure design: foundation is collaborative and gives context after a good question; standard is skeptical and tests one concern at a time; advanced is time-constrained, asks for evidence, raises trade-offs, and escalates only when earned.`;
  const userPrompt = `Practice module: ${moduleLabels[deal.module]}
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
  const data: Record<string, unknown> = JSON.parse(response.content);
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

// ============================================================================
// PRACTICE EVALUATION
// ============================================================================

export async function generatePracticeEvaluation(
  turns: { role: string; content: string }[], 
  config: RoleplayConfig,
  sessionId?: string
): Promise<PracticeEvaluation> {
  // Check at runtime if backend is available
  if (isLLMAvailable()) {
    // CRITICAL: In LIVE MODE, do NOT silently fall back to mock
    // If LLM call fails, throw error so user knows something went wrong
    return await generateEvalWithLLM(turns, config, sessionId);
  }
  // Only use mock in DEMO MODE
  return generateEvalMock(turns, config, sessionId);
}

async function generateEvalWithLLM(
  turns: { role: string; content: string }[], 
  config: RoleplayConfig,
  sessionId?: string
): Promise<PracticeEvaluation> {
  const provider = createLLMProvider();
  
  // Format conversation with turn numbers for evidence traceability
  const conversation = turns.map((t, i) => `[Turn ${i + 1}] ${t.role === 'ai' ? config.stakeholderRole : 'Employee'}: ${t.content}`).join('\n');
  const extracted = await provider.chat([
    { role: 'system', content: 'Extract only observable employee behaviours from the practice conversation. Return JSON {"evidence":[{"turnNumber":1,"sourceText":"exact employee words","behaviorObserved":"observable behaviour","classification":"OBSERVED"}]}. Every sourceText must be an exact substring of the cited employee turn. No recommendation is evidence. If none, return an empty array.' },
    { role: 'user', content: conversation },
  ], { temperature: 0.1, jsonMode: true, operation: 'PRACTICE_EVIDENCE_EXTRACTION' });
  const extractionData = JSON.parse(extracted.content);
  const groundedEvidence: EvidenceItem[] = (Array.isArray(extractionData.evidence) ? extractionData.evidence : []).flatMap((item: any) => {
    const turnNumber = Number(item.turnNumber);
    const turn = turns[turnNumber - 1];
    const quote = String(item.sourceText || '').trim();
    if (!turn || turn.role !== 'user' || quote.length < 3 || !turn.content.includes(quote)) return [];
    return [{
      evidenceId: uuidv4(), interactionId: '', sessionId: sessionId || '', sourceType: 'PRACTICE' as const,
      sourceId: sessionId || '', speaker: 'Employee', sourceText: quote,
      behaviorObserved: String(item.behaviorObserved || 'Employee response'),
      classification: 'OBSERVED' as const, statement: String(item.behaviorObserved || 'Employee response'),
      source: 'roleplay' as const, confidence: 0.8, observationType: 'observed' as const, turnNumber,
    }];
  });
  
  const systemPrompt = `You are an expert sales coach evaluating objection handling. You MUST follow this exact rubric.

STEP 1: IDENTIFY THE BEHAVIOR
Look at what the employee ACTUALLY DID in their response:
- Did they acknowledge the concern? (Say "I understand", "I hear you", etc.)
- Did they ask a clarifying question? (Ask "what", "how", "why", "can you help me understand")
- Did they reframe around value? (Mention "value", "worth", "impact", "cost of", "investment", "return")
- Did they offer a discount/concession? (Mention "discount", "reduce", "%", "price match")
- Did they argue or dismiss? (Say "actually", "but", "you're wrong", "not true")

STEP 2: APPLY THE RUBRIC STRICTLY

LEVEL 1 (Score 1.0-1.8) - NOVICE:
- Employee argues, dismisses, or ignores the concern
- Employee immediately offers discount without exploring
- Employee makes unsupported claims ("we're the best", "our pricing is competitive")
- NO acknowledgment of the concern

LEVEL 2 (Score 2.0-2.8) - DEVELOPING:
- Employee acknowledges the concern BUT doesn't ask clarifying questions
- Employee gives generic responses without addressing the specific concern
- Employee says "I understand" but moves to solution without exploring

LEVEL 3 (Score 3.0-3.8) - FUNCTIONAL:
- Employee acknowledges AND asks specific clarifying questions
- Employee identifies specific aspects of the concern
- Employee maintains conversational control

LEVEL 4 (Score 4.0-4.5) - STRONG:
- Employee acknowledges AND reframes around business value
- Employee asks about cost of inaction or business impact
- Employee preserves commercial discipline (no discount)

LEVEL 5 (Score 4.6-5.0) - ADVANCED:
- Employee handles multiple objections in sequence
- Employee identifies hidden priorities or underlying concerns
- Employee offers structural alternatives
- Employee maintains control while building trust

STEP 3: CHECK FOR BIAS
DO NOT give high scores for:
- Long responses without substance
- Polite language without addressing the concern
- Jargon without clarity
- Verbosity

STEP 4: PROVIDE EVIDENCE
For each piece of evidence, you MUST:
- Reference the specific turn number
- State what was OBSERVED (directly in the text)
- Mark as "observed" or "inferred"

Output JSON with this exact structure:
{
  "objectionHandlingScore": <number 1.0-5.0>,
  "objectionHandlingLevel": <number 1-5>,
  "evidence": [
    {
      "turnNumber": <number>,
      "statement": "<specific behavior observed>",
      "observationType": "observed|inferred",
      "confidence": <number 0.0-1.0>
    }
  ],
  "strength": "<specific strength>",
  "weakness": "<specific weakness>",
  "recommendedIntervention": "<specific practice>",
  "overallReadiness": <number 0-100>,
  "otherCapabilities": []
}`;

  const response = await provider.chat(
    [{ role: 'system', content: `${systemPrompt}\nOnly evaluate behaviours in the supplied evidence. If evidence is empty, score 0 and overallReadiness 0; report insufficient evidence.` }, { role: 'user', content: `Scenario: ${config.stakeholderRole}\nEvidence: ${JSON.stringify(groundedEvidence)}\n\n${conversation}` }],
    { temperature: 0.2, jsonMode: true, operation: 'PRACTICE_CAPABILITY_EVALUATION' }
  );

  const data = JSON.parse(response.content);
  
  // Validate evidence has turn references
  const validatedEvidence = groundedEvidence;
  let supportedScore = validatedEvidence.length > 0 && Number(data.objectionHandlingScore) >= 1 && Number(data.objectionHandlingScore) <= 5
    ? Number(data.objectionHandlingScore) : 0;
  if (supportedScore) {
    const verdict = await judgeCapabilityAssessment({
      capability: 'Objection Handling', score: supportedScore,
      evidence: validatedEvidence.map(item => ({ statement: `${item.behaviorObserved}: ${item.sourceText}`, observationType: item.observationType || 'observed' })),
    });
    if (verdict.verdict !== 'PASS') supportedScore = 0;
  }
  let nextPractice = 'Practice a fuller conversation so your coach can observe the target behaviour.';
  if (supportedScore) {
    const recommendation = await provider.chat([
      { role: 'system', content: 'Recommend exactly one short practice intervention for the diagnosed objection-handling gap. Ground the recommendation in supplied evidence. Return JSON {"recommendation":"specific exercise","successCriterion":"observable success criterion"}. Do not call a recommendation evidence.' },
      { role: 'user', content: JSON.stringify({ score: supportedScore, weakness: data.weakness, evidence: validatedEvidence }) },
    ], { temperature: 0.2, jsonMode: true, operation: 'PRACTICE_INTERVENTION_GENERATION' });
    const recommendationData = JSON.parse(recommendation.content);
    nextPractice = `${String(recommendationData.recommendation || data.recommendedIntervention || 'Practice the identified gap.')} Success: ${String(recommendationData.successCriterion || 'Demonstrate the target behaviour in the next practice.')}`;
  }

  return {
    id: uuidv4(), 
    sessionId: sessionId || '', 
    interactionId: '',
    overallReadiness: supportedScore ? Number(data.overallReadiness) || 0 : 0,
    readiness: !supportedScore ? 'INSUFFICIENT_EVIDENCE' : supportedScore >= 3.5 ? 'READY' : supportedScore >= 2.5 ? 'READY_ONE_RISK_REMAINS' : 'PRACTICE_ONCE_MORE',
    capabilityScores: [
      {
        capability: 'Objection Handling', score: supportedScore, level: supportedScore ? data.objectionHandlingLevel : 1,
        evidence: supportedScore ? validatedEvidence : [],
        strength: supportedScore ? data.strength : undefined, weakness: supportedScore ? data.weakness : undefined, recommendedIntervention: nextPractice, confidence: supportedScore ? 0.85 : 0,
      },
    ],
    strengths: supportedScore && data.strength ? [data.strength] : [],
    weaknesses: supportedScore && data.weakness ? [data.weakness] : [],
    nextPractice,
    generatedAt: new Date().toISOString(),
  };
}

function generateEvalMock(
  turns: { role: string; content: string }[], 
  _config: RoleplayConfig,
  sessionId?: string
): PracticeEvaluation {
  const userTurns = turns.map((turn, index) => ({ ...turn, turnNumber: index + 1 })).filter(t => t.role === 'user');
  
  // Adversarial detection: verbosity without substance
  const avgTurnLength = userTurns.reduce((sum, t) => sum + t.content.length, 0) / Math.max(userTurns.length, 1);
  const isVerbose = avgTurnLength > 200;
  const hasSubstance = userTurns.some(t => 
    /understand|clarify|value|worth|impact|question|concern/i.test(t.content) && 
    t.content.length < 300
  );
  
  // Adversarial detection: politeness without addressing concern
  const isPolite = userTurns.some(t => /thank|appreciate|understand/i.test(t.content));
  const addressesConcern = userTurns.some(t => 
    t.content.includes('?') || 
    /value|worth|impact|switching|concern|driving/i.test(t.content)
  );
  
  // Adversarial detection: jargon without clarity
  const hasJargon = userTurns.some(t => /synergy|leverage|paradigm|holistic|scalable/i.test(t.content));
  const hasClarity = userTurns.some(t => t.content.length < 150 && /value|concern|question/i.test(t.content));
  
  // Core behavioral detection
  const hasAck = userTurns.some(t => /\b(?:I understand|I hear you|I appreciate|that sounds|I can see)\b/i.test(t.content));
  const hasClarify = userTurns.some(t => t.content.includes('?') && /help me understand|tell me more|what specifically|what's driving/i.test(t.content));
  const hasValue = userTurns.some(t => /value|worth|impact|switching|cost of|investment/i.test(t.content));
  const hasDiscount = userTurns.some(t => /(?:offer|give|provide|apply) (?:you )?(?:a )?(?:\d+% )?discount|(?:reduce|lower) (?:the )?price by|\d+% off/i.test(t.content));
  
  // Scoring logic with adversarial adjustments
  let score = 2.0, level: 1|2|3|4|5 = 2;
  
  // Adversarial penalty: verbose but empty
  if (isVerbose && !hasSubstance) {
    score = 1.5;
    level = 1;
  }
  // Adversarial penalty: polite but doesn't address concern
  else if (isPolite && !addressesConcern) {
    score = 1.8;
    level = 2;
  }
  // Adversarial penalty: jargon without clarity
  else if (hasJargon && !hasClarity) {
    score = 1.8;
    level = 2;
  }
  // Normal scoring
  else if (hasAck && hasClarify && hasValue && !hasDiscount) { score = 4.0; level = 4; }
  else if (hasAck && hasClarify && !hasDiscount) { score = 3.0; level = 3; }
  else if (hasAck && !hasDiscount) { score = 2.5; level = 2; }
  else if (hasDiscount) { score = 1.8; level = 2; }

  // Evidence with turn references for traceability
  const evidence: EvidenceItem[] = [];
  userTurns.forEach((turn) => {
    const turnNum = turn.turnNumber;
    if (/\b(?:I understand|I hear you|I appreciate|that sounds|I can see)\b/i.test(turn.content)) {
      evidence.push({ 
        statement: `Turn ${turnNum}: Acknowledged concern - "${turn.content.substring(0, 50)}..."`, 
        source: 'roleplay', 
        confidence: 0.9, 
        observationType: 'observed',
        turnNumber: turnNum,
        evidenceId: uuidv4(), sessionId: sessionId || '', sourceId: sessionId || '', sourceType: 'PRACTICE', speaker: 'Employee', sourceText: turn.content, behaviorObserved: 'Acknowledged concern', classification: 'OBSERVED',
      });
    }
    if (turn.content.includes('?') && /help me understand|tell me more|what specifically|what's driving/i.test(turn.content)) {
      evidence.push({ 
        statement: `Turn ${turnNum}: Asked clarifying question - "${turn.content.substring(0, 50)}..."`, 
        source: 'roleplay', 
        confidence: 0.85, 
        observationType: 'observed',
        turnNumber: turnNum,
        evidenceId: uuidv4(), sessionId: sessionId || '', sourceId: sessionId || '', sourceType: 'PRACTICE', speaker: 'Employee', sourceText: turn.content, behaviorObserved: 'Asked a clarifying question', classification: 'OBSERVED',
      });
    }
    if (/value|worth|impact|switching|cost of|investment/i.test(turn.content)) {
      evidence.push({ 
        statement: `Turn ${turnNum}: Reframed around value - "${turn.content.substring(0, 50)}..."`, 
        source: 'roleplay', 
        confidence: 0.85, 
        observationType: 'observed',
        turnNumber: turnNum,
        evidenceId: uuidv4(), sessionId: sessionId || '', sourceId: sessionId || '', sourceType: 'PRACTICE', speaker: 'Employee', sourceText: turn.content, behaviorObserved: 'Discussed value or impact', classification: 'OBSERVED',
      });
    }
    if (/(?:offer|give|provide|apply) (?:you )?(?:a )?(?:\d+% )?discount|(?:reduce|lower) (?:the )?price by|\d+% off/i.test(turn.content)) {
      evidence.push({ 
        statement: `Turn ${turnNum}: Offered discount - "${turn.content.substring(0, 50)}..."`, 
        source: 'roleplay', 
        confidence: 0.9, 
        observationType: 'observed',
        turnNumber: turnNum,
        evidenceId: uuidv4(), sessionId: sessionId || '', sourceId: sessionId || '', sourceType: 'PRACTICE', speaker: 'Employee', sourceText: turn.content, behaviorObserved: 'Offered a concession', classification: 'OBSERVED',
      });
    }
  });

  const scores: CapabilityScore[] = [
    {
      capability: 'Objection Handling', score: evidence.length ? score : 0, level, evidence,
      strength: hasValue ? 'Reframed around value' : hasClarify ? 'Asked clarifying questions' : undefined,
      weakness: hasDiscount ? 'Discounted before exploring alternatives' : !hasClarify ? 'Did not ask clarifying questions' : isVerbose && !hasSubstance ? 'Verbose response without substance' : undefined,
      recommendedIntervention: hasDiscount ? 'Practice preserving value under pricing pressure.' : !hasClarify ? 'Practice: "Can you help me understand what\'s driving that concern?"' : isVerbose && !hasSubstance ? 'Practice concise, substantive responses that address the concern directly.' : 'Practice handling layered objections.',
      confidence: 0.85,
    },
  ];

  return {
    id: uuidv4(), 
    sessionId: sessionId || '', 
    interactionId: '',
    overallReadiness: evidence.length ? Math.min(100, Math.round((score / 5) * 100)) : 0,
    readiness: !evidence.length ? 'INSUFFICIENT_EVIDENCE' : score >= 3.5 ? 'READY' : score >= 2.5 ? 'READY_ONE_RISK_REMAINS' : 'PRACTICE_ONCE_MORE',
    capabilityScores: scores,
    strengths: scores.filter(c => c.strength).map(c => c.strength!),
    weaknesses: scores.filter(c => c.weakness).map(c => c.weakness!),
    nextPractice: scores[0].recommendedIntervention || 'Continue practice',
    generatedAt: new Date().toISOString(),
  };
}

// ============================================================================
// TRANSCRIPT ANALYSIS
// ============================================================================

// Re-export analyzeTranscript from the enhanced transcript-analyzer module
export { analyzeTranscript } from './transcript-analyzer';

// Legacy analyzeMock function kept for backward compatibility
// @ts-ignore - Legacy function kept for backward compatibility
function analyzeMockLegacy(transcript: string, interaction: Interaction, _brief: PreparationBrief): PostInteractionAnalysis {
  const lower = transcript.toLowerCase();
  const hasValue = /worth|savings|value|impact/i.test(lower);
  const hasObjection = /understand|i hear|let me address/i.test(lower);
  const hasNext = /next step|follow|schedule/i.test(lower);
  const score = hasObjection ? (hasValue ? 3.5 : 2.8) : 2.0;

  return {
    id: uuidv4(), interactionId: interaction.id, transcriptId: '',
    planVsActual: [
      { intended: 'Establish value before price', actual: hasValue ? 'Quantified business impact' : 'Moved to pricing early', impact: hasValue ? 'Low' : 'High', explanation: hasValue ? 'Value established first' : 'Reduces leverage' },
      { intended: 'Explore objections', actual: hasObjection ? 'Acknowledged and explored' : 'Responded without exploration', impact: hasObjection ? 'Low' : 'Medium', explanation: hasObjection ? 'Built trust' : 'Risk of wrong solution' },
      { intended: 'Secure next steps', actual: hasNext ? 'Specific follow-up set' : 'No firm next step', impact: hasNext ? 'Low' : 'High', explanation: hasNext ? 'Created momentum' : 'Deal stalls' },
    ],
    strengths: [hasValue ? 'Connected to business outcomes' : '', hasNext ? 'Strong next-step control' : '', hasObjection ? 'Acknowledged concerns' : ''].filter(Boolean),
    missedOpportunities: [!hasValue ? 'Did not quantify impact' : '', !hasObjection ? 'Did not explore objections' : ''].filter(Boolean),
    capabilityDiagnosis: [{
      capability: 'Objection Handling', score, level: Math.ceil(score) as any,
      evidence: [{ statement: hasObjection ? 'Acknowledged concerns' : 'Did not acknowledge', source: 'transcript', confidence: 0.85, observationType: 'observed' }],
      confidence: 0.85,
    }],
    repeatedPatterns: [],
    likelyImpact: hasValue && hasNext ? 'Strong interaction with momentum' : 'Needs improvement',
    nextIntervention: { id: uuidv4(), title: 'Objection Handling Development', description: `Objection Handling (${score}/5) needs focus.`, targetCapability: 'Objection Handling', recommendedAction: hasObjection ? 'Practice layered objections' : 'Practice acknowledging before responding', estimatedDuration: '7-10 minutes', priority: score < 3 ? 'high' : 'medium' },
    generatedAt: new Date().toISOString(),
  };
}

// ============================================================================
// ROLEPLAY RESPONSES
// ============================================================================

export function resetRoleplayState() {
  // Session state is held in PracticeSession; no shared module state.
}

export interface RoleplayResponse {
  response: string;
  sessionId?: string;
  conversationState?: string;
  aiMeta?: any;
}

export async function getRoleplayResponse(
  userMessage: string, 
  config: RoleplayConfig,
  conversationHistory?: { role: 'ai' | 'user'; content: string }[],
  sessionId?: string
): Promise<RoleplayResponse> {
  // Check at runtime if backend is available
  if (isLLMAvailable()) {
    try { 
      return await getRoleplayLLM(userMessage, config, conversationHistory, sessionId); 
    }
    catch (e) { 
      console.error('LLM roleplay failed:', e);
      // CRITICAL: In LIVE MODE, do NOT silently fall back to mock
      // Throw error so user knows something went wrong
      throw new Error(`LIVE AI ERROR: Roleplay generation failed. ${e}`);
    }
  }
  // Only use mock in DEMO MODE
  return {
    response: getRoleplayMock(userMessage, config, conversationHistory || []),
    sessionId: sessionId,
    conversationState: 'IN_PROGRESS'
  };
}

async function getRoleplayLLM(
  userMessage: string, 
  config: RoleplayConfig,
  conversationHistory?: { role: 'ai' | 'user'; content: string }[],
  sessionId?: string
): Promise<RoleplayResponse> {
  // Use the specialized RoleplayProvider that calls the dedicated endpoint
  const result = await RoleplayProvider.getRoleplayResponse(
    userMessage,
    config,
    conversationHistory || [],
    sessionId
  );
  
  return result;
}

function getRoleplayMock(userMessage: string, config: RoleplayConfig, history: { role: 'ai' | 'user'; content: string }[]): string {
  const lower = userMessage.toLowerCase();
  const concern = config.likelyObjections[0] || 'I need to understand why this is the right decision.';
  if (!history.length) return `Thanks for meeting. ${concern} How would you approach that?`;
  if (/discount|reduce|price match|%/.test(lower)) return 'Before I consider that, how would the change address the concern I raised?';
  if (userMessage.includes('?')) return `The issue for me is ${concern.replace(/^possible /i, '').replace(/[.!?]$/, '').toLowerCase()}. What would change for us?`;
  if (/next step|follow.up|schedule|send (you|me)/.test(lower)) return 'That could work. What specifically will you send, and when?';
  if (/value|impact|outcome|benefit/.test(lower)) return 'I see the point. Can you connect that to the outcome we need from this interaction?';
  return `I hear you. ${concern} What evidence can you give me?`;
}

// ============================================================================
// CAPABILITY HISTORY
// ============================================================================

// Re-export updateCapabilityHistory from the enhanced capability-memory module
export { updateCapabilityHistory } from './capability-memory';
