# IEEE SWEBOK v4 Chapter 06: DevSecOps Multi-Stage Secure Container
# Stage 1: Build & Verify
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run test
RUN npm run build
RUN node scripts/generate-sbom.js

# Stage 2: Minimal Attack Surface Production Image
FROM node:22-alpine AS runner

WORKDIR /app

# Run as unprivileged non-root user (Defense in Depth)
USER node

COPY --chown=node:node package*.json ./
RUN npm ci --omit=dev

COPY --chown=node:node --from=builder /app/dist ./dist
COPY --chown=node:node --from=builder /app/sbom.cyclonedx.json ./sbom.cyclonedx.json
COPY --chown=node:node --from=builder /app/.env.example ./.env

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

CMD ["node", "dist/server/server.js"]
