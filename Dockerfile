FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL deps (including dev for build)
RUN npm install --include=dev

# Copy source
COPY . .

# Build TypeScript
RUN npx tsc

# Remove dev dependencies to keep image small
RUN npm prune --omit=dev

EXPOSE 3000

CMD ["node", "dist/server.js"]
