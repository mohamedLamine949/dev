FROM node:20-alpine AS builder
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy root manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json* ./
COPY apps/api/package.json ./apps/api/

RUN pnpm install --frozen-lockfile

# Copy API source
COPY apps/api ./apps/api

# Generate Prisma client and build
WORKDIR /app/apps/api
RUN npx prisma generate
RUN pnpm run build

# ---- Production runner ----
FROM node:20-alpine
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/node_modules ./node_modules
COPY --from=builder /app/apps/api/package.json ./
COPY apps/api/prisma ./prisma

ENV NODE_ENV=production
EXPOSE 3001

CMD ["node", "dist/main"]
