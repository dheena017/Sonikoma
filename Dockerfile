# ==============================================================================
# Sonikoma MonOREPO DOCKERFILE
# Multi-stage production build for React + TypeScript frontend & FastAPI backend
# ==============================================================================

# ── Stage 1: Build Frontend ───────────────────────────────────────────────────
FROM node:22-slim AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci || npm install

COPY frontend/ ./
RUN npm run build

# ── Stage 2: Production Backend & Combined Service ───────────────────────────
FROM python:3.11-slim AS production
WORKDIR /app

# Prevent Python bytecode files and enable unbuffered output logging
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install OS-level C dependencies for OpenCV, EasyOCR, FFmpeg, and ImageMagick
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libgl1 \
    libglib2.0-0 \
    imagemagick \
    curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install PyTorch CPU first to optimize image size and build speed
RUN pip install --no-cache-dir torch torchvision torchaudio --extra-index-url https://download.pytorch.org/whl/cpu

# Copy & install Python requirements
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r ./backend/requirements.txt

# Copy backend source code & scripts
COPY backend/ ./backend/
COPY scripts/ ./scripts/

# Copy built frontend assets from Stage 1 into frontend/dist
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Set production environment variables
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=10000

# Limit PyTorch / OpenBLAS thread allocations to keep memory under 512MB
ENV OMP_NUM_THREADS=1
ENV MKL_NUM_THREADS=1
ENV OPENBLAS_NUM_THREADS=1
ENV VECLIB_MAXIMUM_THREADS=1
ENV NUMEXPR_NUM_THREADS=1

EXPOSE 10000

# Launch FastAPI computational engine directly with uvicorn bound to 0.0.0.0:$PORT
WORKDIR /app/backend/app
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-10000}"]
