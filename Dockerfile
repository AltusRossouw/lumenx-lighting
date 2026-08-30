# ── LumenX Lighting — production image ─────────────────────────────────────
# Multi-stage: build the Vite SPA, then run Node + Express (serves the SPA and
# the API from a single process on :4000).

# ── Build stage ────────────────────────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app

# git is required to install the GitHub-hosted @orbitx/planner dependency.
RUN apk add --no-cache git

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Runtime stage ──────────────────────────────────────────────────────────
FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=4000

RUN apk add --no-cache git

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Built frontend + backend + schema + server-read public assets (datasheets).
COPY --from=build /app/dist ./dist
COPY server ./server
COPY db ./db
COPY public/datasheets ./public/datasheets
COPY public/downloads ./public/downloads

# Run as a non-root user.
RUN addgroup -S nodejs && adduser -S nodejs -G nodejs && \
    chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 4000

# Apply schema migrations (idempotent) then start the API.
CMD ["sh", "-c", "node server/scripts/migrate.js && node server/index.js"]
