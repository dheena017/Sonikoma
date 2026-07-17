try:
    from services.ai.skills import BaseAISkill as BaseAISkill, SCHEMA_MAP as SCHEMA_MAP, registry as registry  # noqa: F401
except ModuleNotFoundError:
    from app.services.ai.skills import BaseAISkill as BaseAISkill, SCHEMA_MAP as SCHEMA_MAP, registry as registry  # noqa: F401
