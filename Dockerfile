# Stage 1: Build Frontend
FROM node:22-slim AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm install
# Copy the entire project to build the frontend correctly
COPY . .
RUN npm run build:frontend

# Stage 2: Serve Frontend
FROM node:22-slim
WORKDIR /app
COPY --from=frontend-builder /app/frontend/dist ./dist
RUN npm install -g serve
EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]