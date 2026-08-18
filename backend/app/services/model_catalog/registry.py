"""
backend/app/services/model_catalog/registry.py
Manages the single source of truth for AI model catalogs, provider resolution,
pricing calculation, token limits, and capability metadata.
"""
from typing import List, Any, Optional, Dict

MODEL_CATALOG_DETAILED: List[Dict[str, Any]] = [
    # Google Gemini Models
    {
        "id": "gemini-2.5-flash",
        "provider": "gemini",
        "name": "Google Gemini 2.5 Flash",
        "category": "Vision & Multimodal",
        "context_window": 1048576,
        "max_output_tokens": 8192,
        "prompt_price_per_1m": 0.075,
        "completion_price_per_1m": 0.30,
        "speed_rating": "Ultra Fast (<300ms)",
        "capabilities": ["vision", "json_mode", "streaming", "multilingual", "function_calling"],
        "recommended_for": ["YouTube SEO", "Panel Narration", "Story Scripting", "Smart Crop"],
    },
    {
        "id": "gemini-2.5-pro",
        "provider": "gemini",
        "name": "Google Gemini 2.5 Pro",
        "category": "Deep Reasoning & Multimodal",
        "context_window": 2097152,
        "max_output_tokens": 8192,
        "prompt_price_per_1m": 1.25,
        "completion_price_per_1m": 5.00,
        "speed_rating": "High (~800ms)",
        "capabilities": ["vision", "complex_reasoning", "json_mode", "code_generation"],
        "recommended_for": ["Deep Story Analysis", "Complex Panel Layout Planning"],
    },
    {
        "id": "gemini-2.0-flash",
        "provider": "gemini",
        "name": "Google Gemini 2.0 Flash",
        "category": "Fast Multimodal Backup",
        "context_window": 1048576,
        "max_output_tokens": 8192,
        "prompt_price_per_1m": 0.10,
        "completion_price_per_1m": 0.40,
        "speed_rating": "Ultra Fast (~250ms)",
        "capabilities": ["vision", "json_mode", "streaming"],
        "recommended_for": ["Panel OCR", "Bubble Text Extraction", "Fast Fallback"],
    },
    {
        "id": "gemini-2.5-flash-lite",
        "provider": "gemini",
        "name": "Google Gemini 2.5 Flash Lite",
        "category": "Ultra Lightweight & Fast",
        "context_window": 1048576,
        "max_output_tokens": 8192,
        "prompt_price_per_1m": 0.0375,
        "completion_price_per_1m": 0.15,
        "speed_rating": "Ultra Fast (<200ms)",
        "capabilities": ["vision", "speed_optimized", "json_mode"],
        "recommended_for": ["High-Frequency Crop & Metadata", "Fast Background Jobs"],
    },
    # OpenAI Models
    {
        "id": "gpt-4o",
        "provider": "openai",
        "name": "OpenAI GPT-4o",
        "category": "Omni Intelligence",
        "context_window": 128000,
        "max_output_tokens": 4096,
        "prompt_price_per_1m": 2.50,
        "completion_price_per_1m": 10.00,
        "speed_rating": "Fast (~450ms)",
        "capabilities": ["vision", "json_mode", "structured_outputs"],
        "recommended_for": ["Nuanced Script Polishing", "Character Dialogue"],
    },
    {
        "id": "gpt-4o-mini",
        "provider": "openai",
        "name": "OpenAI GPT-4o Mini",
        "category": "Fast General Intelligence",
        "context_window": 128000,
        "max_output_tokens": 4096,
        "prompt_price_per_1m": 0.15,
        "completion_price_per_1m": 0.60,
        "speed_rating": "Ultra Fast (~300ms)",
        "capabilities": ["json_mode", "speed_optimized"],
        "recommended_for": ["High-volume metadata", "Summary Generation"],
    },
    # Anthropic Claude Models
    {
        "id": "claude-3-5-sonnet-20241022",
        "provider": "anthropic",
        "name": "Anthropic Claude 3.5 Sonnet",
        "category": "State-of-the-Art Reasoning",
        "context_window": 200000,
        "max_output_tokens": 8192,
        "prompt_price_per_1m": 3.00,
        "completion_price_per_1m": 15.00,
        "speed_rating": "Standard (~650ms)",
        "capabilities": ["creative_writing", "vision", "complex_narrative"],
        "recommended_for": ["Creative Manga Dramatization", "Epic Script Writing"],
    },
    {
        "id": "claude-3-5-haiku-20241022",
        "provider": "anthropic",
        "name": "Anthropic Claude 3.5 Haiku",
        "category": "High Speed Reasoning",
        "context_window": 200000,
        "max_output_tokens": 8192,
        "prompt_price_per_1m": 0.80,
        "completion_price_per_1m": 4.00,
        "speed_rating": "Ultra Fast (~280ms)",
        "capabilities": ["fast_reasoning", "creative_dialogue"],
        "recommended_for": ["Fast Narration Iterations"],
    },
    # ElevenLabs Voice Model
    {
        "id": "eleven_multilingual_v2",
        "provider": "elevenlabs",
        "name": "ElevenLabs Multilingual v2",
        "category": "Neural Speech & Emotion",
        "context_window": 5000,
        "max_output_tokens": 5000,
        "prompt_price_per_1m": 0.0,
        "completion_price_per_1m": 0.0,
        "speed_rating": "Streaming Audio (~400ms TTFB)",
        "capabilities": ["voice_cloning", "multilingual_audio", "emotion_control"],
        "recommended_for": ["Character Voice Acting", "Studio Narration"],
    },
    # HuggingFace Models
    {
        "id": "FLUX.1-schnell",
        "provider": "huggingface",
        "name": "Black Forest Labs FLUX.1 Schnell",
        "category": "Diffusion Artwork & Thumbnails",
        "context_window": 512,
        "max_output_tokens": 1,
        "prompt_price_per_1m": 0.0,
        "completion_price_per_1m": 0.0,
        "speed_rating": "Fast GPU (~1.4s)",
        "capabilities": ["high_res_image", "anime_fidelity", "fast_steps"],
        "recommended_for": ["YouTube Thumbnail Base Artwork", "Poster Design"],
    },
]


class ModelRegistry:
    """Manages model metadata, pricing, resolution, and filtering."""

    @staticmethod
    def get_catalog() -> List[Dict[str, Any]]:
        """Returns the complete static catalog of models."""
        return MODEL_CATALOG_DETAILED

    @staticmethod
    def get_catalog_for_providers(available_providers: List[str]) -> List[Dict[str, Any]]:
        """Returns models matching the given list of available providers."""
        if not available_providers:
            # Always return at least Gemini models as basic fallback
            return [m for m in MODEL_CATALOG_DETAILED if m.get("provider") == "gemini"]
        
        normalized = [p.lower().replace("google", "gemini") for p in available_providers]
        return [m for m in MODEL_CATALOG_DETAILED if m.get("provider", "").lower() in normalized]

    @staticmethod
    def calculate_cost(model_name: str, in_tokens: int, out_tokens: int) -> float:
        """Estimate cost in USD based on model pricing metadata."""
        name_lower = model_name.lower()
        
        # Match exact from catalog
        for m in MODEL_CATALOG_DETAILED:
            if m["id"].lower() == name_lower:
                in_rate = m.get("prompt_price_per_1m", 0.0) / 1_000_000
                out_rate = m.get("completion_price_per_1m", 0.0) / 1_000_000
                return (in_tokens * in_rate) + (out_tokens * out_rate)

        # Fallback estimation for common patterns
        if "pro" in name_lower or "claude-3-5-sonnet" in name_lower or "gpt-4o" in name_lower:
            in_rate = 1.25 / 1_000_000
            out_rate = 5.00 / 1_000_000
        elif "flash" in name_lower or "lite" in name_lower or "mini" in name_lower or "haiku" in name_lower:
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
                m_name = getattr(m, 'name', '') if not isinstance(m, dict) else m.get("id", m.get("name", ""))
                clean_name = m_name.replace("models/", "")
                if user_input.lower() == m_name.lower() or user_input.lower() == clean_name.lower():
                    return m
            else:
                m_id = m.get("id", m.get("name", "")) if isinstance(m, dict) else getattr(m, 'name', '')
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
                    if q in (getattr(m, 'name', '') or m.get("name", "") if isinstance(m, dict) else "").lower() or
                       q in (getattr(m, 'display_name', '') or m.get("displayName", "") if isinstance(m, dict) else "").lower()
                ]
            elif active_provider == "huggingface":
                filtered = [
                    m for m in models_list
                    if q in (m.get("id") or m.get("name", "")).lower() or q in (m.get("pipeline_tag") or "").lower()
                ]
            else:
                filtered = [m for m in models_list if q in (m.get("id") or m.get("name", "")).lower()]

        if show_free_only:
            if active_provider == "gemini":
                filtered = [
                    m for m in filtered
                    if "flash" in (getattr(m, 'name', '') if not isinstance(m, dict) else m.get("id", "")).lower() or
                       "lite" in (getattr(m, 'name', '') if not isinstance(m, dict) else m.get("id", "")).lower()
                ]
            elif active_provider == "huggingface":
                pass
            else:
                filtered = []

        return filtered
