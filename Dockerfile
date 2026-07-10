FROM node:24-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy entire workspace
COPY . .

# Install all dependencies (pnpm virtual store stays intact — no cross-stage copy)
RUN pnpm install --frozen-lockfile

# Build only the API server
RUN pnpm --filter @workspace/api-server run build

# Runtime environment
ENV NODE_ENV=production
ENV PORT=10000

EXPOSE 10000

# Run from dist — node_modules are available in the same stage
CMD ["node", "--enable-source-maps", "./artifacts/api-server/dist/index.mjs"]
