"""
backend/python/config/ports.py
─────────────────────────────────────────────────────────────────────────────
Centralized port, app URL, and environment configuration and validation.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import logging
from dotenv import load_dotenv

logger = logging.getLogger("sonikoma.config.ports")

# Ensure environment variables are loaded robustly if imported in isolation or test files
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
dotenv_path = os.path.join(PROJECT_ROOT, ".env")
if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path=dotenv_path)
else:
    load_dotenv()

# 1. FRONTEND_PORT
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

# 2. BACKEND_PORT
# Fallback logic: BACKEND_PORT > PORT
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

# 3. APP_URL
APP_URL = os.getenv("APP_URL")
if not APP_URL:
    raise RuntimeError(
        "Configuration Error: APP_URL environment variable is missing!\n"
        "Please define APP_URL (e.g., http://localhost:3000) in your .env file."
    )
