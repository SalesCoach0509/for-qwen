import { test, expect } from '@playwright/test';
import { mockProvider } from './mock-provider';

if (process.env.PLAYWRIGHT_CHROME_PATH) {
  test.use({ launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROME_PATH }, video: 'off' });
}

test('performance moment stays connected through mocked live preparation, practice and analysis', async ({ page }) => {
  await mockProvider(page);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:3000/');
  await page.getByPlaceholder('Your name').fill('Test User');
  await page.getByPlaceholder('your.email@company.com').fill('test@example.com');
  await page.getByRole('button', { name: 'Sign In' }).click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('performance_coach_state') || '{}').capabilityHistory)).toEqual([]);
  await page.getByRole('button', { name: 'Add performance moment', exact: true }).click();
  await page.getByRole('button', { name: /Load Demo: Enterprise Renewal/ }).click();
  await page.getByRole('button', { name: /Generate Preparation Brief/ }).click();
  await expect(page.getByRole('heading', { name: 'Performance Plan' })).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('performance_coach_state') || '{}').interactions[0].status)).toBe('PREPARED');
  await expect(page.getByText('General Coach · No company information connected')).toBeVisible();
  await page.getByRole('button', { name: 'Practice this moment' }).first().click();
  await expect(page.getByRole('heading', { name: 'Practice this moment' })).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('performance_coach_state') || '{}').interactions[0].status)).toBe('PRACTICING');
  await page.getByPlaceholder('Respond naturally as yourself...').fill('Can you help me understand what is driving the concern?');
  await page.getByPlaceholder('Respond naturally as yourself...').press('Enter');
  await page.getByRole('button', { name: 'End & evaluate' }).waitFor();
  await page.getByRole('button', { name: 'End & evaluate' }).click();
  await expect(page.getByRole('heading', { name: 'Practice Results' })).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('performance_coach_state') || '{}').interactions[0].status)).toBe('READY');
  await page.getByRole('button', { name: "I've done the real meeting" }).first().click();
  await page.getByRole('button', { name: 'Load Demo Transcript' }).click();
  await page.getByRole('button', { name: 'Analyze Interaction' }).click();
  await expect(page.getByText("You prepared for this. Here's what actually happened.")).toBeVisible();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('performance_coach_state') || '{}'));
  expect(saved.interactions[0].status).toBe('ANALYZED');
  expect(saved.transcripts[0].performancePlanId).toBe(saved.briefs[0].id);
  expect(saved.transcripts[0].practiceSessionIds).toContain(saved.practiceSessions[0].id);
  expect(saved.analyses[0].transcriptId).toBe(saved.transcripts[0].id);
  expect(errors).toEqual([]);
});

test('failed live preparation keeps the moment in a failure state', async ({ page }) => {
  await page.route('http://localhost:3001/**', async route => {
    const headers = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    if (route.request().url().endsWith('/api/health')) return route.fulfill({ status: 200, headers, contentType: 'application/json', body: JSON.stringify({ provider: 'test', model: 'test-model' }) });
    return route.fulfill({ status: 500, headers, contentType: 'application/json', body: JSON.stringify({ error: 'LIVE_AI_ERROR', message: 'Simulated provider failure' }) });
  });
  await page.goto('http://127.0.0.1:3000/');
  await page.getByPlaceholder('Your name').fill('Test User');
  await page.getByPlaceholder('your.email@company.com').fill('test@example.com');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.getByRole('button', { name: 'Add performance moment', exact: true }).click();
  await page.getByRole('button', { name: /Load Demo: Enterprise Renewal/ }).click();
  await page.getByRole('button', { name: /Generate Preparation Brief/ }).click();
  await expect(page.getByRole('heading', { name: 'Performance plan unavailable' })).toBeVisible();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('performance_coach_state') || '{}'));
  expect(saved.interactions[0].status).toBe('PREPARATION_FAILED');
  expect(saved.briefs).toHaveLength(0);
});

test('live analysis accepts only cited transcript evidence', async ({ page }) => {
  const transcript = 'Customer: Pricing worries me.\nYou: What specifically worries you about the cost?\nCustomer: I need budget certainty.\nYou: Let us review business impact before changing terms.';
  await page.addInitScript(content => {
    localStorage.setItem('performance_coach_state', JSON.stringify({
      user: { id: 'user-1', name: 'Test User', email: 'test@example.com', role: 'Account Executive', organizationId: 'org-1', createdAt: new Date().toISOString() },
      organization: { id: 'org-1', name: 'Test Org' },
      interactions: [{ id: 'moment-1', userId: 'user-1', name: 'Renewal', customer: 'Acme', role: 'Account Executive', stakeholderRole: 'CFO', dateTime: new Date().toISOString(), objective: 'Agree a renewal path', agenda: 'Discuss concerns', status: 'PERFORMED', createdAt: new Date().toISOString() }],
      briefs: [{ id: 'plan-1', interactionId: 'moment-1', objective: 'Agree a renewal path', stakeholderPriorities: [], relevantContext: [], commercialGuidance: { discountLimits: 'Unknown', relevantPackage: 'Unknown', tradeOffs: [], escalationItems: [], note: 'Unknown' }, likelyObjections: [], recommendedQuestions: ['Clarify the price concern'], recommendedPositioning: [], thingsToAvoid: [], personalCoachingFocus: 'Clarify before discussing terms', practiceRecommendation: '', generatedAt: new Date().toISOString() }],
      practiceSessions: [], practiceEvaluations: [],
      transcripts: [{ id: 'transcript-1', interactionId: 'moment-1', content, source: 'paste', uploadedAt: new Date().toISOString(), performancePlanId: 'plan-1', practiceSessionIds: [], capabilitySnapshotBefore: [] }],
      analyses: [], capabilityHistory: [], companyContext: null,
    }));
  }, transcript);
  await page.route('http://localhost:3001/**', async route => {
    const headers = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    if (route.request().url().endsWith('/api/health')) return route.fulfill({ status: 200, headers, contentType: 'application/json', body: JSON.stringify({ provider: 'test', model: 'test-model' }) });
    const system = JSON.parse(route.request().postData() || '{}').messages?.[0]?.content || '';
    let result: unknown;
    if (system.includes('Extract only factual events')) result = { facts: [
      { line: 1, speaker: 'Customer', speakerType: 'STAKEHOLDER', sourceText: 'Pricing worries me.', eventType: 'OBJECTION', confidence: 0.9 },
      { line: 2, speaker: 'You', speakerType: 'EMPLOYEE', sourceText: 'What specifically worries you about the cost?', eventType: 'CLARIFICATION', confidence: 0.9 },
      { line: 4, speaker: 'You', speakerType: 'EMPLOYEE', sourceText: 'Let us review business impact before changing terms.', eventType: 'VALUE_STATEMENT', confidence: 0.9 },
      { line: 4, speaker: 'You', speakerType: 'EMPLOYEE', sourceText: 'Offered 20% discount', eventType: 'CONCESSION', confidence: 0.9 },
    ] };
    else if (system.includes('Convert facts to observable')) result = { behaviors: [
      { description: 'Asked what specifically concerned the customer', evidenceIds: ['fact-2'], classification: 'OBSERVED' },
      { description: 'Offered a discount', evidenceIds: ['fact-4'], classification: 'OBSERVED' },
    ] };
    else if (system.includes('Compare the plan')) result = { rows: [{ intended: 'Clarify the price concern', actual: 'Asked what specifically worried the customer', evidenceIds: ['fact-2'], impact: 'Low', explanation: 'Clarification supported the response.' }] };
    else if (system.includes('Assess Objection Handling')) result = { score: 3.5, confidence: 0.7, strengths: ['Asked a clarifying question'], missedOpportunities: [], likelyImpact: 'Limited but relevant evidence', weakness: '', dimensions: { Clarification: { score: 3.5, evidenceIds: ['fact-2'] }, 'Commercial Discipline': { score: 5, evidenceIds: ['fact-4'] } } };
    else if (system.includes('Verify each claimed')) result = { approvedEvidenceIds: ['fact-2'], approvedRowIndices: [0], scoreSupported: true };
    else if (system.includes('Recommend exactly one')) result = { title: 'Clarify under pressure', description: 'Practice probing the concern.', recommendedAction: 'Ask one clarifying question before proposing terms.', estimatedDuration: '5 minutes' };
    else result = {};
    return route.fulfill({ status: 200, headers, contentType: 'application/json', body: JSON.stringify({ content: JSON.stringify(result) }) });
  });
  await page.goto('http://127.0.0.1:3000/');
  await page.getByRole('button', { name: 'Analyze what happened' }).first().click();
  await expect(page.getByText("You prepared for this. Here's what actually happened.")).toBeVisible();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('performance_coach_state') || '{}'));
  expect(saved.interactions[0].status).toBe('ANALYZED');
  expect(saved.analyses[0].capabilityDiagnosis[0].evidence).toHaveLength(1);
  expect(saved.analyses[0].capabilityDiagnosis[0].evidence[0].sourceText).toContain('What specifically worries you');
  expect(saved.analyses[0].capabilityDiagnosis[0].dimensions.Clarification).toBe(3.5);
  expect(saved.analyses[0].capabilityDiagnosis[0].dimensions['Commercial Discipline']).toBeNull();
  expect(JSON.stringify(saved.analyses[0].capabilityDiagnosis[0].evidence)).not.toContain('discount');
  expect(saved.aiOperations.filter((operation: { success: boolean }) => operation.success)).toHaveLength(6);
});

test('zero evidence never creates a capability score', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('performance_coach_state', JSON.stringify({
      user: { id: 'u', name: 'Test', email: 'test@example.com', role: 'Employee', organizationId: 'o', createdAt: new Date().toISOString() },
      organization: { id: 'o', name: 'Test' },
      interactions: [{ id: 'm', userId: 'u', name: 'Follow up', customer: 'Client', role: 'Employee', dateTime: new Date().toISOString(), objective: 'Understand concerns', agenda: '', status: 'PERFORMED', createdAt: new Date().toISOString() }],
      briefs: [{ id: 'b', interactionId: 'm', objective: 'Understand concerns', stakeholderPriorities: [], relevantContext: [], commercialGuidance: { discountLimits: 'Unknown', relevantPackage: 'Unknown', tradeOffs: [], escalationItems: [], note: '' }, likelyObjections: [], recommendedQuestions: [], recommendedPositioning: [], thingsToAvoid: [], personalCoachingFocus: '', practiceRecommendation: '', generatedAt: new Date().toISOString() }],
      practiceSessions: [], practiceEvaluations: [],
      transcripts: [{ id: 't', interactionId: 'm', content: 'Customer: Thank you for meeting.', source: 'paste', uploadedAt: new Date().toISOString() }],
      analyses: [], capabilityHistory: [], companyContext: null,
    }));
  });
  await page.route('http://localhost:3001/**', async route => {
    const headers = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    if (route.request().url().endsWith('/api/health')) return route.fulfill({ status: 200, headers, contentType: 'application/json', body: JSON.stringify({ provider: 'test', model: 'test-model' }) });
    const system = JSON.parse(route.request().postData() || '{}').messages?.[0]?.content || '';
    const result = system.includes('Extract only factual events') ? { facts: [] }
      : system.includes('Convert facts to observable') ? { behaviors: [] }
      : system.includes('Compare the plan') ? { rows: [{ intended: 'Clarify the concern', actual: 'Offered a discount', evidenceIds: [], impact: 'High', explanation: 'Unsupported claim' }] }
      : system.includes('Assess Objection Handling') ? { score: 4.5, confidence: 0.9, strengths: ['Great discounting'], missedOpportunities: [], likelyImpact: 'Strong', weakness: '' }
      : { title: 'Collect evidence', description: 'Transcript is too short.', recommendedAction: 'Add a fuller transcript.', estimatedDuration: '5 minutes' };
    return route.fulfill({ status: 200, headers, contentType: 'application/json', body: JSON.stringify({ content: JSON.stringify(result) }) });
  });
  await page.goto('http://127.0.0.1:3000/');
  await page.getByRole('button', { name: 'Analyze what happened' }).first().click();
  await expect(page.getByText('NOT OBSERVED', { exact: true })).toBeVisible();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('performance_coach_state') || '{}'));
  expect(saved.analyses[0].capabilityDiagnosis[0].score).toBe(0);
  expect(saved.analyses[0].planVsActual[0].observation).toBe('INSUFFICIENT_EVIDENCE');
  expect(saved.capabilityHistory).toHaveLength(0);
});

test('live practice grounds the evaluation in the employee turn', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('performance_coach_state', JSON.stringify({
      user: { id: 'u', name: 'Test', email: 'test@example.com', role: 'Employee', organizationId: 'o', createdAt: new Date().toISOString() },
      organization: { id: 'o', name: 'Test' },
      interactions: [{ id: 'm', userId: 'u', name: 'Renewal', customer: 'Acme', role: 'Employee', stakeholderRole: 'CFO', dateTime: new Date(Date.now() + 86400000).toISOString(), objective: 'Agree next steps', agenda: '', status: 'PREPARED', createdAt: new Date().toISOString() }],
      briefs: [{ id: 'b', interactionId: 'm', objective: 'Agree next steps', stakeholderPriorities: [], relevantContext: [], commercialGuidance: { discountLimits: 'Unknown', relevantPackage: 'Unknown', tradeOffs: [], escalationItems: [], note: '' }, likelyObjections: ['Possible price concern'], recommendedQuestions: ['Clarify the concern'], recommendedPositioning: [], thingsToAvoid: [], personalCoachingFocus: 'Clarify before responding', practiceRecommendation: 'Ask why price matters', generatedAt: new Date().toISOString() }],
      practiceSessions: [], practiceEvaluations: [], transcripts: [], analyses: [], capabilityHistory: [], companyContext: null,
    }));
  });
  await page.route('http://localhost:3001/**', async route => {
    const headers = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    if (route.request().url().endsWith('/api/health')) return route.fulfill({ status: 200, headers, contentType: 'application/json', body: JSON.stringify({ provider: 'test', model: 'test-model' }) });
    const body = JSON.parse(route.request().postData() || '{}');
    if (route.request().url().endsWith('/api/ai/roleplay/respond')) return route.fulfill({ status: 200, headers, contentType: 'application/json', body: JSON.stringify({ response: body.userMessage ? 'That helps. What would you propose next?' : 'The pricing concerns me. How would you handle it?', sessionId: body.sessionId, conversationState: 'CURIOUS' }) });
    const system = body.messages?.[0]?.content || '';
    const result = system.includes('Extract only observable employee behaviours')
      ? { evidence: [{ turnNumber: 2, sourceText: 'What specifically worries you about the price?', behaviorObserved: 'Asked a clarifying question', classification: 'OBSERVED' }] }
      : system.includes('You are an expert sales coach evaluating')
      ? { objectionHandlingScore: 3.5, objectionHandlingLevel: 4, evidence: [], strength: 'Asked a clarifying question', weakness: 'Needs to connect to value', recommendedIntervention: 'Practice value positioning', overallReadiness: 70, otherCapabilities: [] }
      : system.includes('Recommend exactly one short practice intervention')
      ? { recommendation: 'Ask one question, then connect to value.', successCriterion: 'Clarify before offering terms.' }
      : { verdict: 'PASS', reason: 'Grounded in employee turn', confidence: 0.8 };
    return route.fulfill({ status: 200, headers, contentType: 'application/json', body: JSON.stringify({ content: JSON.stringify(result) }) });
  });
  await page.goto('http://127.0.0.1:3000/');
  await page.getByRole('button', { name: 'Practice this moment' }).first().click();
  await expect(page.getByText('The pricing concerns me. How would you handle it?')).toBeVisible();
  await page.getByPlaceholder('Respond naturally as yourself...').fill('What specifically worries you about the price?');
  await page.getByPlaceholder('Respond naturally as yourself...').press('Enter');
  await expect(page.getByText('That helps. What would you propose next?')).toBeVisible();
  await page.getByRole('button', { name: 'End & evaluate' }).click();
  await expect(page.getByRole('heading', { name: 'Practice Results' })).toBeVisible();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('performance_coach_state') || '{}'));
  expect(saved.interactions[0].status).toBe('READY');
  expect(saved.practiceEvaluations[0].capabilityScores[0].evidence[0].sourceText).toBe('What specifically worries you about the price?');
  expect(saved.practiceEvaluations[0].capabilityScores[0].evidence[0].interactionId).toBe('m');
  expect(saved.practiceEvaluations[0].nextPractice).toContain('Clarify before offering terms');
});
