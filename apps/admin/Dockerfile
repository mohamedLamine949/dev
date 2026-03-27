FROM node:20-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json* ./
COPY apps/admin/package.json ./apps/admin/
COPY packages ./packages

RUN pnpm install --frozen-lockfile

COPY apps/admin ./apps/admin

WORKDIR /app/apps/admin
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN pnpm run build

# ---- Production runner ----
FROM node:20-alpine
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY --from=builder /app/apps/admin/.next ./.next
COPY --from=builder /app/apps/admin/public ./public
COPY --from=builder /app/apps/admin/package.json ./
COPY --from=builder /app/apps/admin/next.config* ./
COPY --from=builder /app/apps/admin/node_modules ./node_modules

ENV NODE_ENV=production
EXPOSE 3002

CMD ["pnpm", "start"]
