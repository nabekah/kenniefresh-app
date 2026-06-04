FROM node:22-alpine AS base
WORKDIR /app
# Install pnpm - disable corepack strict mode to avoid signature issues
ENV COREPACK_ENABLE_STRICT=0
RUN npm install -g pnpm@10.4.1 --ignore-scripts

# Install dependencies
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
# Copy patches directory (required by pnpm patchedDependencies)
COPY patches ./patches
RUN pnpm install --frozen-lockfile

# Build the app
FROM deps AS builder
COPY . .
RUN pnpm build

# Production image
FROM node:22-alpine AS runner
WORKDIR /app
ENV COREPACK_ENABLE_STRICT=0
RUN npm install -g pnpm@10.4.1 --ignore-scripts

# Copy built files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/shared ./shared

# Create uploads directory
RUN mkdir -p /app/uploads

# Expose port
EXPOSE 3000

# Start server
CMD ["node", "dist/index.js"]
