# ── Stage 1: Build React ──────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Inject admin password at build time (override via --build-arg or ARG default)
ARG VITE_ADMIN_PASSWORD=admin123
ENV VITE_ADMIN_PASSWORD=$VITE_ADMIN_PASSWORD

RUN npm run build

# ── Stage 2: Production server ────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built React app and server
COPY --from=builder /app/dist ./dist
COPY server.js ./

# Create uploads directory
RUN mkdir -p dist/downloads

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

CMD ["node", "server.js"]
