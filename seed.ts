import { Interaction, CapabilityHistory, CapabilityName } from '../types';

export const demoInteraction: Partial<Interaction> = {
  name: 'Enterprise Renewal Meeting',
  customer: 'Acme Corporation',
  role: 'Account Executive',
  dateTime: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
  objective: 'Renew annual contract ($240K) and identify expansion opportunity for analytics module',
  agenda: '1. Review implementation progress\n2. Address outstanding support tickets\n3. Discuss pricing for renewal\n4. Present analytics module expansion\n5. Agree on next steps and timeline',
  notes: `Customer Context:
- Acme Corp is a mid-market manufacturing company (2,500 employees)
- Current contract: $240K/year, expires in 2 weeks
- Implementation started 6 months ago, 70% complete
- Key stakeholder: Sarah Chen, CFO
- Recent support issue: Data migration delays caused 2-week setback
- Competitor: DataFlow Pro offered them a quote 15% lower
- Champion: Mike Torres, VP Operations (supports our product)
- Risk: Sarah is focused on cost reduction this quarter
- Opportunity: They mentioned interest in analytics for supply chain optimization`,
  additionalContext: `Previous meeting notes (from 3 weeks ago):
- Sarah asked about ROI timeline - we said 6-9 months post-implementation
- Mike mentioned the board is reviewing all vendor contracts
- They had a bad experience with a previous vendor (slow support)
- Budget approval needed from Sarah for anything above current spend
- They're evaluating 2 competitors for the analytics expansion`,
};

export const demoTranscript = `[Meeting Transcript - Acme Corporation Renewal Meeting]
Date: ${new Date().toLocaleDateString()}
Attendees: Sarah Chen (CFO), Mike Torres (VP Operations), You (Account Executive)

You: Good afternoon Sarah, Mike. Thanks for making time. I know you're both busy.

Sarah: Of course. Let's get into it. We need to talk about the contract renewal and frankly, the pricing.

You: Absolutely. Before we get to pricing, I wanted to understand how the implementation is going and what your priorities are for the coming year.

Sarah: The implementation has been slower than expected. We're six months in and only at 70%. That's concerning.

You: I understand that concern. The data migration was more complex than anticipated, but we're now on track for completion by end of next month.

Mike: The team is frustrated with the delays. We had to extend our legacy system contract because of this.

You: I hear that, and I want to address it. Can I ask - what's the business impact of these delays on your operations?

Sarah: Well, we can't get the reporting we need for the board. That's the main issue.

You: I see. And how does that affect your decision-making for the next quarter?

Sarah: It means we're flying blind on supply chain costs. We estimated $2M in overspend last quarter but can't confirm the exact numbers.

You: That's significant. $2M in unconfirmed overspend - that's what's driving the urgency around getting this right?

Sarah: Yes, exactly. We need visibility.

You: So if we can get you to full implementation and deliver that supply chain visibility within the next 90 days, what would that be worth to the business?

Sarah: If we could identify even 10% of that overspend, that's $200K in savings. But I still have a budget problem.

You: I understand. Let me be transparent about what we can do on pricing.

Sarah: DataFlow Pro quoted us 15% less. I need you to match that or we'll have to consider switching.

You: I appreciate you being direct. Let me address this. First - switching at this stage means another 6-month implementation cycle. What's the cost of that delay?

Sarah: That's... a fair point. But the savings are real.

You: Can I share something? The reason our pricing is where it is relates to the implementation support and ongoing success management that DataFlow doesn't include. But I also want to solve your budget problem.

Mike: What are you thinking?

You: A few options. We could structure the renewal with a payment schedule that aligns with your fiscal quarters. We could also look at phasing the analytics module - start with supply chain analytics first, which addresses your immediate need, and add the other modules next year.

Sarah: That's interesting. What would the phased approach look like financially?

You: For the core renewal, I can offer a 5% adjustment given the implementation delays - that's within my authority. For the analytics module, if we phase it, we can start with just the supply chain package at $45K instead of the full $85K. Total first year would be $273K vs the $325K for everything at once.

Sarah: And the full analytics suite next year?

You: We'd lock in today's pricing for 12 months, so you'd have budget certainty.

Mike: Sarah, this addresses the immediate need without the full capital outlay.

Sarah: I need to think about this. Can you send me the phased proposal by Friday?

You: Absolutely. I'll have it to you by Thursday end of day. Can we schedule a 30-minute follow-up next Wednesday to finalize?

Sarah: Yes, that works. Send the invite.

You: Perfect. One more thing - regarding the implementation timeline, I'm assigning a dedicated success manager to your account starting next week. They'll provide weekly status updates directly to you, Mike.

Mike: That would help a lot. Thank you.

You: Great. Let me summarize our next steps: I'll send the phased proposal by Thursday, we'll follow up Wednesday, and your dedicated success manager starts next Monday. Sound good?

Sarah: Sounds good. Thanks.

[Meeting ended]`;

export const initialCapabilityHistory: CapabilityHistory[] = [
  {
    capability: 'Discovery' as CapabilityName,
    scores: [
      { date: '2024-11-01', score: 2.0, source: 'Discovery roleplay' },
      { date: '2024-11-15', score: 2.3, source: 'Client meeting - TechStart' },
      { date: '2024-12-01', score: 2.5, source: 'Renewal practice' },
      { date: '2024-12-10', score: 2.8, source: 'Client meeting - GlobalTech' },
    ],
    currentScore: 2.8,
    trend: 'improving',
    knownWeakness: 'Moves to solution mode before fully establishing business impact',
    recentIntervention: 'Discovery depth roleplay - practiced second-level questioning',
    nextRecommendation: 'Practice connecting discovery findings to economic impact',
  },
  {
    capability: 'Questioning' as CapabilityName,
    scores: [
      { date: '2024-11-01', score: 2.5, source: 'Initial assessment' },
      { date: '2024-11-20', score: 2.8, source: 'Client meeting - DataCorp' },
      { date: '2024-12-05', score: 3.0, source: 'Discovery practice' },
    ],
    currentScore: 3.0,
    trend: 'improving',
    knownWeakness: 'Tends to ask closed questions under pressure',
    recentIntervention: 'Open question drill',
    nextRecommendation: 'Practice strategic questioning sequences',
  },
  {
    capability: 'Active Listening' as CapabilityName,
    scores: [
      { date: '2024-11-01', score: 3.0, source: 'Initial assessment' },
      { date: '2024-11-25', score: 3.2, source: 'Client meeting' },
      { date: '2024-12-08', score: 3.3, source: 'Roleplay evaluation' },
    ],
    currentScore: 3.3,
    trend: 'improving',
    nextRecommendation: 'Practice paraphrasing and confirming understanding',
  },
  {
    capability: 'Value Articulation' as CapabilityName,
    scores: [
      { date: '2024-11-01', score: 2.8, source: 'Initial assessment' },
      { date: '2024-11-18', score: 2.5, source: 'Client meeting - rushed pitch' },
      { date: '2024-12-03', score: 3.0, source: 'Value proposition practice' },
    ],
    currentScore: 3.0,
    trend: 'improving',
    knownWeakness: 'Jumps to features before establishing value context',
    recentIntervention: 'Value-first messaging workshop',
    nextRecommendation: 'Practice quantifying business impact before presenting solutions',
  },
  {
    capability: 'Objection Handling' as CapabilityName,
    scores: [
      { date: '2024-11-01', score: 2.2, source: 'Initial assessment' },
      { date: '2024-11-22', score: 2.5, source: 'Price objection roleplay' },
      { date: '2024-12-06', score: 2.7, source: 'Competitive objection practice' },
    ],
    currentScore: 2.7,
    trend: 'improving',
    knownWeakness: 'Tends to discount too quickly when price is raised',
    recentIntervention: 'Price objection handling - defend value before concessions',
    nextRecommendation: 'Practice reframing price objections as value conversations',
  },
  {
    capability: 'Negotiation' as CapabilityName,
    scores: [
      { date: '2024-11-01', score: 2.5, source: 'Initial assessment' },
      { date: '2024-12-01', score: 2.8, source: 'Negotiation roleplay' },
    ],
    currentScore: 2.8,
    trend: 'improving',
    knownWeakness: 'Concedes too early in negotiation sequence',
    nextRecommendation: 'Practice trading concessions rather than giving them',
  },
  {
    capability: 'Commercial Discipline' as CapabilityName,
    scores: [
      { date: '2024-11-01', score: 2.3, source: 'Initial assessment' },
      { date: '2024-11-28', score: 2.5, source: 'Deal review' },
      { date: '2024-12-07', score: 2.6, source: 'Pricing scenario practice' },
    ],
    currentScore: 2.6,
    trend: 'improving',
    knownWeakness: 'Offers discounts before exploring alternatives',
    recentIntervention: 'Commercial authority boundaries review',
    nextRecommendation: 'Practice structuring deals without immediate price concessions',
  },
  {
    capability: 'Next-Step Control' as CapabilityName,
    scores: [
      { date: '2024-11-01', score: 3.2, source: 'Initial assessment' },
      { date: '2024-11-30', score: 3.5, source: 'Client meeting' },
      { date: '2024-12-09', score: 3.5, source: 'Roleplay' },
    ],
    currentScore: 3.5,
    trend: 'stable',
    nextRecommendation: 'Maintain current level - focus on multi-threading next steps',
  },
];
