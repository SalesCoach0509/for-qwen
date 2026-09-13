/**
 * Synthetic Employee Histories — Day 5 Pressure Test
 * 
 * Creates 5 distinct employee profiles with different capability patterns
 * to verify that personalization actually changes based on history.
 */

import { CapabilityHistory, CapabilityName } from '../types';

export interface SyntheticEmployee {
  id: string;
  name: string;
  description: string;
  capabilityHistory: CapabilityHistory[];
  expectedBehavior: {
    preparation: string;
    roleplay: string;
    coaching: string;
  };
}

/**
 * Employee A: Premature Discounting
 * Pattern: Always offers discounts before establishing value
 */
export const employeeA: SyntheticEmployee = {
  id: 'synthetic-a',
  name: 'Alex (Premature Discounting)',
  description: 'Consistently offers price concessions before exploring the underlying concern or establishing value.',
  capabilityHistory: [
    {
      capability: 'Objection Handling' as CapabilityName,
      scores: [
        { date: '2024-11-01', score: 1.8, source: 'Practice: Price objection' },
        { date: '2024-11-15', score: 2.0, source: 'Practice: Budget concern' },
        { date: '2024-12-01', score: 1.9, source: 'Real interaction: Renewal' },
        { date: '2024-12-15', score: 2.1, source: 'Practice: Competitor quote' },
      ],
      currentScore: 2.0,
      trend: 'stable',
      knownWeakness: 'Offers discounts immediately when price is mentioned',
      recentIntervention: 'Value-before-price practice',
      nextRecommendation: 'Practice acknowledging price concern, then asking "What\'s driving that?" before any commercial response',
    },
    {
      capability: 'Commercial Discipline' as CapabilityName,
      scores: [
        { date: '2024-11-01', score: 2.0, source: 'Initial assessment' },
        { date: '2024-12-01', score: 2.1, source: 'Real interaction' },
      ],
      currentScore: 2.1,
      trend: 'stable',
      knownWeakness: 'Concedes price before exploring alternatives',
    },
    {
      capability: 'Discovery' as CapabilityName,
      scores: [
        { date: '2024-11-01', score: 2.8, source: 'Initial assessment' },
      ],
      currentScore: 2.8,
      trend: 'stable',
    },
    {
      capability: 'Questioning' as CapabilityName,
      scores: [{ date: '2024-11-01', score: 2.5, source: 'Initial assessment' }],
      currentScore: 2.5,
      trend: 'stable',
    },
    {
      capability: 'Active Listening' as CapabilityName,
      scores: [{ date: '2024-11-01', score: 3.0, source: 'Initial assessment' }],
      currentScore: 3.0,
      trend: 'stable',
    },
    {
      capability: 'Value Articulation' as CapabilityName,
      scores: [{ date: '2024-11-01', score: 2.3, source: 'Initial assessment' }],
      currentScore: 2.3,
      trend: 'stable',
      knownWeakness: 'Jumps to price before establishing value',
    },
    {
      capability: 'Negotiation' as CapabilityName,
      scores: [{ date: '2024-11-01', score: 2.2, source: 'Initial assessment' }],
      currentScore: 2.2,
      trend: 'stable',
    },
    {
      capability: 'Next-Step Control' as CapabilityName,
      scores: [{ date: '2024-11-01', score: 3.0, source: 'Initial assessment' }],
      currentScore: 3.0,
      trend: 'stable',
    },
  ],
  expectedBehavior: {
    preparation: 'Brief should emphasize: Do NOT offer discounts. Explore the concern first. Ask "What\'s driving that?" Practice value-before-price.',
    roleplay: 'Should be challenged on price early. If they discount immediately, should be scored low (1.5-2.2).',
    coaching: 'Intervention should focus specifically on premature discounting pattern. Not generic "improve objection handling."',
  },
};

/**
 * Employee B: Fails to Clarify
 * Pattern: Acknowledges objections but doesn't ask clarifying questions
 */
export const employeeB: SyntheticEmployee = {
  id: 'synthetic-b',
  name: 'Blake (Fails to Clarify)',
  description: 'Acknowledges concerns but moves to solutions without understanding the root cause.',
  capabilityHistory: [
    {
      capability: 'Objection Handling' as CapabilityName,
      scores: [
        { date: '2024-11-01', score: 2.3, source: 'Practice' },
        { date: '2024-11-20', score: 2.5, source: 'Real interaction' },
        { date: '2024-12-05', score: 2.4, source: 'Practice' },
      ],
      currentScore: 2.4,
      trend: 'stable',
      knownWeakness: 'Says "I understand" but doesn\'t ask follow-up questions',
      recentIntervention: 'Clarification practice',
      nextRecommendation: 'After acknowledging, always ask "Can you help me understand what\'s driving that concern?"',
    },
    {
      capability: 'Questioning' as CapabilityName,
      scores: [
        { date: '2024-11-01', score: 2.2, source: 'Initial assessment' },
        { date: '2024-12-01', score: 2.4, source: 'Practice' },
      ],
      currentScore: 2.4,
      trend: 'improving',
      knownWeakness: 'Asks surface-level questions, doesn\'t dig deeper',
    },
    {
      capability: 'Commercial Discipline' as CapabilityName,
      scores: [{ date: '2024-11-01', score: 3.0, source: 'Initial assessment' }],
      currentScore: 3.0,
      trend: 'stable',
    },
    {
      capability: 'Discovery' as CapabilityName,
      scores: [{ date: '2024-11-01', score: 2.5, source: 'Initial assessment' }],
      currentScore: 2.5,
      trend: 'stable',
    },
    {
      capability: 'Active Listening' as CapabilityName,
      scores: [{ date: '2024-11-01', score: 2.8, source: 'Initial assessment' }],
      currentScore: 2.8,
      trend: 'stable',
    },
    {
      capability: 'Value Articulation' as CapabilityName,
      scores: [{ date: '2024-11-01', score: 2.7, source: 'Initial assessment' }],
      currentScore: 2.7,
      trend: 'stable',
    },
    {
      capability: 'Negotiation' as CapabilityName,
      scores: [{ date: '2024-11-01', score: 2.8, source: 'Initial assessment' }],
      currentScore: 2.8,
      trend: 'stable',
    },
    {
      capability: 'Next-Step Control' as CapabilityName,
      scores: [{ date: '2024-11-01', score: 3.2, source: 'Initial assessment' }],
      currentScore: 3.2,
      trend: 'stable',
    },
  ],
  expectedBehavior: {
    preparation: 'Brief should emphasize: After acknowledging, ALWAYS ask clarifying questions. Don\'t assume you understand the concern.',
    roleplay: 'Should be scored on whether they ask "Can you help me understand..." or similar. If they skip clarification, score 2.0-2.5.',
    coaching: 'Intervention should focus on clarification technique. Specific practice on asking "What\'s driving that?"',
  },
};

/**
 * Employee C: Argues with Customer
 * Pattern: Becomes defensive, argues, doesn't acknowledge concerns
 */
export const employeeC: SyntheticEmployee = {
  id: 'synthetic-c',
  name: 'Casey (Argues with Customer)',
  description: 'Becomes defensive when challenged. Argues rather than acknowledges. Doesn\'t listen.',
  capabilityHistory: [
    {
      capability: 'Objection Handling' as CapabilityName,
      scores: [
        { date: '2024-11-01', score: 1.5, source: 'Practice' },
        { date: '2024-11-18', score: 1.6, source: 'Real interaction' },
        { date: '2024-12-02', score: 1.7, source: 'Practice' },
        { date: '2024-12-12', score: 1.5, source: 'Real interaction' },
      ],
      currentScore: 1.6,
      trend: 'stable',
      knownWeakness: 'Argues with customer, becomes defensive, doesn\'t acknowledge concerns',
      recentIntervention: 'Acknowledgment practice',
      nextRecommendation: 'Before responding to ANY objection, first acknowledge: "I understand" or "I hear you." Do not argue.',
    },
    {
      capability: 'Active Listening' as CapabilityName,
      scores: [
        { date: '2024-11-01', score: 1.8, source: 'Initial assessment' },
        { date: '2024-12-01', score: 1.9, source: 'Practice' },
      ],
      currentScore: 1.9,
      trend: 'stable',
      knownWeakness: 'Does not demonstrate understanding, interrupts, argues',
    },
    {
      capability: 'Commercial Discipline' as CapabilityName,
      scores: [{ date: '2024-11-01', score: 2.5, source: 'Initial assessment' }],
      currentScore: 2.5,
      trend: 'stable',
    },
    {
      capability: 'Discovery' as CapabilityName,
      scores: [{ date: '2024-11-01', score: 2.0, source: 'Initial assessment' }],
      currentScore: 2.0,
      trend: 'stable',
    },
    {
      capability: 'Questioning' as CapabilityName,
      scores: [{ date: '2024-11-01', score: 2.0, source: 'Initial assessment' }],
      currentScore: 2.0,
      trend: 'stable',
    },
    {
      capability: 'Value Articulation' as CapabilityName,
      scores: [{ date: '2024-11-01', score: 2.2, source: 'Initial assessment' }],
      currentScore: 2.2,
      trend: 'stable',
    },
    {
      capability: 'Negotiation' as CapabilityName,
      scores: [{ date: '2024-11-01', score: 1.8, source: 'Initial assessment' }],
      currentScore: 1.8,
      trend: 'stable',
    },
    {
      capability: 'Next-Step Control' as CapabilityName,
      scores: [{ date: '2024-11-01', score: 2.5, source: 'Initial assessment' }],
      currentScore: 2.5,
      trend: 'stable',
    },
  ],
  expectedBehavior: {
    preparation: 'Brief should emphasize: DO NOT ARGUE. First acknowledge every concern. Say "I understand" before anything else. Listen more than you speak.',
    roleplay: 'Should be scored very low (1.0-1.8) if they argue. Must acknowledge before responding.',
    coaching: 'Intervention should focus on foundational listening and acknowledgment. This is a Level 1 (Novice) issue.',
  },
};

/**
 * Employee D: Strong Performer
 * Pattern: Consistently strong across all capabilities
 */
export const employeeD: SyntheticEmployee = {
  id: 'synthetic-d',
  name: 'Dana (Strong Performer)',
  description: 'Consistently strong performance. Handles objections well. Maintains commercial discipline.',
  capabilityHistory: [
    {
      capability: 'Objection Handling' as CapabilityName,
      scores: [
        { date: '2024-11-01', score: 3.8, source: 'Initial assessment' },
        { date: '2024-11-20', score: 4.0, source: 'Real interaction' },
        { date: '2024-12-05', score: 4.2, source: 'Practice' },
        { date: '2024-12-15', score: 4.1, source: 'Real interaction' },
      ],
      currentScore: 4.1,
      trend: 'improving',
      nextRecommendation: 'Continue refining. Practice layered objections and high-pressure scenarios.',
    },
    {
      capability: 'Commercial Discipline' as CapabilityName,
      scores: [
        { date: '2024-11-01', score: 3.9, source: 'Initial assessment' },
        { date: '2024-12-01', score: 4.0, source: 'Real interaction' },
      ],
      currentScore: 4.0,
      trend: 'improving',
    },
    {
      capability: 'Discovery' as CapabilityName,
      scores: [{ date: '2024-11-01', score: 4.0, source: 'Initial assessment' }],
      currentScore: 4.0,
      trend: 'stable',
    },
    {
      capability: 'Questioning' as CapabilityName,
      scores: [{ date: '2024-11-01', score: 4.2, source: 'Initial assessment' }],
      currentScore: 4.2,
      trend: 'stable',
    },
    {
      capability: 'Active Listening' as CapabilityName,
      scores: [{ date: '2024-11-01', score: 4.0, source: 'Initial assessment' }],
      currentScore: 4.0,
      trend: 'stable',
    },
    {
      capability: 'Value Articulation' as CapabilityName,
      scores: [{ date: '2024-11-01', score: 4.1, source: 'Initial assessment' }],
      currentScore: 4.1,
      trend: 'stable',
    },
    {
      capability: 'Negotiation' as CapabilityName,
      scores: [{ date: '2024-11-01', score: 3.8, source: 'Initial assessment' }],
      currentScore: 3.8,
      trend: 'stable',
    },
    {
      capability: 'Next-Step Control' as CapabilityName,
      scores: [{ date: '2024-11-01', score: 4.3, source: 'Initial assessment' }],
      currentScore: 4.3,
      trend: 'stable',
    },
  ],
  expectedBehavior: {
    preparation: 'Brief should acknowledge strengths. Focus on edge cases and advanced scenarios. Minimal coaching needed.',
    roleplay: 'Should be scored 3.8-4.5. Challenged with layered objections to test advanced skills.',
    coaching: 'Intervention should focus on mastery and edge cases. Consider mentoring others.',
  },
};

/**
 * Employee E: Surface Level Only
 * Pattern: Handles surface objections but misses hidden concerns
 */
export const employeeE: SyntheticEmployee = {
  id: 'synthetic-e',
  name: 'Ellis (Surface Level Only)',
  description: 'Handles obvious objections but doesn\'t uncover hidden concerns. Stays at surface level.',
  capabilityHistory: [
    {
      capability: 'Objection Handling' as CapabilityName,
      scores: [
        { date: '2024-11-01', score: 2.8, source: 'Initial assessment' },
        { date: '2024-11-22', score: 3.0, source: 'Real interaction' },
        { date: '2024-12-08', score: 2.9, source: 'Practice' },
      ],
      currentScore: 2.9,
      trend: 'stable',
      knownWeakness: 'Handles surface objections but doesn\'t dig for hidden concerns',
      recentIntervention: 'Deep discovery practice',
      nextRecommendation: 'After addressing surface objection, ask "Is there anything else that\'s concerning you?" Look for the real issue.',
    },
    {
      capability: 'Discovery' as CapabilityName,
      scores: [
        { date: '2024-11-01', score: 2.7, source: 'Initial assessment' },
        { date: '2024-12-01', score: 2.8, source: 'Practice' },
      ],
      currentScore: 2.8,
      trend: 'improving',
      knownWeakness: 'Stays at surface level, doesn\'t explore deeper',
    },
    {
      capability: 'Questioning' as CapabilityName,
      scores: [{ date: '2024-11-01', score: 3.0, source: 'Initial assessment' }],
      currentScore: 3.0,
      trend: 'stable',
    },
    {
      capability: 'Active Listening' as CapabilityName,
      scores: [{ date: '2024-11-01', score: 3.2, source: 'Initial assessment' }],
      currentScore: 3.2,
      trend: 'stable',
    },
    {
      capability: 'Commercial Discipline' as CapabilityName,
      scores: [{ date: '2024-11-01', score: 3.1, source: 'Initial assessment' }],
      currentScore: 3.1,
      trend: 'stable',
    },
    {
      capability: 'Value Articulation' as CapabilityName,
      scores: [{ date: '2024-11-01', score: 3.0, source: 'Initial assessment' }],
      currentScore: 3.0,
      trend: 'stable',
    },
    {
      capability: 'Negotiation' as CapabilityName,
      scores: [{ date: '2024-11-01', score: 2.9, source: 'Initial assessment' }],
      currentScore: 2.9,
      trend: 'stable',
    },
    {
      capability: 'Next-Step Control' as CapabilityName,
      scores: [{ date: '2024-11-01', score: 3.3, source: 'Initial assessment' }],
      currentScore: 3.3,
      trend: 'stable',
    },
  ],
  expectedBehavior: {
    preparation: 'Brief should emphasize: Don\'t stop at surface objections. Ask "Is there anything else?" Look for hidden concerns.',
    roleplay: 'Should handle surface objection (score 3.0+) but miss hidden concern (overall 2.8-3.2).',
    coaching: 'Intervention should focus on uncovering hidden concerns. Practice asking "What else is on your mind?"',
  },
};

export const allSyntheticEmployees: SyntheticEmployee[] = [
  employeeA,
  employeeB,
  employeeC,
  employeeD,
  employeeE,
];
