## ── Stage 1: install all dependencies ──────────────────────────────────────
FROM node:alpine AS deps
WORKDIR /app

COPY package*.json ./
RUN npm ci

## ── Stage 2: build Next.js standalone bundle ────────────────────────────────
FROM node:alpine AS builder
WORKDIR /app

# NEXT_PUBLIC_* vars are inlined at build time – must be passed as build arg
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

## ── Stage 3: minimal runtime image ─────────────────────────────────────────
FROM node:alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
# Next.js standalone server listens on this port
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Static assets
COPY --from=builder /app/public ./public

# Standalone server entrypoint + bundled node_modules
COPY --from=builder /app/.next/standalone ./

# Compiled static chunks (JS, CSS) served by Next.js
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

# Run as non-root for security
USER node

CMD ["node", "server.js"]
