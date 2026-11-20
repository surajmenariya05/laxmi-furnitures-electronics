# Production Dockerfile for WhatsApp Bot Microservice
FROM node:20-slim

# Install system dependencies (ca-certificates for secure HTTPS connections)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package manifests first for optimal Docker layer caching
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy application source code
COPY . .

# Default port
ENV PORT=3001
EXPOSE 3001

# Start microservice
CMD ["npm", "start"]
