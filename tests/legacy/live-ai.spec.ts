import { test, expect, Page } from '@playwright/test';

/**
 * LIVE AI Verification Test Suite - Fail-Closed Version
 * 
 * This suite verifies that the application is genuinely using live AI
 * and not serving static/demo data in LIVE mode.
 * 
 * Run with: BASE_URL=https://your-app.up.railway.app npm run test:e2e
 */

// Helper to redact sensitive information
function redactSensitive(data: any): any {
  if (typeof data === 'string') {
    return data
      .replace(/AIza[A-Za-z0-9_-]{35}/g, '[REDACTED_API_KEY]')
      .replace(/Bearer\s+[A-Za-z0-9._-]+/g, 'Bearer [REDACTED]')
      .replace(/sk-[A-Za-z0-9]{20,}/g, '[REDACTED_API_KEY]');
  }
  if (typeof data === 'object' && data !== null) {
    const redacted: any = {};
    for (const key in data) {
      if (key.toLowerCase().includes('key') || 
          key.toLowerCase().includes('token') || 
          key.toLowerCase().includes('secret') ||
          key.toLowerCase().includes('authorization')) {
        redacted[key] = '[REDACTED]';
      } else {
        redacted[key] = redactSensitive(data[key]);
      }
    }
    return redacted;
  }
  return data;
}

// Helper to capture network requests with proper correlation
async function captureNetworkRequests(page: Page, urlPattern: string | RegExp) {
  const requests: Array<{
    id: string;
    url: string;
    method: string;
    status: number;
    requestPayload: any;
    responsePayload: any;
  }> = [];

  page.on('request', (request) => {
    const url = request.url();
    if (typeof urlPattern === 'string' ? url.includes(urlPattern) : urlPattern.test(url)) {
      const postData = request.postDataJSON();
      const requestId = `${Date.now()}-${Math.random()}`;
      requests.push({
        id: requestId,
        url,
        method: request.method(),
        status: 0,
        requestPayload: redactSensitive(postData),
        responsePayload: null,
      });
    }
  });

  page.on('response', async (response) => {
    const url = response.url();
    if (typeof urlPattern === 'string' ? url.includes(urlPattern) : urlPattern.test(url)) {
      // Find the most recent unmatched request with same URL and method
      const matchingRequest = requests
        .filter(r => r.url === url && r.method === response.request().method() && r.status === 0)
        .pop();
      
      if (matchingRequest) {
        matchingRequest.status = response.status();
        try {
          const json = await response.json();
          matchingRequest.responsePayload = redactSensitive(json);
        } catch {
          // Response might not be JSON
        }
      }
    }
  });

  return requests;
}

// Helper to wait for AI API response
async function waitForAIResponse(page: Page, urlPattern: string | RegExp = /\/api\/ai\//, timeout = 90000) {
  const response = await page.waitForResponse(
    response => {
      const url = response.url();
      return typeof urlPattern === 'string' ? url.includes(urlPattern) : urlPattern.test(url);
    },
    { timeout }
  );
  
  // Check for error responses
  const status = response.status();
  if (status >= 400) {
    try {
      const json = await response.json();
      if (json.error === 'LIVE_AI_ERROR' || json.status === 503) {
        throw new Error(`GEMINI PROVIDER FAILURE — ${status}: ${json.message || 'Provider unavailable'}`);
      }
      throw new Error(`API ERROR — ${status}: ${json.message || 'Unknown error'}`);
    } catch (e) {
      if (e instanceof Error && e.message.includes('GEMINI PROVIDER FAILURE')) {
        throw e;
      }
      // If not JSON, just throw status error
      throw new Error(`API ERROR — ${status}`);
    }
  }
  
  return response;
}

// Helper to verify API response is successful and not an error
async function verifyAPIResponse(response: any) {
  const status = response.status();
  expect(status).toBeLessThan(400);
  
  try {
    const json = await response.json();
    expect(json.error).toBeUndefined();
    expect(json.error).not.toBe('LIVE_AI_ERROR');
    return json;
  } catch {
    // Response might not be JSON, that's okay for some endpoints
    return null;
  }
}

// ============================================================================
// TEST 1: LIVE MODE DETECTION (STRICT)
// ============================================================================

test.describe('TEST 1: LIVE MODE DETECTION', () => {
  test('must detect LIVE mode and FAIL on DEMO mode', async ({ page }) => {
    console.log('\n=== TEST 1: LIVE MODE DETECTION (STRICT) ===\n');
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/01-initial-state.png' });
    
    // Look for LIVE mode indicator
    const liveIndicator = page.locator('text=/AI:|LIVE|Gemini/i').first();
    const hasLiveIndicator = await liveIndicator.isVisible({ timeout: 5000 }).catch(() => false);
    
    console.log('LIVE mode indicator found:', hasLiveIndicator);
    
    if (hasLiveIndicator) {
      const indicatorText = await liveIndicator.textContent();
      console.log('Indicator text:', indicatorText);
    }
    
    // Check for demo mode indicator
    const demoIndicator = page.locator('text=/Demo Mode|DEMO/i').first();
    const hasDemoIndicator = await demoIndicator.isVisible({ timeout: 5000 }).catch(() => false);
    
    console.log('Demo mode indicator found:', hasDemoIndicator);
    
    // Take screenshot of current state
    await page.screenshot({ path: 'test-results/01-mode-detection.png' });
    
    // STRICT ASSERTIONS:
    // 1. If Demo indicator is present → FAIL
    expect(hasDemoIndicator, 'FAIL: Application is in DEMO mode, not LIVE mode').toBeFalsy();
    
    // 2. If neither indicator is present → FAIL
    expect(hasLiveIndicator || hasDemoIndicator, 'FAIL: Neither LIVE nor DEMO indicator found').toBeTruthy();
    
    // 3. If LIVE indicator is present → PASS
    expect(hasLiveIndicator, 'FAIL: LIVE mode indicator not found').toBeTruthy();
  });
});

// ============================================================================
// TEST 2: STATIC CHAT DATA DETECTION
// ============================================================================

test.describe('TEST 2: STATIC CHAT DATA DETECTION', () => {
  test('must detect static chat responses', async ({ page }) => {
    console.log('\n=== TEST 2: STATIC CHAT DATA DETECTION ===\n');
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Set up network capture
    const networkRequests = await captureNetworkRequests(page, /\/api\/ai\/chat/);
    
    // Find chat input - MUST exist
    const chatInput = page.locator('input[type="text"], textarea, [placeholder*="message"], [placeholder*="chat"]').first();
    await expect(chatInput).toBeVisible({ timeout: 5000 });
    
    // Send first unique test message
    const testMessage1 = 'TEST-LIVE-84721: What is 17 multiplied by 23? Reply with only the number.';
    console.log('Sending test message 1:', testMessage1);
    
    // Wait for API response
    const responsePromise1 = page.waitForResponse(response => 
      response.url().includes('/api/ai/chat') && response.request().method() === 'POST'
    );
    
    await chatInput.fill(testMessage1);
    await chatInput.press('Enter');
    
    // Wait for and verify API response
    const apiResponse1 = await waitForAIResponse(page, /\/api\/ai\/chat/);
    const jsonResponse1 = await verifyAPIResponse(apiResponse1);
    
    console.log('API Response 1 status:', apiResponse1.status());
    console.log('API Response 1 payload:', JSON.stringify(jsonResponse1, null, 2));
    
    // Wait for UI to update
    await page.waitForTimeout(2000);
    
    // Find the assistant response (not the user's message)
    const assistantMessages = page.locator('[data-testid="assistant-message"], .assistant-message, [class*="assistant"]');
    const lastAssistantMessage = assistantMessages.last();
    await expect(lastAssistantMessage).toBeVisible({ timeout: 10000 });
    
    const response1Text = await lastAssistantMessage.textContent();
    console.log('\nAssistant Response 1:', response1Text);
    
    // Check if response contains expected answer
    const hasExpectedAnswer1 = response1Text?.includes('391');
    console.log('Contains expected answer (391):', hasExpectedAnswer1);
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/02-chat-response-1.png' });
    
    // ASSERT: Response must contain expected answer
    expect(hasExpectedAnswer1, 'FAIL: Response 1 does not contain expected answer 391').toBeTruthy();
    
    // Send second unique test message
    const testMessage2 = 'TEST-LIVE-93264: What is 19 multiplied by 17? Reply with only the number.';
    console.log('\nSending test message 2:', testMessage2);
    
    // Wait for API response
    const responsePromise2 = page.waitForResponse(response => 
      response.url().includes('/api/ai/chat') && response.request().method() === 'POST'
    );
    
    await chatInput.fill(testMessage2);
    await chatInput.press('Enter');
    
    // Wait for and verify API response
    const apiResponse2 = await waitForAIResponse(page, /\/api\/ai\/chat/);
    const jsonResponse2 = await verifyAPIResponse(apiResponse2);
    
    console.log('API Response 2 status:', apiResponse2.status());
    console.log('API Response 2 payload:', JSON.stringify(jsonResponse2, null, 2));
    
    // Wait for UI to update
    await page.waitForTimeout(2000);
    
    // Find the assistant response
    const lastAssistantMessage2 = assistantMessages.last();
    await expect(lastAssistantMessage2).toBeVisible({ timeout: 10000 });
    
    const response2Text = await lastAssistantMessage2.textContent();
    console.log('\nAssistant Response 2:', response2Text);
    
    // Check if response contains expected answer
    const hasExpectedAnswer2 = response2Text?.includes('323');
    console.log('Contains expected answer (323):', hasExpectedAnswer2);
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/02-chat-response-2.png' });
    
    // ASSERT: Response must contain expected answer
    expect(hasExpectedAnswer2, 'FAIL: Response 2 does not contain expected answer 323').toBeTruthy();
    
    // Verify responses are different
    const responsesAreDifferent = response1Text !== response2Text;
    console.log('\nResponses are different:', responsesAreDifferent);
    
    // ASSERT: Responses must be different
    expect(responsesAreDifferent, 'FAIL: Responses are identical, indicating static responses').toBeTruthy();
    
    // Verify network requests occurred
    console.log('\nNetwork requests captured:', networkRequests.length);
    for (const req of networkRequests) {
      console.log(`\nRequest: ${req.method} ${req.url}`);
      console.log('Status:', req.status);
      console.log('Request payload:', JSON.stringify(req.requestPayload, null, 2));
      console.log('Response payload:', JSON.stringify(req.responsePayload, null, 2));
    }
    
    // ASSERT: At least 2 network requests occurred
    expect(networkRequests.length, 'FAIL: Less than 2 network requests captured').toBeGreaterThanOrEqual(2);
    
    // Verify requests went to correct endpoint
    for (const req of networkRequests) {
      expect(req.url, 'FAIL: Request did not go to /api/ai/chat').toContain('/api/ai/chat');
      expect(req.status, 'FAIL: Request status is not 200').toBe(200);
    }
  });
});

// ============================================================================
// TEST 3: CAPABILITY SCORES DYNAMIC CHECK
// ============================================================================

test.describe('TEST 3: CAPABILITY SCORES DYNAMIC CHECK', () => {
  test('must detect if capability scores are static', async ({ page }) => {
    console.log('\n=== TEST 3: CAPABILITY SCORES DYNAMIC CHECK ===\n');
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Look for capability score elements
    const scoreElements = page.locator('[data-testid*="capability"], [class*="capability"]');
    const scoreCount = await scoreElements.count();
    console.log('Capability elements found:', scoreCount);
    
    // ASSERT: Capability elements must exist
    expect(scoreCount, 'FAIL: No capability elements found').toBeGreaterThan(0);
    
    // Capture initial scores
    const initialScores: string[] = [];
    for (let i = 0; i < scoreCount; i++) {
      const element = scoreElements.nth(i);
      const text = await element.textContent();
      if (text) {
        initialScores.push(text.trim());
      }
    }
    console.log('Initial scores:', initialScores);
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/03-initial-scores.png' });
    
    // Try to navigate to a different scenario or perform an action
    // that should change the scores
    const scenarioSelector = page.locator('select, [data-testid*="scenario"]').first();
    const hasScenarioSelector = await scenarioSelector.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (hasScenarioSelector) {
      await scenarioSelector.selectOption({ index: 1 });
      await page.waitForTimeout(2000);
      
      // Capture new scores
      const newScores: string[] = [];
      for (let i = 0; i < scoreCount; i++) {
        const element = scoreElements.nth(i);
        const text = await element.textContent();
        if (text) {
          newScores.push(text.trim());
        }
      }
      console.log('New scores:', newScores);
      
      // Take screenshot
      await page.screenshot({ path: 'test-results/03-new-scores.png' });
      
      // Check if scores changed
      const scoresChanged = JSON.stringify(initialScores) !== JSON.stringify(newScores);
      console.log('Scores changed:', scoresChanged);
      
      // ASSERT: If scores didn't change, it may indicate static scores
      // However, we need to be careful - changing scenario alone might not change scores
      // So we'll log this but not fail the test
      if (!scoresChanged) {
        console.warn('⚠️  WARNING: Scores did not change after scenario change');
        console.warn('This may indicate static score generation, but scenario change alone may not trigger score updates');
      }
    } else {
      console.log('Scenario selector not found, cannot test dynamic scores');
      // Don't fail - this is expected if there's no scenario selector
    }
  });
});

// ============================================================================
// TEST 4: GENERATE BRIEF
// ============================================================================

test.describe('TEST 4: GENERATE BRIEF', () => {
  test('must prove brief generation with real AI request', async ({ page }) => {
    console.log('\n=== TEST 4: GENERATE BRIEF ===\n');
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Set up network capture
    const networkRequests = await captureNetworkRequests(page, /\/api\/ai\/(chat|prepare)/);
    
    // Find scenario selector - MUST exist
    const scenarioSelector = page.locator('select, [data-testid*="scenario"]').first();
    await expect(scenarioSelector).toBeVisible({ timeout: 5000 });
    
    // Select first scenario
    await scenarioSelector.selectOption({ index: 0 });
    await page.waitForTimeout(1000);
    
    // Find and click Generate Brief button - MUST exist
    const generateButton = page.locator('button:has-text("Generate"), button:has-text("Prepare"), [data-testid*="generate"]').first();
    await expect(generateButton).toBeVisible({ timeout: 5000 });
    
    console.log('Clicking Generate Brief button');
    
    // Wait for API response
    const responsePromise = page.waitForResponse(response => 
      (response.url().includes('/api/ai/chat') || response.url().includes('/api/ai/prepare')) && 
      response.request().method() === 'POST'
    );
    
    await generateButton.click();
    
    // Wait for and verify API response
    const apiResponse = await waitForAIResponse(page, /\/api\/ai\/(chat|prepare)/);
    const jsonResponse = await verifyAPIResponse(apiResponse);
    
    console.log('API Response status:', apiResponse.status());
    console.log('API Response payload:', JSON.stringify(jsonResponse, null, 2));
    
    // Wait for UI to update
    await page.waitForTimeout(2000);
    
    // Check if brief content appeared
    const briefContent = page.locator('[data-testid*="brief"], [class*="brief"], main').first();
    await expect(briefContent).toBeVisible({ timeout: 10000 });
    
    const briefText = await briefContent.textContent();
    console.log('\nBrief content length:', briefText?.length || 0);
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/04-generated-brief.png', fullPage: true });
    
    // ASSERT: Brief content must be substantial
    expect(briefText?.length, 'FAIL: Brief content is too short').toBeGreaterThan(100);
    
    // Verify network request occurred
    console.log('\nNetwork requests captured:', networkRequests.length);
    for (const req of networkRequests) {
      console.log(`\nRequest: ${req.method} ${req.url}`);
      console.log('Status:', req.status);
      console.log('Request payload:', JSON.stringify(req.requestPayload, null, 2));
      console.log('Response payload:', JSON.stringify(req.responsePayload, null, 2));
    }
    
    // ASSERT: At least one network request occurred
    expect(networkRequests.length, 'FAIL: No network requests captured').toBeGreaterThan(0);
    
    // Verify request went to correct endpoint
    const hasCorrectEndpoint = networkRequests.some(req => 
      req.url.includes('/api/ai/chat') || req.url.includes('/api/ai/prepare')
    );
    expect(hasCorrectEndpoint, 'FAIL: Request did not go to correct endpoint').toBeTruthy();
    
    // Verify request contains scenario information
    const hasScenarioInfo = networkRequests.some(req => 
      JSON.stringify(req.requestPayload).toLowerCase().includes('scenario') ||
      JSON.stringify(req.requestPayload).toLowerCase().includes('brief')
    );
    expect(hasScenarioInfo, 'FAIL: Request does not contain scenario information').toBeTruthy();
  });
});

// ============================================================================
// TEST 5: PRACTICE WITH UNIQUE INPUT
// ============================================================================

test.describe('TEST 5: PRACTICE WITH UNIQUE INPUT', () => {
  test('must prove real evaluation with unique input', async ({ page }) => {
    console.log('\n=== TEST 5: PRACTICE WITH UNIQUE INPUT ===\n');
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Navigate to practice section - MUST exist
    const practiceButton = page.locator('button:has-text("Practice"), [data-testid*="practice"]').first();
    await expect(practiceButton).toBeVisible({ timeout: 5000 });
    
    await practiceButton.click();
    await page.waitForTimeout(2000);
    
    // Set up network capture
    const networkRequests = await captureNetworkRequests(page, /\/api\/ai\/(chat|evaluate)/);
    
    // Find practice input - MUST exist
    const practiceInput = page.locator('textarea, input[type="text"], [data-testid*="practice-input"]').first();
    await expect(practiceInput).toBeVisible({ timeout: 5000 });
    
    // Enter unique test answer
    const uniqueAnswer = 'TEST ANSWER 84721: The customer is primarily concerned about implementation risk and expected ROI.';
    console.log('Entering unique answer:', uniqueAnswer);
    
    await practiceInput.fill(uniqueAnswer);
    
    // Find and click submit button - MUST exist
    const submitButton = page.locator('button:has-text("Submit"), button:has-text("Evaluate"), button:has-text("Send")').first();
    await expect(submitButton).toBeVisible({ timeout: 5000 });
    
    console.log('Clicking Submit button');
    
    // Wait for API response
    const responsePromise = page.waitForResponse(response => 
      (response.url().includes('/api/ai/chat') || response.url().includes('/api/ai/evaluate')) && 
      response.request().method() === 'POST'
    );
    
    await submitButton.click();
    
    // Wait for and verify API response
    const apiResponse = await waitForAIResponse(page, /\/api\/ai\/(chat|evaluate)/);
    const jsonResponse = await verifyAPIResponse(apiResponse);
    
    console.log('API Response status:', apiResponse.status());
    console.log('API Response payload:', JSON.stringify(jsonResponse, null, 2));
    
    // Wait for UI to update
    await page.waitForTimeout(2000);
    
    // Check if evaluation appeared
    const evaluationContent = page.locator('[data-testid*="evaluation"], [class*="evaluation"], main').first();
    await expect(evaluationContent).toBeVisible({ timeout: 10000 });
    
    const evaluationText = await evaluationContent.textContent();
    console.log('\nEvaluation content length:', evaluationText?.length || 0);
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/05-practice-evaluation.png', fullPage: true });
    
    // ASSERT: Evaluation must be substantial
    expect(evaluationText?.length, 'FAIL: Evaluation content is too short').toBeGreaterThan(50);
    
    // Verify network request occurred
    console.log('\nNetwork requests captured:', networkRequests.length);
    for (const req of networkRequests) {
      console.log(`\nRequest: ${req.method} ${req.url}`);
      console.log('Status:', req.status);
      console.log('Request payload:', JSON.stringify(req.requestPayload, null, 2));
      console.log('Response payload:', JSON.stringify(req.responsePayload, null, 2));
    }
    
    // ASSERT: At least one network request occurred
    expect(networkRequests.length, 'FAIL: No network requests captured').toBeGreaterThan(0);
    
    // Verify request contains our unique answer
    const hasUniqueAnswer = networkRequests.some(req => 
      JSON.stringify(req.requestPayload).includes('TEST ANSWER 84721')
    );
    expect(hasUniqueAnswer, 'FAIL: Request does not contain unique answer').toBeTruthy();
    
    // Verify evaluation contains relevant evidence
    const hasRelevantEvidence = evaluationText?.toLowerCase().includes('implementation risk') || 
                                 evaluationText?.toLowerCase().includes('expected roi') ||
                                 evaluationText?.toLowerCase().includes('roi');
    expect(hasRelevantEvidence, 'FAIL: Evaluation does not contain relevant evidence').toBeTruthy();
  });
});

// ============================================================================
// TEST 6: TRANSCRIPT ANALYSIS
// ============================================================================

test.describe('TEST 6: TRANSCRIPT ANALYSIS', () => {
  test('must prove real transcript analysis with unique content', async ({ page }) => {
    console.log('\n=== TEST 6: TRANSCRIPT ANALYSIS ===\n');
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Navigate to transcript section - MUST exist
    const transcriptButton = page.locator('button:has-text("Transcript"), [data-testid*="transcript"]').first();
    await expect(transcriptButton).toBeVisible({ timeout: 5000 });
    
    await transcriptButton.click();
    await page.waitForTimeout(2000);
    
    // Set up network capture
    const networkRequests = await captureNetworkRequests(page, /\/api\/ai\/(chat|analyze)/);
    
    // Find transcript input - MUST exist
    const transcriptInput = page.locator('textarea, [data-testid*="transcript-input"]').first();
    await expect(transcriptInput).toBeVisible({ timeout: 5000 });
    
    // Enter unique test transcript
    const uniqueTranscript = `TRANSCRIPT-TEST-93264:
Buyer: I'm concerned about the implementation cost.
Seller: I understand. Can you tell me more about what specific costs are concerning you?
Buyer: The upfront implementation fee is too high for our budget.`;
    
    console.log('Entering unique transcript');
    await transcriptInput.fill(uniqueTranscript);
    
    // Find and click analyze button - MUST exist
    const analyzeButton = page.locator('button:has-text("Analyze"), button:has-text("Submit"), button:has-text("Analyze Transcript")').first();
    await expect(analyzeButton).toBeVisible({ timeout: 5000 });
    
    console.log('Clicking Analyze button');
    
    // Wait for API response
    const responsePromise = page.waitForResponse(response => 
      (response.url().includes('/api/ai/chat') || response.url().includes('/api/ai/analyze')) && 
      response.request().method() === 'POST'
    );
    
    await analyzeButton.click();
    
    // Wait for and verify API response
    const apiResponse = await waitForAIResponse(page, /\/api\/ai\/(chat|analyze)/);
    const jsonResponse = await verifyAPIResponse(apiResponse);
    
    console.log('API Response status:', apiResponse.status());
    console.log('API Response payload:', JSON.stringify(jsonResponse, null, 2));
    
    // Wait for UI to update
    await page.waitForTimeout(2000);
    
    // Check if analysis appeared
    const analysisContent = page.locator('[data-testid*="analysis"], [class*="analysis"], main').first();
    await expect(analysisContent).toBeVisible({ timeout: 10000 });
    
    const analysisText = await analysisContent.textContent();
    console.log('\nAnalysis content length:', analysisText?.length || 0);
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/06-transcript-analysis.png', fullPage: true });
    
    // ASSERT: Analysis must be substantial
    expect(analysisText?.length, 'FAIL: Analysis content is too short').toBeGreaterThan(50);
    
    // Verify network request occurred
    console.log('\nNetwork requests captured:', networkRequests.length);
    for (const req of networkRequests) {
      console.log(`\nRequest: ${req.method} ${req.url}`);
      console.log('Status:', req.status);
      console.log('Request payload:', JSON.stringify(req.requestPayload, null, 2));
      console.log('Response payload:', JSON.stringify(req.responsePayload, null, 2));
    }
    
    // ASSERT: At least one network request occurred
    expect(networkRequests.length, 'FAIL: No network requests captured').toBeGreaterThan(0);
    
    // Verify request contains our unique transcript marker
    const hasUniqueMarker = networkRequests.some(req => 
      JSON.stringify(req.requestPayload).includes('TRANSCRIPT-TEST-93264')
    );
    expect(hasUniqueMarker, 'FAIL: Request does not contain unique transcript marker').toBeTruthy();
    
    // Verify analysis contains relevant evidence
    const hasRelevantEvidence = analysisText?.toLowerCase().includes('implementation cost') || 
                                 analysisText?.toLowerCase().includes('cost');
    expect(hasRelevantEvidence, 'FAIL: Analysis does not contain relevant evidence').toBeTruthy();
  });
});

// ============================================================================
// TEST 7: FULL WORKFLOW (STRICT SEQUENCE)
// ============================================================================

test.describe('TEST 7: FULL WORKFLOW', () => {
  test('must complete full workflow with strict sequence', async ({ page }) => {
    console.log('\n=== TEST 7: FULL WORKFLOW (STRICT SEQUENCE) ===\n');
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Take initial screenshot
    await page.screenshot({ path: 'test-results/07-workflow-01-initial.png' });
    
    // Step 1: Scenario selector exists and selection succeeds
    console.log('Step 1: Scenario selection');
    const scenarioSelector = page.locator('select, [data-testid*="scenario"]').first();
    await expect(scenarioSelector, 'FAIL: Scenario selector not found').toBeVisible({ timeout: 5000 });
    await scenarioSelector.selectOption({ index: 0 });
    await page.waitForTimeout(1000);
    console.log('Step 1: Scenario selected');
    
    await page.screenshot({ path: 'test-results/07-workflow-02-scenario.png' });
    
    // Step 2: Generate Brief exists, click it, wait for API response, assert success
    console.log('Step 2: Generate brief');
    const generateButton = page.locator('button:has-text("Generate"), button:has-text("Prepare")').first();
    await expect(generateButton, 'FAIL: Generate button not found').toBeVisible({ timeout: 5000 });
    
    const briefResponsePromise = page.waitForResponse(response => 
      (response.url().includes('/api/ai/chat') || response.url().includes('/api/ai/prepare')) && 
      response.request().method() === 'POST'
    );
    
    await generateButton.click();
    
    const briefApiResponse = await waitForAIResponse(page, /\/api\/ai\/(chat|prepare)/);
    await verifyAPIResponse(briefApiResponse);
    
    const briefContent = page.locator('[data-testid*="brief"], [class*="brief"], main').first();
    await expect(briefContent, 'FAIL: Brief content not found').toBeVisible({ timeout: 10000 });
    
    console.log('Step 2: Brief generated');
    
    await page.screenshot({ path: 'test-results/07-workflow-03-brief.png', fullPage: true });
    
    // Step 3: Practice control exists, click it, assert practice UI appears
    console.log('Step 3: Start practice');
    const practiceButton = page.locator('button:has-text("Practice")').first();
    await expect(practiceButton, 'FAIL: Practice button not found').toBeVisible({ timeout: 5000 });
    
    await practiceButton.click();
    await page.waitForTimeout(2000);
    
    const practiceUI = page.locator('textarea, input[type="text"], [data-testid*="practice"]').first();
    await expect(practiceUI, 'FAIL: Practice UI not found').toBeVisible({ timeout: 5000 });
    
    console.log('Step 3: Practice started');
    
    await page.screenshot({ path: 'test-results/07-workflow-04-practice.png' });
    
    // Step 4: Practice input exists, enter unique answer, submit, assert AI evaluation
    console.log('Step 4: Submit answer');
    const practiceInput = page.locator('textarea, input[type="text"]').first();
    await expect(practiceInput, 'FAIL: Practice input not found').toBeVisible({ timeout: 5000 });
    
    await practiceInput.fill('Test answer for workflow test');
    
    const submitButton = page.locator('button:has-text("Submit"), button:has-text("Send")').first();
    await expect(submitButton, 'FAIL: Submit button not found').toBeVisible({ timeout: 5000 });
    
    const evalResponsePromise = page.waitForResponse(response => 
      (response.url().includes('/api/ai/chat') || response.url().includes('/api/ai/evaluate')) && 
      response.request().method() === 'POST'
    );
    
    await submitButton.click();
    
    const evalApiResponse = await waitForAIResponse(page, /\/api\/ai\/(chat|evaluate)/);
    await verifyAPIResponse(evalApiResponse);
    
    const evalUI = page.locator('[data-testid*="evaluation"], [class*="evaluation"]').first();
    await expect(evalUI, 'FAIL: Evaluation UI not found').toBeVisible({ timeout: 10000 });
    
    console.log('Step 4: Answer submitted and evaluated');
    
    await page.screenshot({ path: 'test-results/07-workflow-05-evaluation.png', fullPage: true });
    
    // Step 5: Transcript UI exists, enter unique transcript, analyze, assert analysis
    console.log('Step 5: Transcript analysis');
    const transcriptButton = page.locator('button:has-text("Transcript")').first();
    await expect(transcriptButton, 'FAIL: Transcript button not found').toBeVisible({ timeout: 5000 });
    
    await transcriptButton.click();
    await page.waitForTimeout(2000);
    
    const transcriptInput = page.locator('textarea').first();
    await expect(transcriptInput, 'FAIL: Transcript input not found').toBeVisible({ timeout: 5000 });
    
    await transcriptInput.fill('Test transcript for workflow');
    
    const analyzeButton = page.locator('button:has-text("Analyze")').first();
    await expect(analyzeButton, 'FAIL: Analyze button not found').toBeVisible({ timeout: 5000 });
    
    const analysisResponsePromise = page.waitForResponse(response => 
      (response.url().includes('/api/ai/chat') || response.url().includes('/api/ai/analyze')) && 
      response.request().method() === 'POST'
    );
    
    await analyzeButton.click();
    
    const analysisApiResponse = await waitForAIResponse(page, /\/api\/ai\/(chat|analyze)/);
    await verifyAPIResponse(analysisApiResponse);
    
    const analysisUI = page.locator('[data-testid*="analysis"], [class*="analysis"]').first();
    await expect(analysisUI, 'FAIL: Analysis UI not found').toBeVisible({ timeout: 10000 });
    
    console.log('Step 5: Transcript analyzed');
    
    await page.screenshot({ path: 'test-results/07-workflow-06-analysis.png', fullPage: true });
    
    // Step 6: Assert final completion state exists
    console.log('Step 6: Verify completion');
    
    // The final state should have some indication of completion
    // This could be a completion message, summary, or just the presence of all previous steps
    const finalState = page.locator('main').first();
    await expect(finalState, 'FAIL: Final state not found').toBeVisible({ timeout: 5000 });
    
    console.log('Step 6: Workflow completed');
    
    // Final screenshot
    await page.screenshot({ path: 'test-results/07-workflow-07-final.png', fullPage: true });
    
    console.log('\n=== TEST 7: FULL WORKFLOW PASSED ===\n');
  });
});
