# Use the official Node.js 18 Alpine image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json 
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Create a non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodeuser -u 1001

# Copy the rest of the application code
COPY . .

# Create public directory and copy static files
RUN mkdir -p public

# Change ownership of the app directory to the nodejs user
RUN chown -R nodeuser:nodejs /app

# Switch to non-root user
USER nodeuser

# Expose the port the app runs on
EXPOSE 8080

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').request('http://localhost:8080/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1)).end()"

# Start the application
CMD ["npm", "start"]