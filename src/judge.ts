/**
 * Judge/Evaluator Module
 * 
 * Uses LLM to validate high-stakes decisions:
 * - Capability assessments
 * - Evidence grounding
 * - Plan vs Actual comparisons
 * - Capability diagnoses
 * - Intervention selection
 */

import { createLLMProvider, isLLMAvailable } from './llm-provider';

export type JudgeVerdict = 'PASS' | 'REVISE' | 'INSUFFICIENT_EVIDENCE' | 'CONFLICTING_EVIDENCE' | 'LOW_CONFIDENCE';

export interface JudgeResult {
  verdict: JudgeVerdict;
  reason: string;
  confidence: number;
  revisionSuggestions?: string[];
}

/**
 * Judge a capability assessment
 */
export async function judgeCapabilityAssessment(
  assessment: {
    capability: string;
    score: number;
    evidence: { statement: string; observationType: string }[];
  }
): Promise<JudgeResult> {
  if (!isLLMAvailable()) {
    return {
      verdict: 'PASS',
      reason: 'Demo mode: skipping judge validation',
      confidence: 0.5,
    };
  }

  try {
    const provider = createLLMProvider();
    
    const prompt = `You are evaluating a capability assessment for quality and evidence grounding.

Assessment:
- Capability: ${assessment.capability}
- Score: ${assessment.score}/5
- Evidence:
${assessment.evidence.map(e => `  * [${e.observationType}] ${e.statement}`).join('\n')}

Evaluate:
1. Does the score align with the evidence?
2. Is the evidence specific and behavioral (not vague)?
3. Are observation types correctly classified (observed vs inferred)?
4. Is the confidence level appropriate?

Return JSON:
{
  "verdict": "PASS|REVISE|INSUFFICIENT_EVIDENCE|CONFLICTING_EVIDENCE|LOW_CONFIDENCE",
  "reason": "explanation",
  "confidence": 0.0-1.0,
  "revisionSuggestions": ["suggestion1"] // only if verdict is REVISE
}`;

    const response = await provider.chat(
      [{ role: 'system', content: prompt }],
      { temperature: 0.3, jsonMode: true }
    );

    return JSON.parse(response.content);
  } catch (error) {
    console.error('Judge assessment failed:', error);
    return {
      verdict: 'LOW_CONFIDENCE',
      reason: 'Judge validation failed',
      confidence: 0.3,
    };
  }
}

/**
 * Judge a Plan vs Actual comparison
 */
export async function judgePlanVsActual(
  comparison: {
    intended: string;
    actual: string;
    impact: string;
    explanation: string;
  }
): Promise<JudgeResult> {
  if (!isLLMAvailable()) {
    return {
      verdict: 'PASS',
      reason: 'Demo mode: skipping judge validation',
      confidence: 0.5,
    };
  }

  try {
    const provider = createLLMProvider();
    
    const prompt = `You are evaluating a Plan vs Actual comparison for validity.

Comparison:
- INTENDED: ${comparison.intended}
- ACTUAL: ${comparison.actual}
- IMPACT: ${comparison.impact}
- EXPLANATION: ${comparison.explanation}

Evaluate:
1. Is the intended behavior specific and actionable?
2. Is the actual behavior clearly described?
3. Is the impact rating (Low/Medium/High) defensible?
4. Does the explanation logically connect the difference to the impact?

Return JSON:
{
  "verdict": "PASS|REVISE|INSUFFICIENT_EVIDENCE",
  "reason": "explanation",
  "confidence": 0.0-1.0,
  "revisionSuggestions": ["suggestion1"] // only if verdict is REVISE
}`;

    const response = await provider.chat(
      [{ role: 'system', content: prompt }],
      { temperature: 0.3, jsonMode: true }
    );

    return JSON.parse(response.content);
  } catch (error) {
    console.error('Judge Plan vs Actual failed:', error);
    return {
      verdict: 'LOW_CONFIDENCE',
      reason: 'Judge validation failed',
      confidence: 0.3,
    };
  }
}

/**
 * Judge whether capability state should be updated
 */
export async function judgeCapabilityStateUpdate(
  currentState: {
    capability: string;
    currentScore: number;
    trend: string;
    evidenceCount: number;
  },
  newEvidence: {
    score: number;
    source: string;
    confidence: number;
  }
): Promise<{
  decision: 'UPDATED' | 'NO_CHANGE';
  previousState: any;
  newState: any;
  reason: string;
  confidence: number;
}> {
  if (!isLLMAvailable()) {
    // Demo mode: always update
    return {
      decision: 'UPDATED',
      previousState: currentState,
      newState: { ...currentState, currentScore: newEvidence.score },
      reason: 'Demo mode: accepting new evidence',
      confidence: 0.5,
    };
  }

  try {
    const provider = createLLMProvider();
    
    const prompt = `You are deciding whether new evidence justifies updating an employee's capability state.

Current State:
- Capability: ${currentState.capability}
- Current Score: ${currentState.currentScore}/5
- Trend: ${currentState.trend}
- Evidence Count: ${currentState.evidenceCount}

New Evidence:
- Score: ${newEvidence.score}/5
- Source: ${newEvidence.source}
- Confidence: ${newEvidence.confidence}

Consider:
1. Is the new evidence from a credible source (real interaction > practice)?
2. Is the confidence level high enough to warrant update?
3. Does the new score significantly differ from current state?
4. Is this a one-time anomaly or consistent with trend?

Return JSON:
{
  "decision": "UPDATED|NO_CHANGE",
  "previousState": {...},
  "newState": {...},
  "reason": "explanation",
  "confidence": 0.0-1.0
}`;

    const response = await provider.chat(
      [{ role: 'system', content: prompt }],
      { temperature: 0.3, jsonMode: true }
    );

    return JSON.parse(response.content);
  } catch (error) {
    console.error('Judge state update failed:', error);
    // Fallback: accept the update
    return {
      decision: 'UPDATED',
      previousState: currentState,
      newState: { ...currentState, currentScore: newEvidence.score },
      reason: 'Judge failed, accepting update',
      confidence: 0.4,
    };
  }
}

/**
 * Judge intervention quality
 */
export async function judgeIntervention(
  intervention: {
    targetCapability: string;
    recommendedAction: string;
    estimatedDuration: string;
  },
  evidence: {
    weakness: string;
    pattern?: string;
  }
): Promise<JudgeResult> {
  if (!isLLMAvailable()) {
    return {
      verdict: 'PASS',
      reason: 'Demo mode: skipping judge validation',
      confidence: 0.5,
    };
  }

  try {
    const provider = createLLMProvider();
    
    const prompt = `You are evaluating a coaching intervention for quality and relevance.

Intervention:
- Target Capability: ${intervention.targetCapability}
- Recommended Action: ${intervention.recommendedAction}
- Estimated Duration: ${intervention.estimatedDuration}

Evidence:
- Weakness: ${evidence.weakness}
- Pattern: ${evidence.pattern || 'None identified'}

Evaluate:
1. Does the intervention directly address the identified weakness?
2. Is the recommended action specific and actionable?
3. Is the duration appropriate for the intervention type?
4. If a pattern exists, does the intervention address the pattern?

Return JSON:
{
  "verdict": "PASS|REVISE|INSUFFICIENT_EVIDENCE",
  "reason": "explanation",
  "confidence": 0.0-1.0,
  "revisionSuggestions": ["suggestion1"] // only if verdict is REVISE
}`;

    const response = await provider.chat(
      [{ role: 'system', content: prompt }],
      { temperature: 0.3, jsonMode: true }
    );

    return JSON.parse(response.content);
  } catch (error) {
    console.error('Judge intervention failed:', error);
    return {
      verdict: 'LOW_CONFIDENCE',
      reason: 'Judge validation failed',
      confidence: 0.3,
    };
  }
}
