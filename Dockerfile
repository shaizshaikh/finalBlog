# 1. Base Stage: Official Node.js image as a build environment
FROM node:20-alpine AS base
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# 2. Builder Stage: Build the Next.js application
FROM base AS builder
WORKDIR /app

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile
COPY . .

# ARG NEXT_PUBLIC_ADMIN_SECRET_URL_SEGMENT # Not needed for runtime config via context
# ARG NEXT_PUBLIC_BASE_URL # Not needed for runtime config via context
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# ENV NEXT_PUBLIC_ADMIN_SECRET_URL_SEGMENT=$NEXT_PUBLIC_ADMIN_SECRET_URL_SEGMENT # Not needed
# ENV NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL # Not needed

RUN pnpm run build

# 3. Runner Stage: Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# ENV PORT=9002 # PORT is usually set by the hosting environment like Cloud Run

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 9002
CMD ["node", "server.js"]
