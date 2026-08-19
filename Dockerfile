FROM node:18-alpine

WORKDIR /app

# Copy root and subfolder package manifests
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install dependencies
RUN npm run install:all

# Copy source code
COPY . .

# Build frontend
RUN npm --prefix frontend run build

EXPOSE 5000

ENV NODE_ENV=production
ENV PORT=5000

CMD ["node", "backend/server.js"]
