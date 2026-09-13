# Build stage for React frontend
FROM node:20-alpine AS frontend-build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy frontend source
COPY . .

# Build the React app
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy backend package files
COPY backend/package.json ./backend/

# Install backend dependencies (npm install generates package-lock.json)
RUN cd backend && npm install --only=production

# Copy all backend source files including ai-gateway (excluding node_modules via .dockerignore)
COPY backend/ ./backend/

# Copy the built frontend from the build stage
COPY --from=frontend-build /app/dist ./dist

# Expose port
EXPOSE 3001

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Start the backend server
CMD ["node", "backend/server.js"]
