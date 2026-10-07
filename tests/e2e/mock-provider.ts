import { Page } from '@playwright/test';

export async function mockProvider(page: Page, options: { scenarioFailure?: boolean; degraded?: boolean; practiceScore?: number } = {}) {
  const requests: any[] = [];
  await page.route('http://localhost:3001/**', async route => {
    const headers = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };
    const send = (body: unknown, status = 200) => route.fulfill({ status, headers, contentType: 'application/json', body: JSON.stringify(body) });
    if (route.request().method() === 'OPTIONS') return send({}, 204);
    if (route.request().url().endsWith('/api/health')) return send({ status: options.degraded ? 'degraded' : 'ok', apiKeySet: !options.degraded, provider: 'test', model: 'test-model' });
    const body = route.request().postDataJSON();
    requests.push(body);
    if (options.degraded) return send({ error: 'LIVE_AI_ERROR', message: 'Provider unavailable' }, 503);
    if (route.request().url().endsWith('/api/ai/roleplay/respond')) return send({ response: body.userMessage ? 'What would you propose next?' : 'What supports the value of your proposal?', sessionId: body.sessionId, conversationState: 'CURIOUS' });
    const system = body.messages?.[0]?.content || '';
    let result: unknown = {};
    if (body.options?.operation === 'SCENARIO_PLAN_GENERATION') {
      if (options.scenarioFailure) return send({ error: 'LIVE_AI_ERROR', message: 'Scenario generation failed' }, 503);
      result = { scenarioTitle: 'Custom value discussion', stakeholderRole: 'CFO', personality: 'Skeptical', objectives: ['Understand value'], likelyObjections: ['Value is unclear'], desiredOutcome: 'Agree a review', requiredBehaviors: ['Clarify the concern'], forbiddenMoves: ['Inventing evidence'], knownFacts: ['Invented customer fact'], unknowns: [], objectionLadder: ['Value is unclear'], triggerConditions: ['After clarification'] };
    } else if (system.includes('Generate a concise preparation brief')) result = { objective: 'Agree next steps', stakeholderPriorities: [], relevantContext: [], commercialGuidance: { discountLimits: 'Unknown', relevantPackage: 'Unknown', tradeOffs: [], escalationItems: [], note: 'Unknown' }, likelyObjections: ['Possible value concern'], recommendedQuestions: ['What matters most?'], recommendedPositioning: [], thingsToAvoid: [], personalCoachingFocus: 'Clarify the concern', practiceRecommendation: 'Practice clarifying before responding' };
    else if (system.includes('Extract only observable employee behaviours')) {
      const conversation = body.messages[1].content as string;
      const match = conversation.match(/\[Turn (\d+)\] Employee: (.*)/);
      result = { evidence: match ? [{ turnNumber: Number(match[1]), sourceText: match[2], behaviorObserved: 'Asked a clarifying question', classification: 'OBSERVED' }] : [] };
    } else if (system.includes('You are an expert sales coach evaluating')) result = { objectionHandlingScore: options.practiceScore ?? 3.5, objectionHandlingLevel: 4, strength: 'Asked a clarifying question', weakness: 'Connect to value', overallReadiness: 75, otherCapabilities: [] };
    else if (system.includes('Recommend exactly one short practice intervention')) result = { recommendation: 'Clarify first', successCriterion: 'Ask before proposing terms' };
    else if (system.includes('Extract only factual events')) result = { facts: [] };
    else if (system.includes('Convert facts to observable')) result = { behaviors: [] };
    else if (system.includes('Compare the plan')) result = { rows: [] };
    else if (system.includes('Assess Objection Handling')) result = { score: 0, confidence: 0, strengths: [], missedOpportunities: [] };
    else if (system.includes('Recommend exactly one')) result = { title: 'Collect evidence', description: 'Add a full transcript', recommendedAction: 'Add more evidence', estimatedDuration: '5 minutes' };
    else result = { verdict: 'PASS', reason: 'Grounded employee evidence', confidence: 0.8 };
    return send({ content: JSON.stringify(result) });
  });
  return requests;
}

export async function openPlan(page: Page) {
  await page.goto('http://127.0.0.1:3000/');
  await page.getByPlaceholder('Your name').fill('Test User');
  await page.getByPlaceholder('your.email@company.com').fill('test@example.com');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.getByRole('button', { name: 'Add performance moment', exact: true }).click();
  await page.getByRole('button', { name: /Load Demo: Enterprise Renewal/ }).click();
  await page.getByRole('button', { name: /Generate Preparation Brief/ }).click();
}
