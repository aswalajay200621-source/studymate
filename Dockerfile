# Stage 1: Build the application
FROM node:24-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy lockfile and workspace configurations
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY artifacts/api-server/package.json ./artifacts/api-server/
COPY lib/db/package.json ./lib/db/

# Copy other package.json files in workspace to cache dependencies
COPY artifacts/mobile/package.json ./artifacts/mobile/
COPY artifacts/mockup-sandbox/package.json ./artifacts/mockup-sandbox/

# Install dependencies (only what's needed for build/running)
RUN pnpm install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Build the API server and workspace libraries
RUN pnpm run build

# Stage 2: Production runner
FROM node:24-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=5000

# Copy the bundled server and pino dependencies
COPY --from=builder /app/artifacts/api-server/dist ./dist
COPY --from=builder /app/artifacts/api-server/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

# Expose port
EXPOSE 5000

# Run the API server
CMD ["node", "--enable-source-maps", "./dist/index.mjs"]
