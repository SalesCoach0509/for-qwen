FROM node:24-bookworm-slim
WORKDIR /app

# Build and run in the same directory; no cross-stage dist copy.
# .dockerignore excludes local dependencies, old builds, and secrets.
COPY . .
RUN npm run build:render \
    && node scripts/check-deployment.mjs runtime \
    && node -e "require('node:fs').rmSync('/app/node_modules', {recursive:true, force:true})"

ENV NODE_ENV=production
ENV PORT=10000
EXPOSE 10000
USER node
CMD ["node", "backend/server.js"]
