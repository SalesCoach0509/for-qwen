import { test, expect } from '@playwright/test';
import { mockProvider, openPlan } from './mock-provider';

if (process.env.PLAYWRIGHT_CHROME_PATH) test.use({ launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROME_PATH }, video: 'off' });

test('custom scenario preserves facts and flows into the same performance moment', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  const requests = await mockProvider(page);
  await openPlan(page);
  await page.getByRole('button', { name: 'Customize practice scenario' }).click();
  await expect(page.getByLabel('Deal value', { exact: true })).toHaveValue('');
  await page.getByRole('button', { name: /Discovery & qualification/ }).click();
  await expect(page.getByLabel('Deal value', { exact: true })).toHaveValue('');
  await page.getByLabel('Solution being sold').fill('Actual product');
  await page.getByLabel('Buyer role').selectOption('CFO');
  await page.getByLabel('Known facts').fill('The buyer requested a review');
  await page.getByLabel('Important unknowns').fill('Budget is unknown');
  await page.getByRole('button', { name: 'Generate scenario plan', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Custom value discussion' })).toBeVisible();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('performance_coach_state') || '{}'));
  expect(saved.interactions[0].status).toBe('PREPARED');
  expect(saved.interactions[0].scenarioPlan.interactionId).toBe(saved.interactions[0].id);
  expect(saved.interactions[0].scenarioPlan.knownFacts).toEqual(['The buyer requested a review']);
  expect(saved.interactions[0].scenarioPlan.sourceMode).toBe('REAL_CONTEXT');
  await page.getByRole('button', { name: 'Practice this scenario' }).click();
  await expect(page.getByText('What supports the value of your proposal?')).toBeVisible();
  expect(requests.find(r => r.config)?.config.dealIntelligence.solution).toBe('Actual product');
  const practicing = await page.evaluate(() => JSON.parse(localStorage.getItem('performance_coach_state') || '{}'));
  expect(practicing.practiceSessions).toHaveLength(1);
  expect(practicing.interactions[0].status).toBe('PRACTICING');
  expect(errors).toEqual([]);
});

test('failed scenario generation saves no plan and does not advance the moment', async ({ page }) => {
  await mockProvider(page, { scenarioFailure: true });
  await openPlan(page);
  await page.getByRole('button', { name: 'Customize practice scenario' }).click();
  await page.getByRole('button', { name: 'Load synthetic demo case' }).click();
  await expect(page.getByRole('status')).toContainText('Synthetic demo context');
  await page.getByRole('button', { name: 'Generate scenario plan', exact: true }).click();
  await expect(page.getByText(/Scenario generation failed/)).toBeVisible();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('performance_coach_state') || '{}'));
  expect(saved.interactions[0].status).toBe('PREPARED');
  expect(saved.interactions[0].scenarioPlan).toBeUndefined();
  await expect(page.getByRole('button', { name: 'Practice this scenario' })).toHaveCount(0);
});

test('degraded backend remains a visible failure without switching to mock coaching', async ({ page }) => {
  await mockProvider(page, { degraded: true });
  await openPlan(page);
  await expect(page.getByRole('heading', { name: 'Performance plan unavailable' })).toBeVisible();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('performance_coach_state') || '{}'));
  expect(saved.briefs).toHaveLength(0);
  expect(saved.interactions[0].status).toBe('PREPARATION_FAILED');
});

test('existing lowercase status and saved scenario survive migration', async ({ page }) => {
  const requests = await mockProvider(page);
  await openPlan(page);
  await expect(page.getByRole('heading', { name: 'Performance Plan' })).toBeVisible();
  await page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem('performance_coach_state') || '{}');
    saved.interactions[0].status = 'prepared';
    saved.interactions[0].scenarioPlan = { scenarioTitle: 'Saved scenario', stakeholderRole: 'Procurement Lead', objectives: ['Clarify risk'], likelyObjections: ['Risk'], pressureLevel: 'high', personality: 'Direct', commercialConstraints: 'Unknown', hiddenPriorities: [], desiredOutcome: 'Agree a review', module: 'negotiation' };
    localStorage.setItem('performance_coach_state', JSON.stringify(saved));
  });
  await page.reload();
  await page.getByRole('button', { name: 'Practice this moment' }).first().click();
  await expect(page.getByRole('heading', { name: 'Saved scenario' })).toBeVisible();
  await expect(page.getByText('What supports the value of your proposal?')).toBeVisible();
  expect(requests.find(r => r.config)?.config.stakeholderRole).toBe('Procurement Lead');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('performance_coach_state') || '{}'));
  expect(saved.interactions[0].status).toBe('PRACTICING');
  expect(saved.interactions[0].scenarioPlan.interactionId).toBe(saved.interactions[0].id);
});

test('weak practice evidence does not mark the employee ready', async ({ page }) => {
  await mockProvider(page, { practiceScore: 1.5 });
  await openPlan(page);
  await page.getByRole('button', { name: 'Practice this moment' }).first().click();
  await expect(page.getByText('What supports the value of your proposal?')).toBeVisible();
  await page.getByPlaceholder('Respond naturally as yourself...').fill('What concerns you?');
  await page.getByPlaceholder('Respond naturally as yourself...').press('Enter');
  await expect(page.getByText('What would you propose next?')).toBeVisible();
  await page.getByRole('button', { name: 'End & evaluate' }).click();
  await expect(page.getByRole('heading', { name: 'Practice Results' })).toBeVisible();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('performance_coach_state') || '{}'));
  expect(saved.practiceEvaluations[0].readiness).toBe('PRACTICE_ONCE_MORE');
  expect(saved.interactions[0].status).toBe('PRACTICING');
});
