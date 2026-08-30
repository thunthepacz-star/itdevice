# Stage 1: Dependencies
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Stage 2: Prisma CLI runtime dependencies
FROM node:22-alpine AS prisma-cli
WORKDIR /prisma-cli
COPY --from=deps /app/node_modules/prisma/package.json ./prisma-package.json
RUN npm init -y >/dev/null 2>&1 && \
    PRISMA_VERSION="$(node -p "require('./prisma-package.json').version")" && \
    npm install --omit=dev --install-strategy=nested --no-package-lock "prisma@${PRISMA_VERSION}"

# Stage 3: Builder
FROM node:22-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV TZ=Asia/Bangkok

RUN npx prisma generate
RUN npm run build

# Stage 4: Runner
FROM node:22-alpine AS runner
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV TZ=Asia/Bangkok
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

RUN mkdir -p ./public/uploads/floor-plans && \
    chown -R nextjs:nodejs ./public

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=prisma-cli --chown=nextjs:nodejs /prisma-cli/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

USER nextjs

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
