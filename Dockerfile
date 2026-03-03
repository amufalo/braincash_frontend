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
EXPOSE 8080
CMD ["serve", "-s", "dist", "-l", "8080"]
