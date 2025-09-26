# syntax=docker/dockerfile:1

# Base image (Debian slim)
FROM node:20-slim AS base
WORKDIR /usr/src/app
ENV NODE_ENV=production \
    CI=true

# Dependencies layer (cache-friendly)
FROM base AS deps
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

# Build layer (for TS/Build steps; safe if none)
FROM deps AS build
COPY . .
RUN npm run build --if-present

# Runtime image (small, non-root)
FROM node:20-slim AS runtime
ENV NODE_ENV=production
WORKDIR /usr/src/app

# Install only production deps
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev

# Copy application (including any build artifacts)
COPY --from=build /usr/src/app ./

# Run as non-root user provided by the Node image
USER node

# Default port (override with -e PORT=xxxx)
EXPOSE 3000

# Start the app (expects an npm start script)
CMD ["npm", "start"]


