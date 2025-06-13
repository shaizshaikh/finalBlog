# 1. Base Image for Dependencies & Build
FROM node:20-alpine AS deps
WORKDIR /app

# Install dependencies based on package-lock.json
COPY package.json package-lock.json* ./
RUN npm ci

# 2. Builder Stage: Build the Next.js application
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Environment variables for build time (if any specific ones were needed for client-side NEXT_PUBLIC_ bundling)
# However, with RuntimeConfigContext, these are primarily runtime, not build-time critical for the Docker image itself.
ENV NODE_ENV=production
# ENV NEXT_PUBLIC_ADMIN_SECRET_URL_SEGMENT=${NEXT_PUBLIC_ADMIN_SECRET_URL_SEGMENT} # Example if needed at build time
# ENV NEXT_PUBLIC_BASE_URL=${NEXT_PUBLIC_BASE_URL} # Example if needed at build time

# Disable Next.js telemetry during build
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# 3. Runner Stage: Production image
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
# Disable Next.js telemetry in production runtime
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the standalone output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
# Copy public and static assets
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 9002

# All other environment variables (DB_URL, NEXTAUTH_SECRET, etc.)
# will be injected at runtime when starting the container.
# These are just placeholders to indicate they are expected.
ENV PORT=9002
# ENV POSTGRES_URL=
# ENV NEXTAUTH_URL=
# ENV NEXTAUTH_SECRET=
# ENV ADMIN_USERNAME=
# ENV ADMIN_PASSWORD=
# ENV ADMIN_SECRET_URL_SEGMENT=
# ENV BASE_URL=
# ENV GEMINI_API_KEY=
# ENV GMAIL_USER=
# ENV GMAIL_PASS=

CMD ["node", "server.js"]
