# Stage 1: Build the Angular application
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./

# Install dependencies
# Note: Using --legacy-peer-deps in case of version mismatches (Angular 21?)
RUN npm install --legacy-peer-deps

COPY . .

# Build the application
# Adjust output path if needed. Default is dist/project-name/browser for newer Angular
RUN npm run build -- --configuration production

# Stage 2: Serve using Nginx
FROM nginx:alpine

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built artifacts from the build stage
# We'll need to verify the exact output path. Assuming 'tazkarty-frontend' is the project name.
COPY --from=build /app/dist/tazkarty-frontend/browser /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
