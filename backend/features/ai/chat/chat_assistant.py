"""
AI creative chat assistant.

Answers creator questions, brainstorms plot twists, polishes dialogue lines,
and advises on panel composition and camera angles.
"""

from typing import List, Dict, Any, Optional
import logging
from ai_engine.core.hub import AIHub

logger = logging.getLogger("sonikoma.features.ai.chat.assistant")


def _format_chat_history(messages: List[Dict[str, str]]) -> str:
    """Formats conversation turns into a readable prompt block."""
    if not messages:
        return ""
    lines = []
    for m in messages[-10:]:
        role = m.get("role", "user").capitalize()
        content = m.get("content", "")
        lines.append(f"{role}: {content}")
    return "\n".join(lines)


async def ask_assistant(
    user_message: str,
    chat_history: Optional[List[Dict[str, str]]] = None,
    story_context: Optional[str] = None,
    ai_provider: str = "gemini",
    model_name: Optional[str] = None
) -> Dict[str, Any]:
    """Sends a message to the AI creative assistant and returns their helpful response."""
    history_str = _format_chat_history(chat_history or [])
    system_prompt = (
        "You are an expert AI comic director, screenwriter, and artist assistant for Sonikoma. "
        "You help comic creators write punchy dialogue, brainstorm plot twists, and plan camera framing. "
        "Keep answers helpful, direct, and creative."
    )

    full_prompt = ""
    if story_context:
        full_prompt += f"Story Background:\n{story_context}\n\n"
    if history_str:
        full_prompt += f"Conversation History:\n{history_str}\n\n"
    full_prompt += f"User: {user_message}\nAssistant:"

    try:
        hub_reply = await AIHub().chat(
            prompt=full_prompt,
            system_instruction=system_prompt,
            model=model_name or "gemini-3.5-flash-lite",
        )
        if hub_reply:
            reply_text = str(hub_reply.get("text", hub_reply) if isinstance(hub_reply, dict) else hub_reply)
            return {
                "reply": reply_text.strip(),
                "role": "assistant",
                "status": "success"
            }
    except Exception as e:
        logger.warning(f"Error calling AIHub chat: {e}")

    # Fallback creative response
    fallback = (
        f"Regarding '{user_message}': For dramatic impact, focus on high contrast "
        f"and strong emotional expressions in your next comic panel."
    )
    return {
        "reply": fallback,
        "role": "assistant",
        "status": "fallback"
    }


__all__ = ["ask_assistant"]
