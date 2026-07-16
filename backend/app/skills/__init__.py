try:
    from services.ai.skills import BaseAISkill, SCHEMA_MAP, registry
except ModuleNotFoundError:
    from app.services.ai.skills import BaseAISkill, SCHEMA_MAP, registry
