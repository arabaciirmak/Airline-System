FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# Expose ports (will be overridden by docker-compose)
EXPOSE 3001 3002 3003 3004 3005 5000

# Default command (can be overridden)
CMD ["node", "services/api-gateway/index.js"]
