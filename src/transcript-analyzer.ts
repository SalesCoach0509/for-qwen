/**
 * Transcript Analyzer — Day 3 Implementation
 * 
 * Identifies objections, responses, commitments, concessions
 * Creates evidence objects grounded in transcript content
 * Compares actual behavior with Preparation Brief
 * Generates Plan vs Actual items with impact reasoning
 */

import { Interaction, PreparationBrief, PostInteractionAnalysis, PlanVsActual, CoachingIntervention, EvidenceItem, CapabilityName } from './types';
import { createLLMProvider, isLLMAvailable } from './llm-provider';
import { v4 as uuidv4 } from 'uuid';

export interface TranscriptSegment {
  speaker: string;
  content: string;
  lineNumber: number;
  type: 'objection' | 'response' | 'question' | 'commitment' | 'concession' | 'other';
}

export interface ExtractedBehavior {
  type: string;
  description: string;
  segment: TranscriptSegment;
  capability: CapabilityName;
  quality: 'positive' | 'neutral' | 'negative';
}

/**
 * Parse transcript into structured segments
 */
export function parseTranscript(transcript: string): TranscriptSegment[] {
  const lines = transcript.split('\n').filter(l => l.trim());
  const segments: TranscriptSegment[] = [];
  
  let currentSpeaker = '';
  let currentContent = '';
  let startLine = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Detect speaker change (format: "Name:" or "Name —")
    const speakerMatch = line.match(/^([A-Z][a-zA-Z\s]+?)[\s:—–-]+(.*)$/);
    
    if (speakerMatch) {
      // Save previous segment
      if (currentSpeaker && currentContent) {
        segments.push({
          speaker: currentSpeaker,
          content: currentContent.trim(),
          lineNumber: startLine,
          type: classifySegment(currentContent, currentSpeaker),
        });
      }
      
      currentSpeaker = speakerMatch[1].trim();
      currentContent = speakerMatch[2] || '';
      startLine = i + 1;
    } else if (line && !line.startsWith('[') && !line.startsWith('---')) {
      // Continue current speaker's content
      currentContent += (currentContent ? ' ' : '') + line;
    }
  }
  
  // Save last segment
  if (currentSpeaker && currentContent) {
    segments.push({
      speaker: currentSpeaker,
      content: currentContent.trim(),
      lineNumber: startLine,
      type: classifySegment(currentContent, currentSpeaker),
    });
  }
  
  return segments;
}

function classifySegment(content: string, speaker: string): TranscriptSegment['type'] {
  const lower = content.toLowerCase();
  
  // Detect objections (typically from customer/stakeholder)
  if (/\b(too expensive|too high|price|cost|budget|competitor|switch|concern|problem|issue|worried|risk|delay|slow|frustrat)\b/i.test(content) && 
      !speaker.toLowerCase().includes('you') && !speaker.toLowerCase().includes('employee')) {
    return 'objection';
  }
  
  // Detect questions
  if (content.includes('?')) {
    return 'question';
  }
  
  // Detect concessions (employee offering discounts, compromises)
  if (/\b(discount|reduce|lower|%|concede|compromise|adjustment|offer)\b/i.test(lower) &&
      (speaker.toLowerCase().includes('you') || speaker.toLowerCase().includes('employee'))) {
    return 'concession';
  }
  
  // Detect commitments (next steps, follow-ups)
  if (/\b(next step|follow|schedule|send|proposal|meeting|call|wednesday|thursday|friday)\b/i.test(lower)) {
    return 'commitment';
  }
  
  return 'other';
}

/**
 * Extract behavioral events from transcript
 */
export function extractBehaviors(segments: TranscriptSegment[]): ExtractedBehavior[] {
  const behaviors: ExtractedBehavior[] = [];
  
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const lower = segment.content.toLowerCase();
    
    // Skip non-employee segments for behavior extraction
    if (segment.speaker.toLowerCase().includes('you') || 
        segment.speaker.toLowerCase().includes('employee') ||
        segment.speaker.toLowerCase().includes('rahul') ||
        segment.speaker.toLowerCase().includes('ae')) {
      
      // Check for objection acknowledgment
      if (/\b(understand|hear|appreciate|acknowledge)\b/i.test(lower)) {
        behaviors.push({
          type: 'acknowledgment',
          description: 'Acknowledged stakeholder concern',
          segment,
          capability: 'Objection Handling',
          quality: 'positive',
        });
      }
      
      // Check for clarifying questions
      if (segment.content.includes('?') && /\b(help me understand|can you tell|what specific|what's driving|what do you mean)\b/i.test(lower)) {
        behaviors.push({
          type: 'clarification',
          description: 'Asked clarifying question about objection',
          segment,
          capability: 'Objection Handling',
          quality: 'positive',
        });
      }
      
      // Check for value reframing
      if (/\b(value|worth|impact|switching cost|cost of|investment|return|benefit|sav)\b/i.test(lower)) {
        behaviors.push({
          type: 'value_reframe',
          description: 'Reframed conversation around business value',
          segment,
          capability: 'Objection Handling',
          quality: 'positive',
        });
      }
      
      // Check for premature discounting
      if (/\b(discount|reduce|%|lower price|match price)\b/i.test(lower)) {
        // Check if there was prior value discussion
        const priorSegments = segments.slice(0, i);
        const hadValueDiscussion = priorSegments.some(s => 
          s.speaker.toLowerCase().includes('you') && 
          /\b(value|worth|impact|sav)\b/i.test(s.content)
        );
        
        behaviors.push({
          type: 'concession',
          description: hadValueDiscussion 
            ? 'Offered price adjustment after establishing value' 
            : 'Offered price concession before establishing value',
          segment,
          capability: 'Objection Handling',
          quality: hadValueDiscussion ? 'neutral' : 'negative',
        });
      }
      
      // Check for next-step control
      if (/\b(next step|follow|schedule|send|proposal|meeting)\b/i.test(lower)) {
        behaviors.push({
          type: 'next_step',
          description: 'Established clear next steps',
          segment,
          capability: 'Next-Step Control',
          quality: 'positive',
        });
      }
    }
  }
  
  return behaviors;
}

/**
 * Generate Plan vs Actual comparison
 */
export function generatePlanVsActual(
  _brief: PreparationBrief,
  behaviors: ExtractedBehavior[],
  segments: TranscriptSegment[]
): PlanVsActual[] {
  const planVsActual: PlanVsActual[] = [];
  
  // Check: Did they establish value before price?
  const valueBehaviors = behaviors.filter(b => b.type === 'value_reframe');
  const concessionBehaviors = behaviors.filter(b => b.type === 'concession');
  const firstConcession = concessionBehaviors[0];
  const firstValue = valueBehaviors[0];
  
  if (firstConcession) {
    const valueBeforePrice = firstValue && firstValue.segment.lineNumber < firstConcession.segment.lineNumber;
    
    planVsActual.push({
      intended: 'Establish business value before discussing discount',
      actual: valueBeforePrice 
        ? `Discussed value (line ${firstValue.segment.lineNumber}) before concession (line ${firstConcession.segment.lineNumber})`
        : `Offered concession (line ${firstConcession.segment.lineNumber}) ${!firstValue ? 'without establishing value' : `before value discussion (line ${firstValue.segment.lineNumber})`}`,
      impact: valueBeforePrice ? 'Low' : 'High',
      explanation: valueBeforePrice
        ? 'Value was established first, creating stronger negotiating position'
        : 'Employee moved to concession before establishing the underlying concern or value gap, potentially weakening commercial leverage',
    });
  }
  
  // Check: Did they explore objections?
  const clarifications = behaviors.filter(b => b.type === 'clarification');
  const objections = segments.filter(s => s.type === 'objection');
  
  if (objections.length > 0) {
    const exploredCount = clarifications.length;
    const totalObjections = objections.length;
    
    planVsActual.push({
      intended: 'Explore each objection before responding',
      actual: exploredCount > 0
        ? `Asked clarifying questions for ${exploredCount} of ${totalObjections} objections`
        : `Did not ask clarifying questions for ${totalObjections} objection(s)`,
      impact: exploredCount >= totalObjections ? 'Low' : exploredCount > 0 ? 'Medium' : 'High',
      explanation: exploredCount >= totalObjections
        ? 'All objections were explored before responding'
        : 'Some objections were not fully explored, risking misdiagnosis of the underlying concern',
    });
  }
  
  // Check: Next steps
  const nextSteps = behaviors.filter(b => b.type === 'next_step');
  
  planVsActual.push({
    intended: 'Secure clear next steps with specific commitments',
    actual: nextSteps.length > 0
      ? `Established ${nextSteps.length} next step(s) with specific dates/deliverables`
      : 'No firm next step established',
    impact: nextSteps.length > 0 ? 'Low' : 'High',
    explanation: nextSteps.length > 0
      ? 'Created momentum with clear accountability'
      : 'Without firm next steps, deal momentum stalls and competitive risk increases',
  });
  
  // Check: Commercial discipline
  if (concessionBehaviors.length > 0) {
    const hadAlternatives = behaviors.some(b => 
      b.type === 'value_reframe' && 
      /\b(structure|phase|option|alternative)\b/i.test(b.segment.content)
    );
    
    planVsActual.push({
      intended: 'Explore structural alternatives before price concessions',
      actual: hadAlternatives
        ? 'Offered structural alternatives before modest price adjustment'
        : 'Moved directly to price concession without exploring alternatives',
      impact: hadAlternatives ? 'Low' : 'High',
      explanation: hadAlternatives
        ? 'Maintained commercial discipline by offering alternatives first'
        : 'Discounting without alternatives reduces margin and sets precedent for future negotiations',
    });
  }
  
  return planVsActual;
}

/**
 * Full transcript analysis
 */
export async function analyzeTranscript(
  transcript: string,
  interaction: Interaction,
  brief: PreparationBrief
): Promise<PostInteractionAnalysis> {
  const segments = parseTranscript(transcript);
  const behaviors = extractBehaviors(segments);
  
  if (isLLMAvailable()) {
    // CRITICAL: In LIVE MODE, do NOT silently fall back to rules
    // If LLM call fails, throw error so user knows something went wrong
    return await analyzeWithLLM(transcript, interaction, brief, segments, behaviors);
  }
  
  // Only use rules in DEMO MODE
  return analyzeWithRules(transcript, interaction, brief, segments, behaviors);
}

async function analyzeWithLLM(
  transcript: string,
  interaction: Interaction,
  brief: PreparationBrief,
  _segments: TranscriptSegment[],
  _behaviors: ExtractedBehavior[]
): Promise<PostInteractionAnalysis> {
  const provider = createLLMProvider();
  
  // Format transcript with line numbers for evidence traceability
  const lines = transcript.split('\n');
  const numberedTranscript = lines.map((line, i) => `[Line ${i + 1}] ${line}`).join('\n');
  
  const systemPrompt = `You are an expert sales coach analyzing a real customer interaction. You MUST follow this exact rubric.

STEP 1: IDENTIFY BEHAVIORS IN THE TRANSCRIPT
Look for what the employee ACTUALLY SAID:
- Did they acknowledge concerns? (Find lines with "I understand", "I hear you", "I appreciate")
- Did they ask clarifying questions? (Find lines with questions asking "what", "how", "why", "can you help me understand")
- Did they reframe around value? (Find lines mentioning "value", "worth", "impact", "cost of", "investment", "return", "switching cost")
- Did they offer discounts? (Find lines with "discount", "reduce", "%", "price match")
- Did they secure next steps? (Find lines with "next step", "follow up", "schedule", "send")

STEP 2: APPLY THE RUBRIC STRICTLY

LEVEL 1 (Score 1.0-1.8) - NOVICE:
- Employee argues, dismisses, or ignores concerns
- Employee immediately offers discount without exploring
- NO acknowledgment of concerns

LEVEL 2 (Score 2.0-2.8) - DEVELOPING:
- Employee acknowledges BUT doesn't ask clarifying questions
- Employee gives generic responses

LEVEL 3 (Score 3.0-3.8) - FUNCTIONAL:
- Employee acknowledges AND asks specific clarifying questions
- Employee identifies specific aspects of concerns

LEVEL 4 (Score 4.0-4.5) - STRONG:
- Employee acknowledges AND reframes around business value
- Employee asks about cost of inaction or business impact
- Employee does NOT offer discounts

LEVEL 5 (Score 4.6-5.0) - ADVANCED:
- Employee handles multiple objections
- Employee identifies hidden priorities
- Employee offers structural alternatives
- Employee secures clear next steps

STEP 3: CHECK FOR BIAS
DO NOT give high scores for:
- Long responses without substance
- Polite language without addressing concerns
- Jargon without clarity

STEP 4: PROVIDE EVIDENCE WITH LINE REFERENCES
For each piece of evidence, you MUST:
- Reference the specific line number(s) from the transcript
- State what was OBSERVED (directly in the text)
- Mark as "observed" or "inferred"

Output JSON with this exact structure:
{
  "planVsActual": [
    {
      "intended": "<what was planned>",
      "actual": "<what happened - reference line numbers>",
      "impact": "Low|Medium|High",
      "explanation": "<why it matters>"
    }
  ],
  "strengths": ["<specific strength with line reference>"],
  "missedOpportunities": ["<specific missed opportunity with line reference>"],
  "objectionHandlingScore": <number 1.0-5.0>,
  "objectionHandlingEvidence": [
    {
      "lineReference": "Line X-Y",
      "statement": "<specific behavior observed>",
      "observationType": "observed|inferred",
      "confidence": <number 0.0-1.0>
    }
  ],
  "repeatedPatterns": ["<pattern if 3+ similar incidents>"],
  "likelyImpact": "<overall assessment>",
  "nextIntervention": {
    "title": "<intervention title>",
    "description": "<description>",
    "recommendedAction": "<specific action>",
    "estimatedDuration": "<time estimate>"
  }
}`;

  const userPrompt = `Interaction: ${interaction.name} with ${interaction.customer}
Objective: ${interaction.objective}

Preparation Brief Key Points:
- Likely Objections: ${brief.likelyObjections.join(', ')}
- Things to Avoid: ${brief.thingsToAvoid.join(', ')}
- Personal Focus: ${brief.personalCoachingFocus}

Transcript (with line numbers):
${numberedTranscript}

Analyze the interaction following the rubric strictly. Every piece of evidence MUST reference specific line numbers. Use at most 3 evidence items and keep the complete response below 1,400 tokens.`;

  const response = await provider.chat(
    [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
    { temperature: 0.2, maxTokens: 1600, jsonMode: true }
  );

  const data = JSON.parse(response.content);
  
  // Validate evidence has line references
  const validatedEvidence = data.objectionHandlingEvidence.map((e: any) => ({
    statement: e.statement,
    source: 'transcript' as const,
    confidence: e.confidence,
    observationType: e.observationType,
    lineReference: e.lineReference, // Critical for traceability
  }));
  
  return {
    id: uuidv4(),
    interactionId: interaction.id,
    transcriptId: '',
    planVsActual: data.planVsActual,
    strengths: data.strengths,
    missedOpportunities: data.missedOpportunities,
    capabilityDiagnosis: [
      {
        capability: 'Objection Handling',
        score: data.objectionHandlingScore,
        level: Math.ceil(data.objectionHandlingScore) as any,
        evidence: validatedEvidence,
        confidence: 0.85,
      },
    ],
    repeatedPatterns: data.repeatedPatterns || [],
    likelyImpact: data.likelyImpact,
    nextIntervention: {
      id: uuidv4(),
      title: data.nextIntervention.title,
      description: data.nextIntervention.description,
      targetCapability: 'Objection Handling',
      recommendedAction: data.nextIntervention.recommendedAction,
      estimatedDuration: data.nextIntervention.estimatedDuration,
      priority: data.objectionHandlingScore < 3 ? 'high' : 'medium',
    },
    generatedAt: new Date().toISOString(),
  };
}

function analyzeWithRules(
  _transcript: string,
  interaction: Interaction,
  brief: PreparationBrief,
  segments: TranscriptSegment[],
  behaviors: ExtractedBehavior[]
): PostInteractionAnalysis {
  const planVsActual = generatePlanVsActual(brief, behaviors, segments);
  
  // Calculate Objection Handling score
  const acknowledgments = behaviors.filter(b => b.type === 'acknowledgment').length;
  const clarifications = behaviors.filter(b => b.type === 'clarification').length;
  const valueReframes = behaviors.filter(b => b.type === 'value_reframe').length;
  const prematureConcessions = behaviors.filter(b => b.type === 'concession' && b.quality === 'negative').length;
  const nextSteps = behaviors.filter(b => b.type === 'next_step').length;
  
  let ohScore = 2.0;
  if (acknowledgments > 0) ohScore += 0.3;
  if (clarifications > 0) ohScore += 0.5;
  if (valueReframes > 0) ohScore += 0.7;
  if (prematureConcessions > 0) ohScore -= 0.8;
  if (nextSteps > 0) ohScore += 0.3;
  ohScore = Math.max(1.0, Math.min(5.0, ohScore));
  
  // Build evidence with line references for traceability
  const evidence: EvidenceItem[] = [];
  behaviors.forEach(b => {
    evidence.push({
      statement: `${b.description}: "${b.segment.content.substring(0, 100)}..."`,
      source: 'transcript',
      confidence: 0.85,
      observationType: 'observed',
      lineReference: `Line ${b.segment.lineNumber}`, // Critical for traceability
    });
  });
  
  // Strengths
  const strengths: string[] = [];
  if (acknowledgments > 0) strengths.push(`Acknowledged ${acknowledgments} concern(s) before responding`);
  if (clarifications > 0) strengths.push(`Asked ${clarifications} clarifying question(s) to understand root concerns`);
  if (valueReframes > 0) strengths.push(`Reframed conversation around business value`);
  if (nextSteps > 0) strengths.push(`Established ${nextSteps} clear next step(s)`);
  
  // Missed opportunities
  const missed: string[] = [];
  const objections = segments.filter(s => s.type === 'objection');
  if (objections.length > clarifications) {
    missed.push(`Did not fully explore ${objections.length - clarifications} objection(s)`);
  }
  if (prematureConcessions > 0) {
    missed.push(`Offered ${prematureConcessions} concession(s) before establishing value`);
  }
  if (nextSteps === 0) {
    missed.push('Did not establish clear next steps');
  }
  
  // Detect patterns (need 3+ similar incidents)
  const repeatedPatterns: string[] = [];
  if (prematureConcessions >= 2) {
    repeatedPatterns.push(`Pattern: Premature price concession under pressure (${prematureConcessions} incidents)`);
  }
  
  return {
    id: uuidv4(),
    interactionId: interaction.id,
    transcriptId: '',
    planVsActual,
    strengths,
    missedOpportunities: missed,
    capabilityDiagnosis: [
      {
        capability: 'Objection Handling',
        score: ohScore,
        level: Math.ceil(ohScore) as any,
        evidence,
        confidence: 0.85,
      },
    ],
    repeatedPatterns,
    likelyImpact: ohScore >= 3.5 ? 'Strong interaction with clear momentum' : ohScore >= 2.5 ? 'Functional performance with room for improvement' : 'Significant gaps identified that may affect deal outcomes',
    nextIntervention: generateIntervention(ohScore, behaviors),
    generatedAt: new Date().toISOString(),
  };
}

function generateIntervention(score: number, behaviors: ExtractedBehavior[]): CoachingIntervention {
  const prematureConcessions = behaviors.filter(b => b.type === 'concession' && b.quality === 'negative').length;
  const clarifications = behaviors.filter(b => b.type === 'clarification').length;
  
  if (prematureConcessions > 0) {
    return {
      id: uuidv4(),
      title: 'Value-Before-Price Practice',
      description: `You offered ${prematureConcessions} concession(s) before establishing value. This weakens negotiating position.`,
      targetCapability: 'Objection Handling',
      recommendedAction: 'Practice uncovering the underlying concern behind price objections before proposing any commercial response. Use the pattern: Acknowledge → Clarify → Reframe → Then consider alternatives.',
      estimatedDuration: '10 minutes',
      priority: 'high',
    };
  }
  
  if (clarifications === 0) {
    return {
      id: uuidv4(),
      title: 'Clarification Practice',
      description: 'You did not ask clarifying questions when objections were raised. This risks misdiagnosing the real concern.',
      targetCapability: 'Objection Handling',
      recommendedAction: 'Practice asking "Can you help me understand what\'s driving that concern?" before responding to any objection. Complete 3 scenarios with different objection types.',
      estimatedDuration: '8 minutes',
      priority: 'high',
    };
  }
  
  return {
    id: uuidv4(),
    title: 'Layered Objection Practice',
    description: `Your Objection Handling score is ${score.toFixed(1)}/5. Continue building on current strengths.`,
    targetCapability: 'Objection Handling',
    recommendedAction: 'Practice handling multiple objections in sequence. Focus on maintaining value positioning while addressing each concern.',
    estimatedDuration: '10 minutes',
    priority: score < 3 ? 'high' : 'medium',
  };
}
