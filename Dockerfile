# Stage 1: Build Frontend
FROM node:20 AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
# Copy the entire project to build the frontend correctly
COPY . .
RUN npm run build:frontend

# Stage 2: Build Backend and Final Image
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies for OpenCV, EasyOCR, and MoviePy
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY backend/ ./backend/
COPY scripts/ ./scripts/

# Copy built frontend from Stage 1
COPY --from=frontend-builder /app/frontend/dist ./dist

# Set environment variables for production
ENV NODE_ENV=production
ENV HOST=0.0.0.0
# We do not hardcode ENV PORT or EXPOSE here so Railway can dynamically assign and route the PORT.

# Start the unified FastAPI application
WORKDIR /app/backend/python
CMD ["python", "main.py"]
