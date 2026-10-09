# AI Performance Coach — Render package

Render deployment correction

Backend lockfiles are optional for Docker COPY. When backend/package-lock.json is supplied, npm ci --omit=dev uses it. When it is absent, npm install --omit=dev resolves dependencies from backend/package.json and generates a lockfile in the image. Invalid existing lockfiles still fail instead of being silently ignored.

Verified a fresh backend install with no lockfile, followed by four API/roleplay tests. Docker and Render deployment were not run locally. Installing without a lockfile can resolve newer dependency versions; retaining the supplied lockfile is preferable.

To apply to an existing Render repository, replace its Dockerfile with this file and deploy the new commit. For a complete replacement, upload all package contents. Root Directory must point to the directory containing Dockerfile; Dockerfile Path ./Dockerfile; Docker Build Context .; Docker Command blank. This package still requires root package-lock.json for the frontend and backend/contracts/ for contract data.

Product specifications are in docs/. IMPLEMENTATION_REPORT.txt describes the earlier full implementation verification. verification/render-missing-lockfile.json records the current missing-lockfile regression test.
