"""
backend/app/core/settings.py
─────────────────────────────────────────────────────────────────────────────
Centralized configuration validation hub (ports, URLs, keys, limits, and more).
─────────────────────────────────────────────────────────────────────────────
"""

import os
import logging
from dotenv import load_dotenv

logger = logging.getLogger("sonikoma.core.settings")

# Ensure environment variables are loaded robustly if imported in isolation or test files
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
dotenv_path = os.path.join(PROJECT_ROOT, ".env")
if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path=dotenv_path)
else:
    load_dotenv()

# 1. FRONTEND_PORT (default to 3000 if missing)
FRONTEND_PORT = int(os.getenv("FRONTEND_PORT", "3000"))

# 2. BACKEND_PORT / PORT (Prioritize dynamic PORT provided by Render, fallback to BACKEND_PORT or 5173)
BACKEND_PORT = int(os.getenv("PORT") or os.getenv("BACKEND_PORT") or "5173")

# 3. HOST (Must be 0.0.0.0 in Docker/Render environments)
HOST = os.getenv("HOST", "0.0.0.0")

# 3. APP_URL
APP_URL = os.getenv("APP_URL") or "http://localhost:3000"

# 4. JWT_SECRET_KEY
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY") or "sonikoma-default-jwt-secret-key-change-in-production"

# 5. GEMINI_API_KEY
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
if not GEMINI_API_KEY:
    logger.warning("GEMINI_API_KEY is not defined. AI generative features may be limited.")

# 6. Optional keys and settings
HUGGINGFACE_API_KEY = os.getenv("HUGGINGFACE_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")

NODE_ENV = os.getenv("NODE_ENV", "development")
API_VERSION = os.getenv("API_VERSION", "1.0.0")

try:
    RATE_LIMIT_RPM = int(os.getenv("RATE_LIMIT_RPM", "120"))
except ValueError:
    RATE_LIMIT_RPM = 120

try:
    ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
except ValueError:
    ACCESS_TOKEN_EXPIRE_MINUTES = 1440

try:
    MAX_PROXY_MB = int(os.getenv("MAX_PROXY_MB", "20"))
except ValueError:
    MAX_PROXY_MB = 20

# YOLO Models directory setup
MODELS_DIR = os.path.join(PROJECT_ROOT, "data", "models")
