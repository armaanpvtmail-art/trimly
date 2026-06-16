# Multi-stage Dockerfile for Trimly (Next.js production)

# 1. Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci --silent

# Copy source
COPY . .

# Generate Prisma client and build
RUN npx prisma generate && npm run build

# 2. Runner image
FROM node:20-alpine AS runner

ENV NODE_ENV=production

WORKDIR /app

# Copy built app and node_modules
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# Expose port
EXPOSE 3000

# Start the app
CMD ["node", "server.js"]
