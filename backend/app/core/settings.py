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

# 1. FRONTEND_PORT (strictly required)
FRONTEND_PORT_STR = os.getenv("FRONTEND_PORT")
if not FRONTEND_PORT_STR:
    raise RuntimeError(
        "Configuration Error: FRONTEND_PORT environment variable is missing from the environment/dotenv!\n"
        "Please define FRONTEND_PORT in your .env file."
    )
try:
    FRONTEND_PORT = int(FRONTEND_PORT_STR)
except ValueError:
    raise RuntimeError(
        f"Configuration Error: FRONTEND_PORT must be a valid integer, got '{FRONTEND_PORT_STR}'"
    )

# 2. BACKEND_PORT (strictly required)
BACKEND_PORT_STR = os.getenv("BACKEND_PORT") or os.getenv("PORT")
if not BACKEND_PORT_STR:
    raise RuntimeError(
        "Configuration Error: Neither BACKEND_PORT nor PORT environment variables are defined!\n"
        "Please define BACKEND_PORT or PORT in your .env file."
    )
try:
    BACKEND_PORT = int(BACKEND_PORT_STR)
except ValueError:
    raise RuntimeError(
        f"Configuration Error: BACKEND_PORT/PORT must be a valid integer, got '{BACKEND_PORT_STR}'"
    )

# 3. APP_URL (strictly required)
APP_URL = os.getenv("APP_URL")
if not APP_URL:
    raise RuntimeError(
        "Configuration Error: APP_URL environment variable is missing!\n"
        "Please define APP_URL (e.g., http://localhost:3000) in your .env file."
    )

# 4. JWT_SECRET_KEY (strictly required)
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
if not JWT_SECRET_KEY:
    raise RuntimeError(
        "Configuration Error: JWT_SECRET_KEY environment variable is missing!\n"
        "Please define a secure random JWT_SECRET_KEY in your .env file."
    )

# 5. GEMINI_API_KEY (strictly required)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise RuntimeError(
        "Configuration Error: GEMINI_API_KEY environment variable is missing!\n"
        "Please define GEMINI_API_KEY in your .env file."
    )

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
