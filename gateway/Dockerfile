# BeyondFlow Voice AI & Supervisor Gateway Container
# Compatible with Render, Railway, Fly.io, and Google Cloud Run

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8790
ENV GATEWAY_PORT=8790

# Copy root package files
COPY package*.json ./

# Install production dependencies
RUN npm ci --omit=dev

# Copy gateway, playground, and lib dependencies
COPY gateway/ ./gateway/
COPY playground/ ./playground/
COPY lib/ ./lib/

# Expose dynamic PORT (Render, Railway, Fly pass $PORT)
EXPOSE 8790

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:${PORT:-8790}/health || exit 1

# Start script respecting PORT env var
CMD ["sh", "-c", "GATEWAY_PORT=${PORT:-8790} node gateway/server.mjs"]
