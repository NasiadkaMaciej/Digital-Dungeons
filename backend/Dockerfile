## ── Stage 1: install production dependencies ────────────────────────────────
FROM node:alpine AS deps
WORKDIR /app

COPY package*.json ./
# --omit=dev skips nodemon and other devDependencies
RUN npm ci --omit=dev

## ── Stage 2: runtime image ──────────────────────────────────────────────────
FROM node:alpine
WORKDIR /app

ENV NODE_ENV=production

# Copy only what's needed to run
COPY --from=deps /app/node_modules ./node_modules
COPY src ./src
COPY package.json ./

EXPOSE 3013

# Run as non-root for security
USER node

CMD ["node", "src/server.js"]
