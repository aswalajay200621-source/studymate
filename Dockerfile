# Stage 1: Build the application
FROM node:24-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy lockfile and workspace configurations
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json tsconfig.json .npmrc ./

# Copy package.json files for all workspace packages (needed for pnpm workspace resolution)
COPY artifacts/api-server/package.json ./artifacts/api-server/
COPY artifacts/mobile/package.json ./artifacts/mobile/
COPY artifacts/mockup-sandbox/package.json ./artifacts/mockup-sandbox/
COPY lib/db/package.json ./lib/db/
COPY lib/api-zod/package.json ./lib/api-zod/
COPY lib/api-client-react/package.json ./lib/api-client-react/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Copy source code for api-server and shared libs only
COPY lib/ ./lib/
COPY artifacts/api-server/ ./artifacts/api-server/

# Build only the API server (skips mobile/mockup builds)
RUN pnpm --filter @workspace/api-server run build

# Stage 2: Production runner
FROM node:24-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=10000

# Copy the bundled dist output
COPY --from=builder /app/artifacts/api-server/dist ./dist

# Copy node_modules for external packages (pdf-parse, multer, etc.)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/artifacts/api-server/node_modules ./artifacts/api-server/node_modules

# Expose port
EXPOSE 10000

# Run the API server
CMD ["node", "--enable-source-maps", "./dist/index.mjs"]
