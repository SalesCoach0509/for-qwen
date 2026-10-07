# AI Performance Coach — merged project

This release combines the supplied `for-qwen-main.zip` with the performance-moment implementation. Release identifier: `performance-v1-merged-20261005`.

## What was reconciled

| Area | Result |
| --- | --- |
| Scenario planner | Restored its domain types, generator, route and saved interaction field. Reach it from Performance Plan → Customize practice scenario. |
| Deal context | Retained discovery, negotiation and renewal/expansion options, difficulty, buyer context, commercial constraints and scenario criteria. Selecting a skill preserves entered facts. |
| Customer facts | New real scenarios begin without synthetic facts. Demo cases load explicitly and show a synthetic-data label. Supplied known facts and commercial limits take precedence over generated claims. |
| Performance journey | Retained the next-moment dashboard, shared interaction context, uppercase lifecycle, next action, plan, practice, transcript and analysis links. |
| Existing browser data | Lowercase interaction statuses migrate; existing saved scenarios retain their data and acquire their interaction ID. |
| Practice | Uses the custom scenario and latest intervention. Sends employee messages once; preserves assistant roles. Employees end practice explicitly. Weak or unsupported evaluations do not mark a moment READY. |
| Evidence | Retained exact transcript/turn quotation checks, unsupported-score rejection, qualitative readiness and evidence-based capability memory. |
| Providers | Retained the supplied provider adapters, configuration, timeout/retry and fallback handling, diagnostics and live-only error behavior. API credentials remain on the backend. |
| Deployment | Kept the Railway Docker build, which compiles frontend source and serves the result through Express. Added `/release.json` and a release field in `/api/health`. |

The earlier Railway failure was caused by an inconsistent source set: `ScenarioPlanner.tsx` was present while its imported function and types were absent. This package contains the complete, reconciled source. No TypeScript errors are suppressed or files excluded to conceal the failure.

## Deploy to the existing Railway service

1. Extract this package into a fresh folder. Its root contains `Dockerfile`, `package.json`, `src/` and `backend/`.
2. Update the source used by your existing Railway service with this complete project. Review the repository diff and commit it to the branch Railway deploys. Keep your existing Railway provider environment variables.
3. Deploy that updated source. Rebuilding the previously failed source without updating it will reproduce the original error.
4. After deployment succeeds, open `/release.json` on your Railway domain. It should show `performance-v1-merged-20261005`. Then reload the app; the dashboard should say “Your next performance moment”. The sign-in screen is intentionally similar.

This archive is a local deliverable; creating it does not update Railway automatically. Avoid uploading individual source files over a different revision.

## Run and verify locally

Requires Node.js 20 and npm.

```sh
npm ci
cd backend
npm install
cd ..
npm run build
```

Configure the backend using `.env.example` (for a local `cd backend && npm start`, place `.env` in `backend/`). Start the backend in one terminal and `npm run dev` in another. The frontend uses port 3001 for its local backend by default. Production uses the same origin. A missing or unavailable provider produces a visible failure; coaching does not silently switch to mock output.

Regression checks against the built frontend:

```sh
npm run preview -- --host 127.0.0.1 --port 3000 --strictPort
# In another terminal:
npx playwright install chromium
npm run test:e2e
node --test tests/backend-smoke.test.mjs
```

Alternatively set `PLAYWRIGHT_CHROME_PATH` to a locally installed Chrome executable. The ten browser tests use controlled provider responses and cover the full journey, preparation failure, transcript grounding, zero-evidence scoring, practice grounding, scenario integration/failure, degraded health, legacy migration and weak-practice readiness. The backend integration test starts Express and a local provider stub, verifying production assets, release identity, role mapping, context, message deduplication and failure handling.

The historical live tests from the supplied project are retained under `tests/legacy/`; their assertions refer to the earlier UI. They are not part of the current regression suite. Historical certification reports are omitted from this release package because they do not describe this merged source.

## Limits

Real external-model quality and account configuration still need verification with your Railway credentials. Data remains in browser local storage; the name/email screen is not production authentication or a shared user database. Vite reports a nonfatal bundle-size warning. Passing these checks does not establish that software is entirely free of bugs.
