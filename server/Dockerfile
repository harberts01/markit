# ──────────────────────────────────────────────────────────────────────────────
# MarkIt Server — Multi-stage Dockerfile
# Stage 1: Build TypeScript → JavaScript
# Stage 2: Minimal production runtime (no devDependencies, no tsc, no tsx)
# ──────────────────────────────────────────────────────────────────────────────

# ── Stage 1: builder ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install deps first for layer caching
COPY package.json package-lock.json ./
RUN npm ci --frozen-lockfile

# Copy source and compile
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# ── Stage 2: production ───────────────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Install production dependencies only
COPY package.json package-lock.json ./
RUN npm ci --frozen-lockfile --omit=dev && npm cache clean --force

# Copy compiled output from builder
COPY --from=builder /app/dist ./dist

# Copy migration files (needed at runtime for `npm run migrate`)
COPY migrations/ ./migrations/
COPY drizzle.config.ts ./

# Create uploads directory (replace with S3 in production)
RUN mkdir -p uploads && chown -R node:node /app

USER node

EXPOSE 3001

# Graceful startup: run migrations then start server
CMD ["node", "dist/index.js"]
