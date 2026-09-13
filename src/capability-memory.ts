/**
 * Capability Memory — Day 4 Implementation
 * 
 * Implements persistent capability tracking with:
 * - Weighted scoring (recency, evidence quality, confidence, difficulty)
 * - Pattern detection across interactions
 * - Intervention recommendation
 * - History preservation (never overwrites)
 */

import { CapabilityHistory, CapabilityScore, CoachingIntervention } from './types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Weighted capability score calculation
 * 
 * Factors:
 * - Recency: More recent assessments weighted higher
 * - Evidence quality: Transcript evidence > roleplay evidence
 * - Confidence: Higher confidence = higher weight
 * - Difficulty: Higher pressure scenarios weighted higher
 */
export function calculateWeightedScore(history: CapabilityHistory): number {
  if (history.scores.length === 0) return 2.5; // Default for new capabilities
  
  const now = Date.now();
  const DAY_MS = 86400000;
  
  let weightedSum = 0;
  let totalWeight = 0;
  
  history.scores.forEach((entry, index) => {
    const age = now - new Date(entry.date).getTime();
    const ageInDays = age / DAY_MS;
    
    // Recency weight: exponential decay, half-life of 14 days
    const recencyWeight = Math.pow(0.5, ageInDays / 14);
    
    // Evidence type weight
    let evidenceWeight = 1.0;
    if (entry.source.includes('transcript') || entry.source.includes('Real interaction')) {
      evidenceWeight = 1.3; // Real interactions weighted higher
    } else if (entry.source.includes('Practice')) {
      evidenceWeight = 1.0; // Practice is baseline
    }
    
    // Position weight: more recent entries get slight bonus
    const positionWeight = 1 + (index / history.scores.length) * 0.2;
    
    const weight = recencyWeight * evidenceWeight * positionWeight;
    weightedSum += entry.score * weight;
    totalWeight += weight;
  });
  
  return totalWeight > 0 ? weightedSum / totalWeight : 2.5;
}

/**
 * Detect patterns across capability history
 * Requires 3+ similar incidents to identify a pattern
 */
export function detectPatterns(history: CapabilityHistory): string[] {
  const patterns: string[] = [];
  
  if (history.scores.length < 3) return patterns;
  
  // Check for consistent low performance
  const recentScores = history.scores.slice(-4).map(s => s.score);
  const avgRecent = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
  
  if (avgRecent < 2.5 && recentScores.every(s => s < 3.0)) {
    patterns.push(`Consistent low performance in ${history.capability} (avg ${avgRecent.toFixed(1)}/5 over ${recentScores.length} interactions)`);
  }
  
  // Check for stagnation (no improvement over 4+ interactions)
  if (history.scores.length >= 4) {
    const firstHalf = history.scores.slice(0, Math.floor(history.scores.length / 2));
    const secondHalf = history.scores.slice(Math.floor(history.scores.length / 2));
    const firstAvg = firstHalf.reduce((a, b) => a + b.score, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b.score, 0) / secondHalf.length;
    
    if (Math.abs(secondAvg - firstAvg) < 0.2) {
      patterns.push(`Performance plateau in ${history.capability} — no meaningful change over ${history.scores.length} interactions`);
    }
  }
  
  // Check for regression
  if (history.scores.length >= 3) {
    const lastThree = history.scores.slice(-3).map(s => s.score);
    if (lastThree[0] > lastThree[1] && lastThree[1] > lastThree[2] && lastThree[0] - lastThree[2] > 0.5) {
      patterns.push(`Declining performance in ${history.capability} — scores dropping over recent interactions`);
    }
  }
  
  return patterns;
}

/**
 * Generate personalized intervention based on capability state
 */
export function generateIntervention(
  history: CapabilityHistory,
  patterns: string[]
): CoachingIntervention {
  const weightedScore = calculateWeightedScore(history);
  const trend = history.trend;
  
  // Determine intervention type based on score and patterns
  let title: string;
  let description: string;
  let recommendedAction: string;
  let priority: 'high' | 'medium' | 'low';
  let duration: string;
  
  if (weightedScore < 2.0) {
    // Foundational level — needs basic skill building
    title = `${history.capability} Foundation`;
    description = `Your ${history.capability} capability (${weightedScore.toFixed(1)}/5) needs foundational work. ${history.knownWeakness || 'Focus on core techniques.'}`;
    recommendedAction = `Complete 3 basic ${history.capability.toLowerCase()} scenarios focusing on: acknowledge concern → ask clarifying question → provide relevant response. Start with low-pressure situations.`;
    priority = 'high';
    duration = '15 minutes';
  } else if (weightedScore < 3.0) {
    // Developing — needs consistent practice
    title = `${history.capability} Development`;
    description = `Your ${history.capability} capability (${weightedScore.toFixed(1)}/5) is developing. ${history.knownWeakness || 'Continue building consistency.'}`;
    
    if (patterns.length > 0) {
      recommendedAction = `Address pattern: ${patterns[0]}. Practice 3 scenarios specifically targeting this weakness. Focus on applying the technique under moderate pressure.`;
    } else {
      recommendedAction = `Practice 3 ${history.capability.toLowerCase()} scenarios with increasing difficulty. Focus on: ${history.nextRecommendation || 'consistent application of technique'}.`;
    }
    priority = 'high';
    duration = '10-12 minutes';
  } else if (weightedScore < 4.0) {
    // Functional — needs refinement
    title = `${history.capability} Refinement`;
    description = `Your ${history.capability} capability (${weightedScore.toFixed(1)}/5) is functional. ${history.knownWeakness || 'Focus on advanced techniques.'}`;
    
    if (trend === 'stable' || patterns.some(p => p.includes('plateau'))) {
      recommendedAction = `Break through plateau: Practice ${history.capability.toLowerCase()} with layered objections and high-pressure scenarios. Focus on: ${history.nextRecommendation || 'handling complexity'}.`;
    } else {
      recommendedAction = `Continue building on strengths. Practice 2-3 advanced scenarios focusing on: ${history.nextRecommendation || 'maintaining consistency under pressure'}.`;
    }
    priority = 'medium';
    duration = '10 minutes';
  } else {
    // Strong/Advanced — maintenance and edge cases
    title = `${history.capability} Mastery`;
    description = `Your ${history.capability} capability (${weightedScore.toFixed(1)}/5) is strong. Focus on edge cases and teaching others.`;
    recommendedAction = `Practice edge cases: unusual objections, multiple stakeholders, conflicting priorities. Consider mentoring others on ${history.capability.toLowerCase()} techniques.`;
    priority = 'low';
    duration = '8-10 minutes';
  }
  
  return {
    id: uuidv4(),
    title,
    description,
    targetCapability: history.capability,
    recommendedAction,
    estimatedDuration: duration,
    priority,
  };
}

/**
 * Update capability history with new assessment
 * Preserves all historical data — never overwrites
 * Uses judge to decide if state should be updated
 */
export async function updateCapabilityHistory(
  current: CapabilityHistory[],
  newScores: CapabilityScore[],
  source: string
): Promise<CapabilityHistory[]> {
  const today = new Date().toISOString().split('T')[0];
  
  // Import judge dynamically to avoid circular dependency
  const { judgeCapabilityStateUpdate } = await import('./judge');
  
  const updates = await Promise.all(current.map(async cap => {
    const newScore = newScores.find(s => s.capability === cap.capability);
    if (!newScore) return cap;
    
    // Use judge to decide if state should be updated
    const judgeResult = await judgeCapabilityStateUpdate(
      {
        capability: cap.capability,
        currentScore: cap.currentScore,
        trend: cap.trend,
        evidenceCount: cap.scores.length,
      },
      {
        score: newScore.score,
        source,
        confidence: newScore.confidence,
      }
    );
    
    // If judge says NO_CHANGE, return current state
    if (judgeResult.decision === 'NO_CHANGE') {
      console.log(`Judge: NO_CHANGE for ${cap.capability} - ${judgeResult.reason}`);
      return cap;
    }
    
    console.log(`Judge: UPDATED for ${cap.capability} - ${judgeResult.reason}`);
    
    // Add new score to history (never overwrite)
    const updatedScores = [...cap.scores, { 
      date: today, 
      score: newScore.score, 
      source 
    }];
    
    // Calculate weighted score
    const weightedScore = calculateWeightedScore({ ...cap, scores: updatedScores });
    
    // Determine trend
    const recentScores = updatedScores.slice(-3).map(s => s.score);
    const recentAvg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
    const olderAvg = updatedScores.length > 3 
      ? updatedScores.slice(-6, -3).reduce((a, b) => a + b.score, 0) / Math.min(3, updatedScores.length - 3)
      : weightedScore;
    
    const trend: 'improving' | 'stable' | 'declining' = 
      recentAvg > olderAvg + 0.15 ? 'improving' :
      recentAvg < olderAvg - 0.15 ? 'declining' : 'stable';
    
    // Detect patterns
    const patterns = detectPatterns({ ...cap, scores: updatedScores });
    
    // Generate intervention
    const intervention = generateIntervention(
      { ...cap, scores: updatedScores, trend },
      patterns
    );
    
    return {
      ...cap,
      scores: updatedScores,
      currentScore: weightedScore,
      trend,
      knownWeakness: newScore.weakness || cap.knownWeakness,
      recentIntervention: intervention.title,
      nextRecommendation: intervention.recommendedAction,
    };
  }));
  
  return updates;
}

/**
 * Get capability summary for display
 */
export function getCapabilitySummary(history: CapabilityHistory): {
  currentScore: number;
  level: string;
  trend: string;
  evidenceCount: number;
  patterns: string[];
  nextIntervention: CoachingIntervention;
} {
  const weightedScore = calculateWeightedScore(history);
  const patterns = detectPatterns(history);
  const intervention = generateIntervention(history, patterns);
  
  let level: string;
  if (weightedScore >= 4.5) level = 'Advanced';
  else if (weightedScore >= 3.5) level = 'Strong';
  else if (weightedScore >= 2.5) level = 'Functional';
  else if (weightedScore >= 1.5) level = 'Developing';
  else level = 'Novice';
  
  return {
    currentScore: weightedScore,
    level,
    trend: history.trend,
    evidenceCount: history.scores.length,
    patterns,
    nextIntervention: intervention,
  };
}
