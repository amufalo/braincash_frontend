# Stage 1: Build the frontend
FROM node:20 AS build
WORKDIR /app
COPY package.json package-lock.json bun.lockb ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve the app with a minimal image
FROM node:20-slim AS runtime
WORKDIR /app
RUN npm install -g serve
COPY --from=build /app/dist ./dist
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh
EXPOSE 8080
ENTRYPOINT ["/app/docker-entrypoint.sh"]
