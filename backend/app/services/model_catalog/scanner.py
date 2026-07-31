"""
backend/app/services/model_catalog/scanner.py
Handles API connection establishment and model scanning/fetching for all supported providers.
"""
import requests
from typing import List, Any, Dict

class ModelScanner:
    """Scans and retrieves models from different AI providers."""
    
    @staticmethod
    def fetch_gemini_models(api_key: str) -> List[Any]:
        from google import genai
        client = genai.Client(api_key=api_key)
        return list(client.models.list())

    @staticmethod
    def fetch_huggingface_models(api_key: str) -> List[Dict[str, Any]]:
        headers = {"Authorization": f"Bearer {api_key}"}
        r_auth = requests.get("https://huggingface.co/api/whoami-v2", headers=headers)
        if r_auth.status_code != 200:
            raise ValueError(f"Hugging Face Auth failed (HTTP {r_auth.status_code}): {r_auth.text}")
        
        r_models = requests.get(
            "https://huggingface.co/api/models",
            params={"limit": 60, "sort": "downloads", "direction": -1},
            headers=headers
        )
        r_models.raise_for_status()
        return r_models.json()

    @staticmethod
    def fetch_openai_models(api_key: str) -> List[Dict[str, Any]]:
        headers = {"Authorization": f"Bearer {api_key}"}
        r = requests.get("https://api.openai.com/v1/models", headers=headers)
        r.raise_for_status()
        return r.json().get("data", [])

    @staticmethod
    def fetch_anthropic_models(api_key: str) -> List[Dict[str, Any]]:
        headers = {
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01"
        }
        r = requests.get("https://api.anthropic.com/v1/models", headers=headers)
        r.raise_for_status()
        return r.json().get("data", [])

    @classmethod
    def scan_provider(cls, provider: str, api_key: str) -> List[Any]:
        """Orchestrates model fetching based on the provider."""
        if provider == "gemini":
            return cls.fetch_gemini_models(api_key)
        elif provider == "huggingface":
            return cls.fetch_huggingface_models(api_key)
        elif provider == "openai":
            return cls.fetch_openai_models(api_key)
        elif provider == "anthropic":
            return cls.fetch_anthropic_models(api_key)
        else:
            raise ValueError(f"Unsupported provider: {provider}")
