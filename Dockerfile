# Use Node 20.19+ (meets Vite's requirement without relying on bleeding-edge Node 22)
FROM node:20.19-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Clean install (optional deps included to be safe for any native optional packages)
RUN npm cache clean --force && \
    npm ci --prefer-offline --no-audit --include=optional

# Copy application files
COPY . .

# Ensure the built asset URLs are correct for root deployments (Railway).
# GitHub Pages uses a subpath and is handled separately by CI.
ENV VITE_BASE_PATH=/

# Build the application
RUN npm run build

# Install serve globally for runtime
RUN npm install -g serve@14.2.1

# Expose port (Railway injects $PORT)
EXPOSE 3000

# Start the application
CMD ["sh", "-c", "serve -s dist -l ${PORT:-3000}"]
