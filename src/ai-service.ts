import { Interaction, PreparationBrief, RoleplayConfig, PracticeEvaluation, CapabilityScore, PostInteractionAnalysis, CapabilityHistory, CapabilityName, EvidenceItem } from './types';
import { createLLMProvider, isLLMAvailable } from './llm-provider';
import { calculateWeightedScore, detectPatterns } from './capability-memory';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// PREPARATION BRIEF
// ============================================================================

export async function generateBrief(
  interaction: Interaction,
  capabilityHistory?: CapabilityHistory[]
): Promise<PreparationBrief> {
  // Check at runtime if backend is available
  if (isLLMAvailable()) {
    // CRITICAL: In LIVE MODE, do NOT silently fall back to mock
    // If LLM call fails, throw error so user knows something went wrong
    return await generateBriefWithLLM(interaction, capabilityHistory);
  }
  // Only use mock in DEMO MODE
  return generateBriefMock(interaction, capabilityHistory);
}

async function generateBriefWithLLM(
  interaction: Interaction,
  capabilityHistory?: CapabilityHistory[]
): Promise<PreparationBrief> {
  const provider = createLLMProvider();
  const systemPrompt = `You are an AI performance coach for enterprise sales. Generate a concise preparation brief.
CRITICAL: Never invent pricing, discounts, or policies. If unknown, state "Not provided."
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
  "practiceRecommendation": "practice text based on capability history"
}`;

  // Build capability context from history
  let capabilityContext = 'No capability history available.';
  if (capabilityHistory && capabilityHistory.length > 0) {
    const capabilities = capabilityHistory.map(cap => {
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

Generate a personalized brief that addresses the employee's specific risks based on their capability history.`;

  const response = await provider.chat(
    [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
    { temperature: 0.7, jsonMode: true }
  );

  const data = JSON.parse(response.content);
  return {
    id: uuidv4(), interactionId: interaction.id,
    objective: data.objective, stakeholderPriorities: data.stakeholderPriorities,
    relevantContext: data.relevantContext, commercialGuidance: data.commercialGuidance,
    likelyObjections: data.likelyObjections, recommendedQuestions: data.recommendedQuestions,
    recommendedPositioning: data.recommendedPositioning, thingsToAvoid: data.thingsToAvoid,
    personalCoachingFocus: data.personalCoachingFocus, practiceRecommendation: data.practiceRecommendation,
    generatedAt: new Date().toISOString(),
  };
}

function generateBriefMock(interaction: Interaction, capabilityHistory?: CapabilityHistory[]): PreparationBrief {
  const notes = (interaction.notes || '').toLowerCase();
  
  // Build personalized coaching focus from capability history
  let coachingFocus = 'Focus on core objection handling techniques.';
  let practiceRec = 'Practice handling common objections. Duration: 7-10 minutes.';
  
  if (capabilityHistory && capabilityHistory.length > 0) {
    // Find weakest capability
    const weakest = capabilityHistory
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
      discountLimits: 'Not provided / requires confirmation.',
      relevantPackage: 'Core platform renewal with potential expansion.',
      tradeOffs: ['Payment timing vs. total contract value', 'Phased rollout vs. full deployment'],
      escalationItems: ['Discounts above authority require manager approval'],
      note: 'Confirm discount authority with your manager before the meeting.',
    },
    likelyObjections: notes.includes('pric') ? ['"Your pricing is too high"', '"We got a lower quote"'] : ['"We need more time"'],
    recommendedQuestions: ['What does success look like?', 'What\'s the business impact?', 'Who else is involved?'],
    recommendedPositioning: notes.includes('renewal') ? ['Lead with invested value', 'Quantify switching costs'] : ['Connect to specific pain'],
    thingsToAvoid: ['Don\'t lead with pricing', 'Don\'t rush past objections', 'Don\'t discount without authority'],
    personalCoachingFocus: coachingFocus,
    practiceRecommendation: practiceRec,
    generatedAt: new Date().toISOString(),
  };
}

function extractPriorities(notes: string): string[] {
  const p: string[] = [];
  if (notes.includes('cost') || notes.includes('budget') || notes.includes('pric')) p.push('Cost reduction');
  if (notes.includes('implementation') || notes.includes('delay')) p.push('Implementation certainty');
  if (notes.includes('roi') || notes.includes('value')) p.push('ROI demonstration');
  if (notes.includes('competitor')) p.push('Vendor validation');
  return p.length ? p : ['Understanding challenges', 'Clear next steps'];
}

function extractContext(notes: string): string[] {
  const c: string[] = [];
  if (notes.includes('renewal')) c.push('Renewal situation — relationship history matters');
  if (notes.includes('competitor')) c.push('Active competitive situation');
  if (notes.includes('delay')) c.push('Recent service issues may create negative sentiment');
  return c.length ? c : ['Use provided context'];
}

// ============================================================================
// ROLEPLAY CONFIG
// ============================================================================

export function generateRoleplayConfig(_interaction: Interaction, brief: PreparationBrief): RoleplayConfig {
  const notes = (_interaction.notes || '').toLowerCase();
  let role = 'Decision Maker', personality = 'Analytical and direct.', pressure: 'low' | 'medium' | 'high' = 'medium';
  
  if (notes.includes('cfo')) { role = 'CFO'; personality = 'Financially focused, skeptical.'; pressure = 'high'; }
  else if (notes.includes('vp')) { role = 'VP Operations'; personality = 'Frustrated with delays.'; pressure = 'medium'; }

  return {
    stakeholderRole: role, personality, pressureLevel: pressure,
    objectives: ['Test value establishment before price', 'Challenge with realistic objections', 'Assess commercial discipline'],
    likelyObjections: brief.likelyObjections.slice(0, 3),
    commercialConstraints: 'Budget under scrutiny. Switching being considered.',
    hiddenPriorities: ['Needs to look good to board', 'Reputation tied to decision'],
    desiredOutcome: 'Secure renewal on strong terms before discussing expansion.',
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
    [{ role: 'system', content: systemPrompt }, { role: 'user', content: `Scenario: ${config.stakeholderRole}\n\n${conversation}` }],
    { temperature: 0.2, jsonMode: true }
  );

  const data = JSON.parse(response.content);
  
  // Validate evidence has turn references
  const validatedEvidence = data.evidence.map((e: any) => ({
    statement: e.statement,
    source: 'roleplay' as const,
    confidence: e.confidence,
    observationType: e.observationType,
    turnNumber: e.turnNumber, // Critical for traceability
  }));

  return {
    id: uuidv4(), 
    sessionId: sessionId || '', 
    interactionId: '',
    overallReadiness: data.overallReadiness,
    capabilityScores: [
      {
        capability: 'Objection Handling', score: data.objectionHandlingScore, level: data.objectionHandlingLevel,
        evidence: validatedEvidence,
        strength: data.strength, weakness: data.weakness, recommendedIntervention: data.recommendedIntervention, confidence: 0.85,
      },
      ...data.otherCapabilities.map((c: any) => ({
        capability: c.capability as CapabilityName, score: c.score, level: Math.ceil(c.score) as any,
        evidence: [{ statement: c.evidence, source: 'roleplay' as const, confidence: 0.8, observationType: 'observed' }], confidence: 0.8,
      })),
    ],
    strengths: data.strength ? [data.strength] : [],
    weaknesses: data.weakness ? [data.weakness] : [],
    nextPractice: data.recommendedIntervention,
    generatedAt: new Date().toISOString(),
  };
}

function generateEvalMock(
  turns: { role: string; content: string }[], 
  _config: RoleplayConfig,
  sessionId?: string
): PracticeEvaluation {
  const userTurns = turns.filter(t => t.role === 'user');
  
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
  const hasAck = userTurns.some(t => /understand|hear|appreciate/i.test(t.content));
  const hasClarify = userTurns.some(t => t.content.includes('?') && /help me understand|tell me more|what specifically|what's driving/i.test(t.content));
  const hasValue = userTurns.some(t => /value|worth|impact|switching|cost of|investment/i.test(t.content));
  const hasDiscount = userTurns.some(t => /discount|reduce|%/i.test(t.content));
  
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
  userTurns.forEach((turn, idx) => {
    const turnNum = idx + 1;
    if (/understand|hear|appreciate/i.test(turn.content)) {
      evidence.push({ 
        statement: `Turn ${turnNum}: Acknowledged concern - "${turn.content.substring(0, 50)}..."`, 
        source: 'roleplay', 
        confidence: 0.9, 
        observationType: 'observed',
        turnNumber: turnNum 
      });
    }
    if (turn.content.includes('?') && /help me understand|tell me more|what specifically|what's driving/i.test(turn.content)) {
      evidence.push({ 
        statement: `Turn ${turnNum}: Asked clarifying question - "${turn.content.substring(0, 50)}..."`, 
        source: 'roleplay', 
        confidence: 0.85, 
        observationType: 'observed',
        turnNumber: turnNum 
      });
    }
    if (/value|worth|impact|switching|cost of|investment/i.test(turn.content)) {
      evidence.push({ 
        statement: `Turn ${turnNum}: Reframed around value - "${turn.content.substring(0, 50)}..."`, 
        source: 'roleplay', 
        confidence: 0.85, 
        observationType: 'observed',
        turnNumber: turnNum 
      });
    }
    if (/discount|reduce|%/i.test(turn.content)) {
      evidence.push({ 
        statement: `Turn ${turnNum}: Offered discount - "${turn.content.substring(0, 50)}..."`, 
        source: 'roleplay', 
        confidence: 0.9, 
        observationType: 'observed',
        turnNumber: turnNum 
      });
    }
  });

  const scores: CapabilityScore[] = [
    {
      capability: 'Objection Handling', score, level, evidence,
      strength: hasValue ? 'Reframed around value' : hasClarify ? 'Asked clarifying questions' : undefined,
      weakness: hasDiscount ? 'Discounted before exploring alternatives' : !hasClarify ? 'Did not ask clarifying questions' : isVerbose && !hasSubstance ? 'Verbose response without substance' : undefined,
      recommendedIntervention: hasDiscount ? 'Practice preserving value under pricing pressure.' : !hasClarify ? 'Practice: "Can you help me understand what\'s driving that concern?"' : isVerbose && !hasSubstance ? 'Practice concise, substantive responses that address the concern directly.' : 'Practice handling layered objections.',
      confidence: 0.85,
    },
    {
      capability: 'Commercial Discipline', score: hasDiscount ? 2.0 : 3.2, level: hasDiscount ? 2 : 3,
      evidence: [{ statement: hasDiscount ? 'Offered price concession' : 'Maintained boundaries', source: 'roleplay', confidence: 0.85, observationType: 'observed' }],
      confidence: 0.8,
    },
  ];

  return {
    id: uuidv4(), 
    sessionId: sessionId || '', 
    interactionId: '',
    overallReadiness: Math.min(100, Math.round((scores.reduce((s, c) => s + c.score, 0) / scores.length / 5) * 100)),
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

let roleplayState = { turnCount: 0, objectionIntroduced: false };

export function resetRoleplayState() {
  roleplayState = { turnCount: 0, objectionIntroduced: false };
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
    response: getRoleplayMock(userMessage, config),
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
  roleplayState.turnCount++;
  
  // Use the specialized RoleplayProvider that calls the dedicated endpoint
  const { RoleplayProvider } = await import('./llm-provider');
  
  const result = await RoleplayProvider.getRoleplayResponse(
    userMessage,
    config,
    conversationHistory || [],
    sessionId
  );
  
  return result;
}

function getRoleplayMock(userMessage: string, _config: RoleplayConfig): string {
  roleplayState.turnCount++;
  const lower = userMessage.toLowerCase();
  
  if (roleplayState.turnCount === 1) return "Thanks for meeting. We need to talk about the contract and pricing. We've been looking at options.";
  if (userMessage.includes('?') && roleplayState.turnCount < 4) return "Six months in and only 70% implementation. My team extended the legacy system because of your delays.";
  if (!roleplayState.objectionIntroduced && roleplayState.turnCount >= 3) {
    roleplayState.objectionIntroduced = true;
    return "I appreciate that, but DataFlow Pro quoted us 15% less. What can you do on price?";
  }
  if (/discount|%|reduce/i.test(lower)) return "My counterpart pays 30% less. Can you match that?";
  if (/value|worth|switching/i.test(lower)) return "That's... actually a fair point. I hadn't thought about switching costs.";
  if (/understand|help me/i.test(lower)) return "Okay, I'm listening. What does that look like?";
  if (roleplayState.turnCount < 6) return "I need a concrete number. What's the best you can do?";
  return "Okay, send me the proposal by Friday.";
}

// ============================================================================
// CAPABILITY HISTORY
// ============================================================================

// Re-export updateCapabilityHistory from the enhanced capability-memory module
export { updateCapabilityHistory } from './capability-memory';
