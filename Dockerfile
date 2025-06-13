
# 1. Base Stage: Common setup for both deps and builder
FROM node:20-alpine AS base
WORKDIR /app

# Install pnpm globally (if you choose to use pnpm, otherwise skip if using npm)
# RUN npm install -g pnpm

# 2. Deps Stage: Install dependencies
FROM base AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat # For Next.js on Alpine
COPY package.json package-lock.json* ./ 
# If using pnpm: COPY package.json pnpm-lock.yaml* ./
# If using pnpm: RUN pnpm install --frozen-lockfile
RUN npm ci # Using npm ci as package.json scripts use npm

# 3. Builder Stage: Build the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set NODE_ENV to production before building
ENV NODE_ENV=production
# Environment variables needed for the build process, if any (e.g., NEXT_PUBLIC_...)
# These are illustrative. RuntimeConfigContext is preferred for runtime client-side vars.
ENV NEXT_PUBLIC_ADMIN_SECRET_URL_SEGMENT=${NEXT_PUBLIC_ADMIN_SECRET_URL_SEGMENT}
ENV NEXT_PUBLIC_BASE_URL=${NEXT_PUBLIC_BASE_URL}
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# 4. Runner Stage: Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
# ENV PORT, HOSTNAME are set by Cloud Run, App Hosting, etc.
# Do not set PORT here if your hosting provider injects it.
# ENV PORT=9002 
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

# Copy necessary files from the builder stage
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Next.js standalone output needs server.js
# If you have a server.js for a custom server, copy it.
# For standalone mode, .next/standalone/server.js is created.
# Ensure your next.config.js has `output: 'standalone'`
# The CMD will then be `node server.js` from within the standalone directory if that's your structure.
# For the current setup which might not be fully standalone for server.js yet:
CMD ["npm", "start"]
