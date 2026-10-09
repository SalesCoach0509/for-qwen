FROM node:24-bookworm-slim
WORKDIR /app

COPY . .
# Resolve the npm CLI shipped with the Node image and invoke the build directly.
# This does not require a build:render entry in package.json.
RUN npm_execpath="$(readlink -f "$(command -v npm)")" node scripts/build-render.mjs \
    && node scripts/check-deployment.mjs runtime \
    && node -e "require('node:fs').rmSync('/app/node_modules', {recursive:true, force:true})"

ENV NODE_ENV=production
ENV PORT=10000
EXPOSE 10000
USER node
CMD ["node", "backend/server.js"]
