# Use official Node.js image
FROM node:20

# Set working directory inside container
WORKDIR /app

# Set environment variable
ENV PORT=5001

# Copy all files from frontend folder into container
COPY . .

# Install dependencies
RUN npm install

# Build Next.js app (important for production)
RUN npm run build

# Start the app
CMD ["npm", "start"]