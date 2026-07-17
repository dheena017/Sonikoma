"""
backend/app/services/ai/skills/base.py
─────────────────────────────────────────────────────────────────────────────
Base AISkill class loading prompts directly from Markdown files.
Exposes modularized schemas, utils, and fallbacks.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import re
import time
import logging
import asyncio
from typing import Any, Optional, Type
from pydantic import BaseModel

from core.config import ai_initialized, call_gemini_with_retry, genai_client
from google.genai import types

# Import schemas and map
from services.ai.skills.schemas import (
    SCHEMA_MAP
)

# Import utils
from services.ai.skills.utils import (
    parse_simple_yaml,
    extract_json,
    resolve_api_key,
    get_provider_and_model,
    SkillLogger
)

# Import fallbacks
from services.ai.skills.coordinator import FallbackCoordinator

logger = logging.getLogger("sonikoma.skills.base")


class BaseAISkill:
    """Parses and executes an AI skill defined in a Markdown file."""

    def __init__(self, filepath: str):
        self.filepath = filepath
        self.name = ""
        self.description = ""
        self.default_model = "gemini-2.5-flash"
        self.response_schema_name = ""
        self.prompt_template = ""
        self.logger = SkillLogger()
        self.last_input_tokens = 0
        self.last_output_tokens = 0
        self.load()

    def load(self):
        """Loads and parses the .md file."""
        if not os.path.exists(self.filepath):
            raise FileNotFoundError(f"Markdown skill file not found: {self.filepath}")

        with open(self.filepath, "r", encoding="utf-8") as f:
            content = f.read()

        match = re.match(r"^---\s*\n(.*?)\n---\s*\n(.*)$", content, re.DOTALL)
        if match:
            yaml_block = match.group(1)
            self.prompt_template = match.group(2).strip()

            yaml_data = parse_simple_yaml(yaml_block)
            self.name = yaml_data.get("name", "")
            self.description = yaml_data.get("description", "")
            self.default_model = yaml_data.get("model", "gemini-2.5-flash")
            self.response_schema_name = yaml_data.get("response_schema", "")
        else:
            self.prompt_template = content.strip()
            self.name = os.path.splitext(os.path.basename(self.filepath))[0]

    @property
    def response_schema(self) -> Optional[Type[BaseModel]]:
        if self.response_schema_name:
            return SCHEMA_MAP.get(self.response_schema_name)
        return None

    def build_prompt(self, **kwargs) -> str:
        """Dynamically inserts key-value contexts into prompt brackets."""
        safe_template = self.prompt_template

        try:
            return safe_template.format(**kwargs)
        except KeyError as e:
            logger.warning(f"Missing parameter '{e}' during dynamic variable replacement in skill '{self.name}'. Injecting empty string.")
            kwargs[str(e).strip("'")] = ""
            return safe_template.format(**kwargs)
        except Exception as e:
            logger.error(f"Failed to compile prompt template for '{self.name}': {e}")
            return safe_template

    async def execute(self, model: Optional[str] = None, image_bytes: Optional[bytes] = None, api_key: Optional[str] = None, user_keys: Optional[dict] = None, **kwargs) -> Any:
        """Invokes the chosen provider model (Gemini, OpenAI, Anthropic, or HF) for skill execution."""
        start_time = time.monotonic()
        target_model = model or self.default_model

        provider, clean_model_id = get_provider_and_model(target_model)
        logger.info(f"[base.py] Resolved skill execution request to provider={provider}, model={clean_model_id}")

        prompt = self.build_prompt(**kwargs)
        last_exception = None

        try:
            if provider == "gemini":
                if "gemini-3.5" in clean_model_id.lower():
                    if "pro" in clean_model_id.lower():
                        clean_model_id = "gemini-2.5-pro"
                    else:
                        clean_model_id = "gemini-2.5-flash"
                    logger.info(f"[base.py] Translated gemini-3.5 model selection in '{self.name}' to: {clean_model_id}")

                key_to_use = resolve_api_key("gemini", api_key, user_keys)
                if not ai_initialized and not key_to_use:
                    raise RuntimeError("Gemini is not initialized and no API key was provided.")

                config_args = {}
                schema = self.response_schema
                if schema:
                    config_args["response_mime_type"] = "application/json"
                    config_args["response_schema"] = schema

                config = types.GenerateContentConfig(**config_args)

                contents = []
                if image_bytes:
                    contents.append(types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"))
                contents.append(prompt)

                from google import genai
                client_to_use = genai.Client(api_key=key_to_use) if key_to_use else genai_client

                response = await call_gemini_with_retry(
                    lambda: client_to_use.models.generate_content(
                        model=clean_model_id,
                        contents=contents,
                        config=config
                    )
                )

                elapsed_ms = int((time.monotonic() - start_time) * 1000)
                raw_text = response.text or "{}"

                import json
                try:
                    parsed_json = json.loads(raw_text)
                except Exception:
                    parsed_json = {"raw_text": raw_text}

                usage = getattr(response, 'usage_metadata', None)
                p_tokens = getattr(usage, 'prompt_token_count', 0) if usage else 0
                c_tokens = getattr(usage, 'candidates_token_count', 0) if usage else 0

                self.last_input_tokens = p_tokens
                self.last_output_tokens = c_tokens
                self.logger.log_execution(self.name, elapsed_ms, True, kwargs, parsed_json, p_tokens, c_tokens)
                return raw_text

            elif provider == "openai":
                import requests
                import base64
                import json

                key_to_use = resolve_api_key("openai", api_key, user_keys)
                if not key_to_use:
                    raise RuntimeError("Missing OpenAI API Key.")

                headers = {
                    "Authorization": f"Bearer {key_to_use}",
                    "Content-Type": "application/json"
                }

                messages = []
                if image_bytes:
                    base64_image = base64.b64encode(image_bytes).decode("utf-8")
                    messages = [
                        {
                            "role": "user",
                            "content": [
                                {"type": "text", "text": prompt},
                                {
                                    "type": "image_url",
                                    "image_url": {
                                        "url": f"data:image/jpeg;base64,{base64_image}"
                                    }
                                }
                            ]
                        }
                    ]
                else:
                    messages = [
                        {"role": "user", "content": prompt}
                    ]

                payload = {
                    "model": clean_model_id,
                    "messages": messages,
                }

                schema = self.response_schema
                if schema:
                    try:
                        if hasattr(schema, "model_json_schema"):
                            schema_dict = schema.model_json_schema()
                        else:
                            schema_dict = schema.schema()

                        payload["response_format"] = {
                            "type": "json_schema",
                            "json_schema": {
                                "name": schema.__name__,
                                "strict": True,
                                "schema": schema_dict
                            }
                        }
                    except Exception as schema_err:
                        logger.warning(f"Failed to generate JSON schema for OpenAI: {schema_err}")

                loop = asyncio.get_running_loop()
                url = "https://api.openai.com/v1/chat/completions"

                def make_request():
                    return requests.post(url, json=payload, headers=headers, timeout=60)

                response = await loop.run_in_executor(None, make_request)

                if response.status_code != 200:
                    raise RuntimeError(f"OpenAI API request failed (HTTP {response.status_code}): {response.text}")

                res_data = response.json()
                raw_text = res_data["choices"][0]["message"]["content"]

                usage = res_data.get("usage", {})
                self.last_input_tokens = usage.get("prompt_tokens", 0)
                self.last_output_tokens = usage.get("completion_tokens", 0)

                cleaned_json_text = extract_json(raw_text)
                try:
                    parsed_json = json.loads(cleaned_json_text)
                except Exception:
                    parsed_json = {"raw_text": raw_text}
                    cleaned_json_text = raw_text

                elapsed_ms = int((time.monotonic() - start_time) * 1000)
                self.logger.log_execution(self.name, elapsed_ms, True, kwargs, parsed_json, self.last_input_tokens, self.last_output_tokens)
                return cleaned_json_text

            elif provider == "anthropic":
                import requests
                import base64
                import json

                key_to_use = resolve_api_key("anthropic", api_key, user_keys)
                if not key_to_use:
                    raise RuntimeError("Missing Anthropic API Key.")

                headers = {
                    "x-api-key": key_to_use,
                    "anthropic-version": "2023-06-01",
                    "Content-Type": "application/json"
                }

                system_prompt = "You are a helpful AI assistant."
                schema = self.response_schema
                if schema:
                    try:
                        if hasattr(schema, "model_json_schema"):
                            schema_dict = schema.model_json_schema()
                        else:
                            schema_dict = schema.schema()
                        system_prompt = f"You MUST return ONLY a valid JSON object matching this schema:\n{json.dumps(schema_dict)}\nNo other conversational text, no explanations, no wrapping except clean JSON."
                    except Exception:
                        pass

                messages = []
                if image_bytes:
                    base64_image = base64.b64encode(image_bytes).decode("utf-8")
                    messages = [
                        {
                            "role": "user",
                            "content": [
                                {
                                    "type": "image",
                                    "source": {
                                        "type": "base64",
                                        "media_type": "image/jpeg",
                                        "data": base64_image
                                    }
                                },
                                {
                                    "type": "text",
                                    "text": prompt
                                }
                            ]
                        }
                    ]
                else:
                    messages = [
                        {"role": "user", "content": prompt}
                    ]

                payload = {
                    "model": clean_model_id,
                    "max_tokens": 4096,
                    "system": system_prompt,
                    "messages": messages,
                }

                loop = asyncio.get_running_loop()
                url = "https://api.anthropic.com/v1/messages"

                def make_request():
                    return requests.post(url, json=payload, headers=headers, timeout=60)

                response = await loop.run_in_executor(None, make_request)

                if response.status_code != 200:
                    raise RuntimeError(f"Anthropic API request failed (HTTP {response.status_code}): {response.text}")

                res_data = response.json()
                raw_text = res_data["content"][0]["text"]

                usage = res_data.get("usage", {})
                self.last_input_tokens = usage.get("input_tokens", 0)
                self.last_output_tokens = usage.get("output_tokens", 0)

                cleaned_json_text = extract_json(raw_text)
                try:
                    parsed_json = json.loads(cleaned_json_text)
                except Exception:
                    parsed_json = {"raw_text": raw_text}
                    cleaned_json_text = raw_text

                elapsed_ms = int((time.monotonic() - start_time) * 1000)
                self.logger.log_execution(self.name, elapsed_ms, True, kwargs, parsed_json, self.last_input_tokens, self.last_output_tokens)
                return cleaned_json_text

            elif provider == "huggingface":
                import requests
                import json

                key_to_use = resolve_api_key("huggingface", api_key, user_keys)
                if not key_to_use:
                    raise RuntimeError("Missing Hugging Face Token.")

                headers = {
                    "Authorization": f"Bearer {key_to_use}",
                    "Content-Type": "application/json"
                }

                payload = {
                    "inputs": prompt,
                    "parameters": {"max_new_tokens": 1000}
                }

                loop = asyncio.get_running_loop()
                url = f"https://api-inference.huggingface.co/models/{clean_model_id}"

                def make_request():
                    return requests.post(url, json=payload, headers=headers, timeout=60)

                response = await loop.run_in_executor(None, make_request)

                if response.status_code != 200:
                    raise RuntimeError(f"Hugging Face request failed (HTTP {response.status_code}): {response.text}")

                res_data = response.json()
                if isinstance(res_data, list) and len(res_data) > 0:
                    raw_text = res_data[0].get("generated_text", str(res_data))
                elif isinstance(res_data, dict):
                    raw_text = res_data.get("generated_text", str(res_data))
                else:
                    raw_text = str(res_data)

                self.last_input_tokens = len(prompt) // 4
                self.last_output_tokens = len(raw_text) // 4

                cleaned_json_text = extract_json(raw_text)
                try:
                    parsed_json = json.loads(cleaned_json_text)
                except Exception:
                    parsed_json = {"raw_text": raw_text}
                    cleaned_json_text = raw_text

                elapsed_ms = int((time.monotonic() - start_time) * 1000)
                self.logger.log_execution(self.name, elapsed_ms, True, kwargs, parsed_json, self.last_input_tokens, self.last_output_tokens)
                return cleaned_json_text

        except Exception as e:
            last_exception = e

        if last_exception:
            elapsed_ms = int((time.monotonic() - start_time) * 1000)
            logger.error(f"Skill '{self.name}' execution failed: {last_exception}", exc_info=True)

            fallback = FallbackCoordinator.get_programmatic_fallback(self.name, **kwargs)
            self.logger.log_execution(self.name, elapsed_ms, False, kwargs, fallback)

            raise last_exception
