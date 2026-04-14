FROM node:18-alpine

WORKDIR /app

# Copy only package files first
COPY package*.json ./

# Install only production deps
RUN npm ci --only=production

# Copy rest of code
COPY . .

# Set environment
ENV NODE_ENV=production

# Expose port (adjust if needed)
EXPOSE 8000

# Start app
CMD ["npm", "start"]