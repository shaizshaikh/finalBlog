
# 1. Dependencies Stage: Install dependencies
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json* ./
RUN npm ci

# 2. Builder Stage: Build the Next.js application
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set NEXT_PUBLIC_ variables as build arguments if you want to bake them in.
# However, for runtime flexibility of ADMIN_SECRET_URL_SEGMENT and BASE_URL,
# we rely on RuntimeConfigContext which reads from server's runtime process.env.
# So, these ARGs are not strictly necessary here for those two variables if passed at runtime.
# ARG NEXT_PUBLIC_ADMIN_SECRET_URL_SEGMENT
# ARG NEXT_PUBLIC_BASE_URL

# ENV NEXT_PUBLIC_ADMIN_SECRET_URL_SEGMENT=${NEXT_PUBLIC_ADMIN_SECRET_URL_SEGMENT}
# ENV NEXT_PUBLIC_BASE_URL=${NEXT_PUBLIC_BASE_URL}
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# 3. Runner Stage: Production image
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# ENV NEXT_PUBLIC_ADMIN_SECRET_URL_SEGMENT (value will be injected at runtime)
# ENV NEXT_PUBLIC_BASE_URL (value will be injected at runtime)
# Other runtime environment variables (POSTGRES_URL, NEXTAUTH_SECRET, etc.) will also be injected here.

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# public folder is not typically needed for standalone output unless you serve files directly from it outside of Next.js routing.
# If you have files in `public` that need to be served, uncomment the next line.
# COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 9002

# All environment variables are expected to be set when the container runs
# For example:
# - POSTGRES_URL
# - NEXTAUTH_URL (must be the public URL of your app)
# - NEXTAUTH_SECRET
# - ADMIN_USERNAME
# - ADMIN_PASSWORD
# - ADMIN_SECRET_URL_SEGMENT
# - BASE_URL
# - GEMINI_API_KEY
# - GMAIL_USER
# - GMAIL_PASS

CMD ["node", "server.js"]
