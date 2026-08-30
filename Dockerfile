# ── LumenX Lighting — production image ─────────────────────────────────────
# Single dependency install (build stage), then reuse node_modules in the
# runtime stage. This avoids a second `npm ci` (and a second git clone of the
# GitHub-hosted @orbitx/planner dependency) during image build.

# ── Build stage ────────────────────────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app

# git + CA certs are required to install the GitHub-hosted @orbitx/planner dep.
RUN apk add --no-cache git ca-certificates

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

# Reuse the full dependency tree installed in the build stage.
COPY --from=build /app/node_modules ./node_modules
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
