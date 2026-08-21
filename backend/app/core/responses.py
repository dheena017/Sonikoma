"""
backend/app/core/responses.py
─────────────────────────────────────────────────────────────────────────────
Custom Pretty-Printed JSON Response Class for FastAPI
Ensures all API endpoints return clean, human-readable indented JSON (indent=2)
when accessed in the browser or via API tools.
─────────────────────────────────────────────────────────────────────────────
"""

import json
from typing import Any
from fastapi.responses import Response


class PrettyJSONResponse(Response):
    media_type = "application/json"

    def render(self, content: Any) -> bytes:
        if content is None:
            return b""
        return json.dumps(
            content,
            ensure_ascii=False,
            allow_nan=False,
            indent=2,
            separators=(", ", ": "),
            default=str,
        ).encode("utf-8")
