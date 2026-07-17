"""
backend/app/services/model_catalog/registry.py
Manages model lists, categorizing/filtering, cost estimation pricing metadata, and model resolution.
"""
from typing import List, Any, Optional

class ModelRegistry:
    """Manages model metadata, pricing, resolution, and filtering."""

    @staticmethod
    def calculate_cost(model_name: str, in_tokens: int, out_tokens: int) -> float:
        """Estimate cost in USD based on official pricing for Gemini models."""
        name_lower = model_name.lower()

        if "pro" in name_lower:
            in_rate = 1.25 / 1_000_000
            out_rate = 5.00 / 1_000_000
        elif "flash" in name_lower or "lite" in name_lower:
            in_rate = 0.075 / 1_000_000
            out_rate = 0.30 / 1_000_000
        else:
            in_rate = 0.0
            out_rate = 0.0

        return (in_tokens * in_rate) + (out_tokens * out_rate)

    @staticmethod
    def resolve_model_by_input(user_input: str, models_list: List[Any], active_provider: str) -> Optional[Any]:
        """Resolves a model object/dict from list based on user index choice or exact ID match."""
        user_input = user_input.strip()
        if not user_input or not models_list:
            return None

        try:
            idx = int(user_input) - 1
            if 0 <= idx < len(models_list):
                return models_list[idx]
        except ValueError:
            pass

        for m in models_list:
            if active_provider == "gemini":
                m_name = getattr(m, 'name', '') or ""
                clean_name = m_name.replace("models/", "")
                if user_input.lower() == m_name.lower() or user_input.lower() == clean_name.lower():
                    return m
            else:
                m_id = m.get("id") or ""
                if user_input.lower() == m_id.lower():
                    return m

        return None

    @staticmethod
    def filter_models(
        models_list: List[Any],
        active_provider: str,
        filter_query: Optional[str] = None,
        show_free_only: bool = False
    ) -> List[Any]:
        """Filters models list by query and free tier availability."""
        if not models_list:
            return []

        filtered = models_list
        if filter_query:
            q = filter_query.lower()
            if active_provider == "gemini":
                filtered = [
                    m for m in models_list
                    if q in (getattr(m, 'name', '') or "").lower() or q in (getattr(m, 'display_name', '') or "").lower()
                ]
            elif active_provider == "huggingface":
                filtered = [
                    m for m in models_list
                    if q in (m.get("id") or "").lower() or q in (m.get("pipeline_tag") or "").lower()
                ]
            else:
                filtered = [m for m in models_list if q in (m.get("id") or "").lower()]

        if show_free_only:
            if active_provider == "gemini":
                filtered = [
                    m for m in filtered
                    if "flash" in (getattr(m, 'name', '') or "").lower() or "lite" in (getattr(m, 'name', '') or "").lower() or "8b" in (getattr(m, 'name', '') or "").lower()
                ]
            elif active_provider == "huggingface":
                pass
            else:
                filtered = []

        return filtered
