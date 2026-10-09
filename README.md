# Complete Render source — single upload

Extract this ZIP and upload ALL its contents to the same application folder in the Render-connected repository. The archive is rooted directly at Dockerfile, package.json, src/, backend/, scripts/ and public/; there is no extra wrapper folder. Retain directory structure. Do not upload the ZIP itself. This contains fewer than 100 files so it can be committed together.

Includes the directly invoked build script, its preflight module, backend deployment checker, both lockfiles, contract data, full application source, tests and product docs. Generated dist and historical verification logs are omitted. Render builds dist from source.

Root Directory: the directory containing Dockerfile and package.json. Dockerfile Path: ./Dockerfile. Docker Build Context: . . Docker Command: blank. Health Check Path: /api/ready. Preserve the existing provider environment variables. See RENDER_DEPLOYMENT.md for detailed settings.

Docker build and Render execution have not been verified here because no Docker engine or Render connection is available.
