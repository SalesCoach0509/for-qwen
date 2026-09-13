/**
 * BEFORE/AFTER Demo Data
 * 
 * Demonstrates the product's value proposition:
 * - BEFORE: Employee responds poorly to an objection
 * - Diagnosis: Premature concession
 * - Intervention: Practice value-before-price
 * - AFTER: Employee handles a similar objection more effectively
 * 
 * This is DEMONSTRATION data, not real user data.
 */

import { PracticeSession, PracticeTurn, PracticeEvaluation, CapabilityScore } from '../types';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// BEFORE: Poor Objection Handling
// ============================================================================

export const beforeDemoSession: PracticeSession = {
  id: 'demo-before-session',
  interactionId: 'demo-interaction',
  config: {
    stakeholderRole: 'CFO',
    objectives: ['Test value establishment before price'],
    likelyObjections: ['"Your pricing is too high"'],
    personality: 'Financially focused, skeptical.',
    pressureLevel: 'high',
    commercialConstraints: 'Budget under scrutiny.',
    hiddenPriorities: ['Needs to look good to board'],
    desiredOutcome: 'Secure renewal on strong terms.',
  },
  turns: [
    {
      id: 'before-1',
      role: 'ai',
      content: 'Thanks for meeting with me. I\'ll be honest — we need to talk about the contract and the pricing. We\'ve been looking at our options.',
      timestamp: new Date(Date.now() - 300000).toISOString(),
    },
    {
      id: 'before-2',
      role: 'user',
      content: 'I can offer you a 15% discount right now if you sign today.',
      timestamp: new Date(Date.now() - 240000).toISOString(),
    },
    {
      id: 'before-3',
      role: 'ai',
      content: 'That\'s interesting, but my counterpart at another company pays 30% less. Can you match that?',
      timestamp: new Date(Date.now() - 180000).toISOString(),
    },
    {
      id: 'before-4',
      role: 'user',
      content: 'I can go up to 20% off.',
      timestamp: new Date(Date.now() - 120000).toISOString(),
    },
  ],
  status: 'completed',
  startedAt: new Date(Date.now() - 360000).toISOString(),
  completedAt: new Date(Date.now() - 60000).toISOString(),
};

export const beforeDemoEvaluation: PracticeEvaluation = {
  id: 'demo-before-evaluation',
  sessionId: 'demo-before-session',
  interactionId: 'demo-interaction',
  overallReadiness: 32,
  capabilityScores: [
    {
      capability: 'Objection Handling',
      score: 1.5,
      level: 1,
      evidence: [
        {
          statement: 'Offered 15% discount immediately without exploring the concern',
          source: 'roleplay',
          confidence: 0.95,
          observationType: 'observed',
        },
        {
          statement: 'Increased discount to 20% when challenged, showing no value positioning',
          source: 'roleplay',
          confidence: 0.95,
          observationType: 'observed',
        },
      ],
      weakness: 'Premature commercial concession without diagnosing the underlying concern',
      recommendedIntervention: 'Practice value-before-price: Always acknowledge the concern, ask clarifying questions, reframe around value BEFORE considering any concession.',
      confidence: 0.9,
    },
    {
      capability: 'Commercial Discipline',
      score: 1.3,
      level: 1,
      evidence: [
        {
          statement: 'Escalated discount from 15% to 20% under pressure',
          source: 'roleplay',
          confidence: 0.95,
          observationType: 'observed',
        },
      ],
      weakness: 'Cannot maintain position under price pressure',
      confidence: 0.85,
    },
  ],
  strengths: [],
  weaknesses: [
    'Offered discount before understanding the concern',
    'Escalated concession when challenged',
    'No value reframing attempted',
  ],
  nextPractice: 'Practice value-before-price: When stakeholder says "price is too high," respond with "I understand. Can you help me understand what\'s driving that concern?" before any commercial response.',
  generatedAt: new Date(Date.now() - 60000).toISOString(),
};

// ============================================================================
// AFTER: Improved Objection Handling
// ============================================================================

export const afterDemoSession: PracticeSession = {
  id: 'demo-after-session',
  interactionId: 'demo-interaction-2',
  config: {
    stakeholderRole: 'CFO',
    objectives: ['Test value establishment before price'],
    likelyObjections: ['"Your pricing is too high"'],
    personality: 'Financially focused, skeptical.',
    pressureLevel: 'high',
    commercialConstraints: 'Budget under scrutiny.',
    hiddenPriorities: ['Needs to look good to board'],
    desiredOutcome: 'Secure renewal on strong terms.',
  },
  turns: [
    {
      id: 'after-1',
      role: 'ai',
      content: 'Thanks for meeting with me. I\'ll be honest — we need to talk about the contract and the pricing. We\'ve been looking at our options.',
      timestamp: new Date(Date.now() - 300000).toISOString(),
    },
    {
      id: 'after-2',
      role: 'user',
      content: 'I understand pricing is a concern. Can you help me understand what\'s driving that? Is it the total cost, or are you comparing to a specific alternative?',
      timestamp: new Date(Date.now() - 240000).toISOString(),
    },
    {
      id: 'after-3',
      role: 'ai',
      content: 'We got a quote from DataFlow Pro for 30% less. I need to justify this investment to my board.',
      timestamp: new Date(Date.now() - 180000).toISOString(),
    },
    {
      id: 'after-4',
      role: 'user',
      content: 'I appreciate you sharing that. Before we discuss pricing, can I ask — what\'s the business impact of the limitations you\'re experiencing with your current solution? If we could eliminate those issues, what would that be worth to your organization?',
      timestamp: new Date(Date.now() - 120000).toISOString(),
    },
    {
      id: 'after-5',
      role: 'ai',
      content: 'That\'s... actually a fair point. We\'re losing about $200K per year in operational inefficiencies.',
      timestamp: new Date(Date.now() - 60000).toISOString(),
    },
    {
      id: 'after-6',
      role: 'user',
      content: 'So if we can deliver $200K in annual savings, and our solution is $240K per year, that\'s a strong ROI. Let me also show you what you\'d lose if you switched to DataFlow Pro — the migration cost, retraining, and potential downtime.',
      timestamp: new Date(Date.now() - 30000).toISOString(),
    },
  ],
  status: 'completed',
  startedAt: new Date(Date.now() - 360000).toISOString(),
  completedAt: new Date(Date.now() - 60000).toISOString(),
};

export const afterDemoEvaluation: PracticeEvaluation = {
  id: 'demo-after-evaluation',
  sessionId: 'demo-after-session',
  interactionId: 'demo-interaction-2',
  overallReadiness: 78,
  capabilityScores: [
    {
      capability: 'Objection Handling',
      score: 4.2,
      level: 4,
      evidence: [
        {
          statement: 'Acknowledged the concern before responding',
          source: 'roleplay',
          confidence: 0.95,
          observationType: 'observed',
        },
        {
          statement: 'Asked clarifying questions to understand the root concern',
          source: 'roleplay',
          confidence: 0.95,
          observationType: 'observed',
        },
        {
          statement: 'Reframed conversation around business value ($200K annual savings)',
          source: 'roleplay',
          confidence: 0.95,
          observationType: 'observed',
        },
        {
          statement: 'Discussed switching costs before considering concessions',
          source: 'roleplay',
          confidence: 0.9,
          observationType: 'observed',
        },
      ],
      strength: 'Successfully established value before discussing price',
      recommendedIntervention: 'Continue refining. Practice handling layered objections and high-pressure scenarios.',
      confidence: 0.9,
    },
    {
      capability: 'Commercial Discipline',
      score: 4.0,
      level: 4,
      evidence: [
        {
          statement: 'Maintained position without offering premature discounts',
          source: 'roleplay',
          confidence: 0.95,
          observationType: 'observed',
        },
      ],
      strength: 'Preserved commercial leverage throughout',
      confidence: 0.85,
    },
  ],
  strengths: [
    'Acknowledged concern before responding',
    'Asked clarifying questions',
    'Reframed around business value',
    'Discussed switching costs',
    'Maintained commercial discipline',
  ],
  weaknesses: [],
  nextPractice: 'Practice handling layered objections: Stakeholder raises multiple concerns in sequence. Maintain value positioning while addressing each.',
  generatedAt: new Date(Date.now() - 60000).toISOString(),
};

// ============================================================================
// Capability History Showing Improvement
// ============================================================================

export const demoCapabilityImprovement = {
  capability: 'Objection Handling' as const,
  before: {
    score: 1.5,
    level: 1,
    label: 'Novice',
    date: '2024-11-01',
  },
  after: {
    score: 4.2,
    level: 4,
    label: 'Strong',
    date: '2024-12-15',
  },
  improvement: '+2.7 points',
  interventions: [
    'Value-before-price practice (3 sessions)',
    'Clarification technique drill (2 sessions)',
    'Switching cost discussion practice (2 sessions)',
  ],
};
