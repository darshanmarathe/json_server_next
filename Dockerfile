# syntax=docker/dockerfile:1

FROM node:20-slim AS deps
WORKDIR /usr/src/app
ENV NODE_ENV=production \
    CI=true

COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev && npm cache clean --force

FROM node:20-slim AS runtime
WORKDIR /usr/src/app
ENV NODE_ENV=production \
    PORT=4000

COPY --from=deps --chown=node:node /usr/src/app/node_modules ./node_modules
COPY --chown=node:node package*.json ./
COPY --chown=node:node . .

# Ensure writable folders for filesys/sqlite providers when running as non-root.
RUN mkdir -p /usr/src/app/data /usr/src/app/admin_data \
    && chown -R node:node /usr/src/app/data /usr/src/app/admin_data

USER node
EXPOSE 4000

VOLUME ["/usr/src/app/data", "/usr/src/app/admin_data"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch(`http://127.0.0.1:${process.env.PORT || 4000}/rest/`).then((r)=>process.exit(r.ok ? 0 : 1)).catch(()=>process.exit(1))"

CMD ["node", "app.js"]


