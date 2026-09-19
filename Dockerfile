# Production Dockerfile for Mobitez Frontend
FROM node:20-alpine AS runner

# Set working directory
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=3055

# Install dumb-init for clean PID 1 signal handling
RUN apk add --no-cache dumb-init

# Copy dependency manifests first to leverage Docker layer caching
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy application source code (guided by .dockerignore)
COPY . .

# Use unprivileged node user for security
RUN chown -R node:node /app
USER node

# Expose internal application port
EXPOSE 3055

# Healthcheck to verify container is serving
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3055/ || exit 1

# Start server using dumb-init
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "server.js"]
