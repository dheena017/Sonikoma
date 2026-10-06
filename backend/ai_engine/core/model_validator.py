"""
backend/ai_engine/core/model_validator.py
─────────────────────────────────────────────────────────────────────────────
AI Model Validator, Latency Benchmarker, & API Key Diagnostic Engine.
Manages API key format checks, diagnostic latency/quota testing, token counting,
and side-by-side model speed and quality benchmarking.
─────────────────────────────────────────────────────────────────────────────
"""

import time
import requests
from typing import List, Any, Dict, Optional

from ai_engine.core.registry import ModelRegistry


class ModelValidator:
    """Validates API keys, runs diagnostics/latency/quota tests, counts tokens, and benchmarks models."""

    @staticmethod
    def check_key_issues(key: str) -> str:
        """Detect key format and return guessed provider."""
        key_clean = key.strip()
        if key_clean.startswith("hf_"):
            return "huggingface"
        elif key_clean.startswith("f_") and len(key_clean) >= 30:
            return "huggingface_corrected"
        elif key_clean.startswith("sk-ant-"):
            return "anthropic"
        elif key_clean.startswith("sk-"):
            return "openai"
        elif key_clean.startswith("AIzaSy") or key_clean.startswith("AQ."):
            return "gemini"
        else:
            return "gemini"

    @staticmethod
    def run_provider_diagnostic(
        provider: str,
        model_id: str,
        prompt: str,
        api_key: str,
        client_instance: Optional[Any] = None
    ) -> Dict[str, Any]:
        """Sends a test request to a provider and returns latency, usage, and response data."""
        start_time = time.monotonic()
        try:
            if provider == "gemini":
                if not client_instance:
                    from google import genai
                    client_instance = genai.Client(api_key=api_key)
                
                response = client_instance.models.generate_content(model=model_id, contents=prompt)
                latency_ms = int((time.monotonic() - start_time) * 1000)
                usage = getattr(response, 'usage_metadata', None)
                p_tokens = getattr(usage, 'prompt_token_count', 0) if usage else 0
                c_tokens = getattr(usage, 'candidates_token_count', 0) if usage else 0
                cost = ModelRegistry.calculate_cost(model_id, p_tokens, c_tokens)

                return {
                    "success": True,
                    "latency_ms": latency_ms,
                    "prompt_tokens": p_tokens,
                    "completion_tokens": c_tokens,
                    "cost": cost,
                    "response_text": response.text or ""
                }

            elif provider == "huggingface":
                url = f"https://api-inference.huggingface.co/models/{model_id}"
                headers = {"Authorization": f"Bearer {api_key}"}
                r = requests.post(url, json={"inputs": prompt, "parameters": {"max_new_tokens": 50}}, headers=headers)
                latency_ms = int((time.monotonic() - start_time) * 1000)
                if r.status_code == 200:
                    res_data = r.json()
                    reply = str(res_data)
                    if isinstance(res_data, list) and len(res_data) > 0:
                        reply = res_data[0].get("generated_text", reply)
                    p_tokens = max(1, len(prompt) // 4)
                    c_tokens = max(1, len(reply) // 4)
                    return {
                        "success": True,
                        "latency_ms": latency_ms,
                        "prompt_tokens": p_tokens,
                        "completion_tokens": c_tokens,
                        "cost": 0.0,
                        "response_text": reply
                    }
                else:
                    return {
                        "success": False,
                        "error": f"HF Inference Error (HTTP {r.status_code}): {r.text}"
                    }

            elif provider == "openai":
                url = "https://api.openai.com/v1/chat/completions"
                headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
                payload = {
                    "model": model_id,
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": 50
                }
                r = requests.post(url, json=payload, headers=headers)
                latency_ms = int((time.monotonic() - start_time) * 1000)
                if r.status_code == 200:
                    res_data = r.json()
                    reply = res_data["choices"][0]["message"]["content"]
                    usage = res_data.get("usage", {})
                    return {
                        "success": True,
                        "latency_ms": latency_ms,
                        "prompt_tokens": usage.get("prompt_tokens", 0),
                        "completion_tokens": usage.get("completion_tokens", 0),
                        "cost": 0.0,
                        "response_text": reply
                    }
                else:
                    return {
                        "success": False,
                        "error": f"OpenAI API Error (HTTP {r.status_code}): {r.text}"
                    }

            elif provider == "anthropic":
                url = "https://api.anthropic.com/v1/messages"
                headers = {
                    "x-api-key": api_key,
                    "anthropic-version": "2023-06-01",
                    "Content-Type": "application/json"
                }
                payload = {
                    "model": model_id,
                    "max_tokens": 100,
                    "messages": [{"role": "user", "content": prompt}]
                }
                r = requests.post(url, json=payload, headers=headers)
                latency_ms = int((time.monotonic() - start_time) * 1000)
                if r.status_code == 200:
                    res_data = r.json()
                    reply = res_data["content"][0]["text"]
                    usage = res_data.get("usage", {})
                    return {
                        "success": True,
                        "latency_ms": latency_ms,
                        "prompt_tokens": usage.get("input_tokens", 0),
                        "completion_tokens": usage.get("output_tokens", 0),
                        "cost": 0.0,
                        "response_text": reply
                    }
                else:
                    return {
                        "success": False,
                        "error": f"Anthropic API Error (HTTP {r.status_code}): {r.text}"
                    }
            
            else:
                return {"success": False, "error": f"Unsupported provider: {provider}"}

        except Exception as e:
            return {"success": False, "error": str(e)}

    @staticmethod
    def count_tokens(
        provider: str,
        model_name: str,
        text_content: str,
        api_key: str,
        client_instance: Optional[Any] = None
    ) -> Dict[str, Any]:
        """Counts or estimates tokens for the given text and model."""
        if provider != "gemini":
            chars = len(text_content)
            estimated = int(chars / 4)
            return {
                "success": True,
                "is_estimate": True,
                "total_tokens": estimated,
                "characters": chars
            }
        
        try:
            if not client_instance:
                from google import genai
                client_instance = genai.Client(api_key=api_key)
            response = client_instance.models.count_tokens(model=model_name, contents=text_content)
            return {
                "success": True,
                "is_estimate": False,
                "total_tokens": getattr(response, "total_tokens", 0),
                "characters": len(text_content)
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    @classmethod
    def benchmark_models(
        cls,
        provider: str,
        models_list: List[Any],
        prompt: str,
        api_key: str,
        client_instance: Optional[Any] = None
    ) -> List[Dict[str, Any]]:
        """Runs side-by-side benchmark for multiple models."""
        benchmark_results = []
        for m in models_list:
            model_name = getattr(m, 'name', '') if provider == "gemini" else m.get("id")
            clean_name = model_name.replace("models/", "")
            diag = cls.run_provider_diagnostic(
                provider=provider,
                model_id=clean_name,
                prompt=prompt,
                api_key=api_key,
                client_instance=client_instance
            )
            diag["model"] = clean_name
            benchmark_results.append(diag)
        return benchmark_results
