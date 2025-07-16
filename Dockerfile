# Multi-stage build for React + nginx
FROM node:24-slim AS builder

WORKDIR /app

# Accept build arguments
ARG VITE_BASE_URL
ARG VITE_BACKEND_URL
ARG VITE_API_BASE_PATH
ARG VITE_UI_BASE_PATH

# Set environment variables for build
ENV VITE_BASE_URL=$VITE_BASE_URL
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL
ENV VITE_API_BASE_PATH=$VITE_API_BASE_PATH
ENV VITE_UI_BASE_PATH=$VITE_UI_BASE_PATH

# Copy package files
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN yarn build

# Production stage with nginx
FROM nginx:alpine

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]