# Stage 1: Build the application
FROM node:24-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy lockfile and workspace configurations
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json tsconfig.json ./

# Copy package.json files for all workspace packages (for dependency resolution)
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

# Build only the API server and its library dependencies
RUN pnpm --filter @workspace/db run build --if-present || true
RUN pnpm --filter @workspace/api-zod run build --if-present || true
RUN pnpm --filter @workspace/api-server run build

# Stage 2: Production runner
FROM node:24-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=10000

# Copy the bundled dist and all node_modules (esbuild bundles everything)
COPY --from=builder /app/artifacts/api-server/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# Expose port
EXPOSE 10000

# Run the API server
CMD ["node", "--enable-source-maps", "./dist/index.mjs"]
