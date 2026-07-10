# Stage 1: Build the application
FROM node:24-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm

# Copy workspace config files
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json tsconfig.json .npmrc ./

# Copy all package.json files (needed for pnpm workspace resolution)
COPY artifacts/api-server/package.json ./artifacts/api-server/
COPY artifacts/mobile/package.json ./artifacts/mobile/
COPY artifacts/mockup-sandbox/package.json ./artifacts/mockup-sandbox/
COPY lib/db/package.json ./lib/db/
COPY lib/api-zod/package.json ./lib/api-zod/
COPY lib/api-client-react/package.json ./lib/api-client-react/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY lib/ ./lib/
COPY artifacts/api-server/ ./artifacts/api-server/

# Build only the API server
RUN pnpm --filter @workspace/api-server run build

# Stage 2: Production runner — install deps fresh to avoid pnpm symlink issues
FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=10000

RUN npm install -g pnpm

# Copy workspace config to allow fresh prod install
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./
COPY artifacts/api-server/package.json ./artifacts/api-server/
COPY artifacts/mobile/package.json ./artifacts/mobile/
COPY artifacts/mockup-sandbox/package.json ./artifacts/mockup-sandbox/
COPY lib/db/package.json ./lib/db/
COPY lib/api-zod/package.json ./lib/api-zod/
COPY lib/api-client-react/package.json ./lib/api-client-react/

# Install only production dependencies (no devDeps, no build tools)
RUN pnpm install --frozen-lockfile --prod

# Copy the built dist from builder
COPY --from=builder /app/artifacts/api-server/dist ./dist

EXPOSE 10000

CMD ["node", "--enable-source-maps", "./dist/index.mjs"]
