FROM node:20-alpine

WORKDIR /app

# Install dependencies first (layer cache)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source
COPY . .

# Create logs directory
RUN mkdir -p logs uploads

EXPOSE 8000

CMD ["node", "index.js"]
