"""
backend/ai_engine/core/__init__.py
─────────────────────────────────────────────────────────────────────────────
Core orchestrator, registry, discovery, validator, config, and unified hub exports.
─────────────────────────────────────────────────────────────────────────────
"""

from ai_engine.core.config import ai_config, AIConfig
from ai_engine.core.registry import ModelRegistry, MODEL_CATALOG_DETAILED
from ai_engine.core.orchestrator import AIOrchestrator, AIErrorCode, AIExecutionError
from ai_engine.core.hub import AIHub, ai_hub
from ai_engine.core.model_discovery import ModelDiscoveryService, MODEL_METADATA_AUGMENTATION
from ai_engine.core.model_validator import ModelValidator

__all__ = [
    "ai_config",
    "AIConfig",
    "ModelRegistry",
    "MODEL_CATALOG_DETAILED",
    "AIOrchestrator",
    "AIErrorCode",
    "AIExecutionError",
    "AIHub",
    "ai_hub",
    "ModelDiscoveryService",
    "MODEL_METADATA_AUGMENTATION",
    "ModelValidator",
]
