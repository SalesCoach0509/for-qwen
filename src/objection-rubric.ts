// Objection Handling Behavioral Rubric
// 5-level scale with behaviorally distinguishable criteria

export interface ObjectionHandlingRubric {
  level: 1 | 2 | 3 | 4 | 5;
  label: string;
  description: string;
  behaviors: string[];
  indicators: string[];
}

export const OBJECTION_HANDLING_RUBRIC: ObjectionHandlingRubric[] = [
  {
    level: 1,
    label: 'Novice',
    description: 'Reacts poorly to objections, argues, gives unnecessary discounts, ignores concerns, or responds without understanding.',
    behaviors: [
      'Immediately offers discount without exploration',
      'Argues or becomes defensive',
      'Ignores the objection entirely',
      'Provides generic responses without addressing the specific concern',
      'Moves to solution before understanding the problem',
    ],
    indicators: [
      'Uses phrases like "but", "actually", "you\'re wrong"',
      'Immediately mentions pricing/discounts',
      'No acknowledgment of the concern',
      'Changes subject without addressing objection',
    ],
  },
  {
    level: 2,
    label: 'Developing',
    description: 'Acknowledges the objection but provides generic, weak, poorly targeted, or premature responses.',
    behaviors: [
      'Acknowledges concern but doesn\'t explore it',
      'Provides surface-level response',
      'Moves to solution too quickly',
      'Uses generic rebuttals',
      'Doesn\'t identify underlying concern',
    ],
    indicators: [
      'Says "I understand" but doesn\'t ask follow-up questions',
      'Provides feature-based responses instead of value-based',
      'Acknowledges then immediately pivots to solution',
      'Uses canned responses',
    ],
  },
  {
    level: 3,
    label: 'Functional',
    description: 'Clarifies the concern and provides a relevant response while maintaining reasonable conversational control.',
    behaviors: [
      'Asks clarifying questions about the objection',
      'Paraphrases to confirm understanding',
      'Provides relevant response to the specific concern',
      'Maintains conversational flow',
      'Doesn\'t immediately discount',
    ],
    indicators: [
      'Asks "Can you help me understand..." or "What specifically..."',
      'Paraphrases the concern back',
      'Addresses the specific objection raised',
      'Explores before responding',
    ],
  },
  {
    level: 4,
    label: 'Strong',
    description: 'Identifies the underlying concern, uses appropriate reframing/value logic, preserves commercial discipline and advances the conversation.',
    behaviors: [
      'Identifies root cause behind the objection',
      'Reframes the conversation around value',
      'Maintains commercial discipline (doesn\'t discount prematurely)',
      'Uses evidence/logic to address concern',
      'Advances toward next step',
    ],
    indicators: [
      'Asks "What\'s driving that concern?" or "Help me understand the impact"',
      'Reframes price as investment/value',
      'Discusses switching costs or cost of inaction',
      'Maintains position while showing empathy',
      'Moves conversation forward',
    ],
  },
  {
    level: 5,
    label: 'Advanced',
    description: 'Handles layered objections under pressure, identifies hidden concerns, adapts dynamically, preserves leverage and advances the interaction toward a meaningful next step.',
    behaviors: [
      'Handles multiple/layered objections seamlessly',
      'Identifies hidden/unstated concerns',
      'Adapts approach based on stakeholder reactions',
      'Preserves leverage throughout',
      'Creates momentum toward commitment',
      'Uses strategic questioning to uncover root issues',
    ],
    indicators: [
      'Asks strategic questions that reveal deeper concerns',
      'Connects objections to business impact',
      'Uses stakeholder\'s own language and priorities',
      'Maintains control while building trust',
      'Creates urgency without pressure',
      'Secures meaningful next step',
    ],
  },
];

export function getRubricForLevel(level: number): ObjectionHandlingRubric {
  return OBJECTION_HANDLING_RUBRIC.find(r => r.level === level) || OBJECTION_HANDLING_RUBRIC[0];
}
