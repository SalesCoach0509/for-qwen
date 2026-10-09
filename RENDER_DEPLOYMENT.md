# Render deployment

Release: `performance-render-audit-20261009`

## Apply this release as one complete update

Replace the application files in the connected Git repository with the contents of this package. Commit the complete update, including `Dockerfile`, `package.json`, `scripts/`, `backend/`, `src/`, `public/`, both lockfiles, and `.dockerignore`. Do not apply only the Dockerfile: it calls the new build script.

Use the existing Render web service with these settings:

| Setting | Value |
| --- | --- |
| Runtime | Docker |
| Root Directory | Empty when these files are at the repository root; otherwise the application subfolder |
| Dockerfile Path | `./Dockerfile` |
| Docker Build Context | `.` |
| Docker Command | Empty; uses `node backend/server.js` from the image |
| Health Check Path | `/api/ready` |

Paths are relative to the selected Root Directory. Never set it to `backend`, because this app also builds the frontend. Preserve existing provider configuration (`LLM_PROVIDER`, `LLM_MODEL`, `LLM_API_KEY`, and any custom `LLM_BASE_URL`). Provider keys belong only in Render environment settings. A separate frontend API URL is unnecessary for this combined service.

The included `render.yaml` is an optional Blueprint for creating/configuring a service. Adding it to a repository does not automatically reconfigure an existing manually created service.

Deploy the commit containing this complete release. The log must show:

```text
RENDER_BUILD_VERIFIED: performance-render-audit-20261009 -> /app/dist/index.html
```

The new Dockerfile has one stage and no `COPY --from=frontend-build /app/dist` instruction. If a deployment still reports that instruction failing, inspect the deployed commit and configured Dockerfile path: it is not executing this Dockerfile.

After deployment:

1. `/api/ready` must return `status: ok` and the release identifier above.
2. `/release.json` must contain the same identifier.
3. `/api/health` reports AI provider configuration separately. The web service can be ready with the provider marked degraded.
4. Sign in, check Demo Mode, then run Live Validation using your provider configuration.

## Build behavior

`npm run build:render` checks required sources, installs frontend build dependencies even when `NODE_ENV=production`, installs backend production dependencies, typechecks, builds explicitly into `dist`, and checks the generated HTML, JavaScript, CSS references, JSON contracts, and release marker. Production startup repeats the runtime checks and exits immediately if the app files are incomplete.

Both lockfiles are included. An absent lockfile triggers `npm install` with an explicit warning. A supplied but invalid/mismatched lockfile fails. Missing-lockfile builds can resolve newer dependency versions; committing the provided lockfiles preserves the tested dependency resolution.

The image uses Node 24 and Debian slim. Frontend build dependencies are removed after the verified build; backend dependencies remain in `backend/node_modules`. The server runs as the unprivileged `node` user, listens on `0.0.0.0`, and respects Render's `PORT` environment variable (default 10000).

## Local verification

Use Node 24 and npm:

```sh
npm run build:render
npm run check:spec
npm run test:api
npm run test:deployment
```

For a real container test on a Docker-enabled machine:

```sh
docker build --no-cache -t performance-coach .
docker run --rm -p 10000:10000 -e PORT=10000 performance-coach
```

`.github/workflows/container-check.yml` runs a real Linux Docker build, starts the image, and checks readiness and generated assets on GitHub Actions. It was added, but has not been executed here.

Official references: https://render.com/docs/docker and https://render.com/docs/monorepo-support
