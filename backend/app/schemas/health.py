"""
backend/app/schemas/health.py
─────────────────────────────────────────────────────────────────────────────
Pydantic request/response schemas for health.
─────────────────────────────────────────────────────────────────────────────
"""

from pydantic import BaseModel, Field, EmailStr
from typing import List, Dict, Any, Optional, Literal, Union
from datetime import datetime

class CustomLogPayload(BaseModel):
    message: str
    level: str = "info"

