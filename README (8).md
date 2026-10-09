# AI Performance Coach — Consolidated V1

Release: performance-v1-consolidated-20261007. Final verification: 9 October 2026. Base: the supplied for-qwen-main.zip, merged with the performance-moment implementation.

## Run locally

Use Node 20 or later and npm.

1. Run npm ci in this folder.
2. Run npm ci --omit=dev in backend/.
3. Configure backend/.env from .env.example with your existing LLM_PROVIDER, LLM_MODEL and LLM_API_KEY. Never put secrets in VITE_* variables.
4. Start the backend with npm start from backend/.
5. Start the frontend with npm run dev from this folder; open http://127.0.0.1:3000.

Live is the default and requires a working provider. Explicit Demo Mode runs synthetic fixtures in separate local storage and works without provider credentials. Local profiles are browser partitions, not secure authentication or team tenancy.

## Verify

Run npm run typecheck, npm run build, npm run check:spec and npm run test:api. Browser regression uses a local Vite development server because some integrity tests exercise source modules directly. Start npm run dev on port 3000, then run npm run test:e2e -- --workers=1. Install Chromium with npx playwright install chromium, or set PLAYWRIGHT_CHROME_PATH to your Chrome executable. Automated browser tests use an explicit test gateway; they do not certify external model quality. Use Home → MVP Validation in Live Mode for real-provider checks.

## Deploy on Railway

Extract the ZIP. The populated AI_Performance_Coach_Consolidated_V1 folder contains Dockerfile, package.json, src/, backend/, backend/contracts/ and docs/. Commit this complete folder's contents to the repository/branch deployed by the existing Railway service. Keep the service's provider environment configuration. The Dockerfile installs locked dependencies, builds the frontend and serves it with Express.

After deployment, verify /release.json and /api/health both report performance-v1-consolidated-20261007. Then run Live Validation and the prepare → practice → real transcript → next adapted plan journey. Building or downloading this archive does not update the deployed site. No Railway deployment was performed during this task.

## Contents and limits

The nine source-of-truth documents are under docs/. backend/contracts/product-spec.json drives taxonomy, scenario profiles, personas and rubrics; backend/contracts/operation-contracts.json defines semantic envelopes. scripts/check-spec.mjs checks document alignment. RELEASE_MANIFEST.json contains checksums; IMPLEMENTATION_REPORT.txt records tests and remaining deployment checks.

This remains the local-state MVP: no server persistence, secure multi-user authentication or enterprise access controls. Exact quote checks and judges reduce unsupported claims but do not establish universal model correctness. Real-provider calibration and deployment-specific access controls require live validation.

## Deployment correction

See DEPLOYMENT_FIX.txt. This corrected folder is AI_Performance_Coach_Deployment_Fix. Contract data is under backend/contracts/.
