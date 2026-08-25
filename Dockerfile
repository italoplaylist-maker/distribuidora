# syntax=docker/dockerfile:1

FROM node:20-alpine AS builder
WORKDIR /app
# Prisma's query engine needs libssl on Alpine (musl).
RUN apk add --no-cache openssl

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Only needed in case any server code touches Prisma at build/prerender
# time; every page that reads the database is forced dynamic, so this is
# a safety net rather than a hard requirement.
ARG DATABASE_URL
ARG NEXTAUTH_SECRET
ARG NEXTAUTH_URL
ENV DATABASE_URL=${DATABASE_URL} \
    NEXTAUTH_SECRET=${NEXTAUTH_SECRET} \
    NEXTAUTH_URL=${NEXTAUTH_URL} \
    NEXT_TELEMETRY_DISABLED=1

RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache openssl
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./next.config.ts

EXPOSE 3000

# Applies pending migrations before serving — safe to run on every boot,
# it's a no-op once the schema is already up to date.
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]
