FROM node:22-alpine AS base
RUN apk add --no-cache openssl

# --- Dependencies ---
FROM base AS deps
RUN apk add --no-cache python3 make g++
WORKDIR /app

# Copy root package files
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
COPY packages/db/package.json ./packages/db/

RUN npm ci

# --- Prisma generate ---
FROM deps AS prisma
WORKDIR /app

COPY packages/db/prisma ./packages/db/prisma
RUN npx -w packages/db prisma generate

# --- Production ---
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy node_modules with generated Prisma client
COPY --from=prisma /app/node_modules ./node_modules
COPY --from=prisma /app/packages/db/prisma ./packages/db/prisma

# Copy source
COPY packages/shared ./packages/shared
COPY packages/db ./packages/db
COPY apps/api ./apps/api
COPY package.json ./

# Remove local .env so Prisma uses container env vars
RUN rm -f packages/db/.env

# Entrypoint: migrate + seed + start
COPY apps/api/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 3001

CMD ["/docker-entrypoint.sh"]
