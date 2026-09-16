# Live AI E2E Test Suite

This test suite verifies that the AI Performance Coach application is genuinely using live AI and not serving static/demo data in LIVE mode.

## Purpose

These tests are designed to detect:
- Static/demo data leaking into LIVE mode
- Static chat responses that don't change based on input
- Static capability scores that don't update
- Missing network requests to AI endpoints
- Workflow failures

## Prerequisites

1. The application must be deployed and accessible via a URL
2. The application must be in LIVE mode (not demo mode)
3. The Gemini API must be configured and working

## Installation

Playwright is already installed as a dependency. If you need to install browsers:

```bash
npx playwright install
```

## Running the Tests

### Basic Usage

Run the tests against your deployed application:

```bash
BASE_URL=https://your-app.up.railway.app npm run test:e2e
```

### With HTML Report

```bash
BASE_URL=https://your-app.up.railway.app npm run test:e2e -- --reporter=html
```

Then open the report:

```bash
npx playwright show-report
```

### Run Specific Test

```bash
BASE_URL=https://your-app.up.railway.app npm run test:e2e -- -g "TEST 1: LIVE MODE DETECTION"
```

### Run with Debug Mode

```bash
BASE_URL=https://your-app.up.railway.app PWDEBUG=1 npm run test:e2e
```

## Test Cases

### TEST 1: LIVE MODE DETECTION
Verifies that the application is operating in LIVE mode by checking for the "AI: Gemini" indicator in the UI.

**What it checks:**
- Presence of LIVE mode indicator
- Absence of Demo mode indicator

### TEST 2: STATIC CHAT DATA DETECTION
Tests whether chat responses are dynamic by sending two unique math questions and verifying different responses.

**What it checks:**
- Network requests to `/api/ai/chat`
- Response contains expected answer (391 for 17×23, 323 for 19×17)
- Responses are different from each other
- No static/demo responses

### TEST 3: CAPABILITY SCORES DYNAMIC CHECK
Verifies that capability scores change when the scenario changes.

**What it checks:**
- Capability scores are present
- Scores change when scenario changes
- No static score generation

### TEST 4: GENERATE BRIEF
Tests the brief generation workflow.

**What it checks:**
- Network request to `/api/ai/chat` or `/api/ai/prepare`
- Brief content is generated
- Response is not empty

### TEST 5: PRACTICE WITH UNIQUE INPUT
Tests the practice evaluation with a unique input.

**What it checks:**
- Network request contains the unique test input
- Evaluation is generated
- Response references the unique input

### TEST 6: TRANSCRIPT ANALYSIS
Tests transcript analysis with unique content.

**What it checks:**
- Network request contains the unique transcript marker
- Analysis is generated
- Response references the unique content

### TEST 7: FULL WORKFLOW
Tests the complete workflow from start to finish.

**What it checks:**
- Scenario selection
- Brief generation
- Practice submission
- Evaluation generation
- Transcript analysis
- Complete workflow completion

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `BASE_URL` | Yes | The URL of your deployed application |

## Test Output

### Console Output

Each test logs:
- Test name
- Network requests (URL, method, status, payloads)
- Response content
- Screenshots on failure

### Screenshots

Screenshots are saved to `test-results/` directory:
- `01-initial-state.png` - Initial application state
- `01-mode-detection.png` - Mode detection result
- `02-chat-response-1.png` - First chat response
- `02-chat-response-2.png` - Second chat response
- `03-initial-scores.png` - Initial capability scores
- `03-new-scores.png` - Scores after scenario change
- `04-generated-brief.png` - Generated brief
- `05-practice-evaluation.png` - Practice evaluation
- `06-transcript-analysis.png` - Transcript analysis
- `07-workflow-*.png` - Workflow screenshots

### HTML Report

Generate an HTML report:

```bash
BASE_URL=https://your-app.up.railway.app npm run test:e2e -- --reporter=html
npx playwright show-report
```

The HTML report includes:
- Test results with pass/fail status
- Screenshots
- Network request details
- Test timing

## Interpreting Results

### Passing Tests

All tests passing indicates:
- ✅ Application is in LIVE mode
- ✅ Chat responses are dynamic
- ✅ Capability scores are dynamic
- ✅ Brief generation works
- ✅ Practice evaluation works
- ✅ Transcript analysis works
- ✅ Full workflow completes

### Failing Tests

#### TEST 1 Fails
**Symptom:** Demo mode indicator found instead of LIVE mode
**Cause:** Application is running in demo mode
**Fix:** Ensure `VITE_USE_MOCK_AI=false` and API key is configured

#### TEST 2 Fails
**Symptom:** Responses don't contain expected answers or are identical
**Cause:** Static/demo responses or AI not working
**Fix:** Check API key, check network requests in test output

#### TEST 3 Fails
**Symptom:** Capability scores don't change
**Cause:** Static score generation
**Fix:** Check if scores are being updated from AI responses

#### TEST 4/5/6 Fail
**Symptom:** Network requests not captured or responses empty
**Cause:** API endpoints not working or wrong endpoints
**Fix:** Check network request URLs in test output

#### TEST 7 Fails
**Symptom:** Workflow stops at a specific step
**Fix:** Check which step failed and investigate that component

## Debugging Failed Tests

### View Network Requests

The test output includes all network requests. Look for:
- Request URL (should be `/api/ai/chat` or similar)
- Request method (should be POST)
- Request status (should be 200)
- Request payload (should contain your test input)
- Response payload (should contain AI response)

### View Screenshots

Screenshots are saved to `test-results/` directory. Open them to see:
- What the UI looked like at each step
- Whether content was rendered
- Whether errors were displayed

### Run in Debug Mode

```bash
BASE_URL=https://your-app.up.railway.app PWDEBUG=1 npm run test:e2e
```

This opens Playwright Inspector where you can:
- Step through tests
- Inspect elements
- View network requests
- Take manual screenshots

## Common Issues

### Issue: Tests timeout
**Cause:** AI responses taking too long
**Solution:** Increase timeout in `playwright.config.ts`:
```typescript
timeout: 180000, // 3 minutes
```

### Issue: Network requests not captured
**Cause:** Wrong URL pattern or requests not being made
**Solution:** Check the URL pattern in `captureNetworkRequests()`:
```typescript
const networkRequests = await captureNetworkRequests(page, /\/api\/ai\/chat/);
```

### Issue: Elements not found
**Cause:** Selectors don't match actual UI
**Solution:** Update selectors in tests to match your UI:
```typescript
const chatInput = await page.locator('input[type="text"]').first();
```

### Issue: Responses don't contain expected content
**Cause:** AI not working or returning different format
**Solution:** Check network response payload in test output

## Security

The tests redact sensitive information from logs:
- API keys
- Tokens
- Secrets
- Authorization headers

## CI/CD Integration

### GitHub Actions

```yaml
name: E2E Tests
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: BASE_URL=${{ secrets.BASE_URL }} npm run test:e2e
```

### GitLab CI

```yaml
e2e:
  stage: test
  script:
    - npm ci
    - npx playwright install --with-deps
    - BASE_URL=$BASE_URL npm run test:e2e
```

## Troubleshooting

### Playwright browsers not installed
```bash
npx playwright install
```

### Tests fail with timeout
Increase timeout in `playwright.config.ts`:
```typescript
timeout: 180000,
```

### Tests fail with element not found
Update selectors in tests to match your UI structure.

### Network requests not captured
Check the URL pattern in `captureNetworkRequests()` matches your API endpoints.

## Support

For issues with these tests:
1. Check the test output for detailed error messages
2. View screenshots in `test-results/` directory
3. Run in debug mode with `PWDEBUG=1`
4. Check network requests in test output

## Notes

- Tests are designed to be non-destructive
- Tests use unique identifiers to avoid conflicts
- Tests capture screenshots on failure
- Tests redact sensitive information from logs
- Tests are designed to work with the actual deployed application
