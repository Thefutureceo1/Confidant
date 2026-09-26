# Multi-stage Docker build for offline, air-gapped deployment
# Stage 1: Build the static SPA assets
FROM node:20-alpine AS build-stage
WORKDIR /app

# Copy dependency configs and install offline/cached modules
COPY package*.json ./
RUN npm ci

# Copy full application code and run local compilation
COPY . .
RUN npm run build

# Stage 2: Serve the compiled assets using highly efficient, offline-optimized Nginx
FROM nginx:1.25-alpine AS production-stage

# Copy a customized Nginx config for SPA router compatibility
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled static assets from the build stage
COPY --from=build-stage /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
