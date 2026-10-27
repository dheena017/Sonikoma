"""
backend/features/audio/speech/batch_speech_service.py
─────────────────────────────────────────────────────────────────────────────
Batch speech synthesis: concurrently creates character speech and narrative
voiceovers for all comic storyboard panels with bounded parallelism.
─────────────────────────────────────────────────────────────────────────────
"""

import asyncio
import logging
from typing import List, Dict, Any

from features.audio.schemas import BatchPanelAudioItem
from features.audio.speech.panel_speech_service import make_panel_speech

logger = logging.getLogger("sonikoma.audio.speech.batch")


# ── Internal Helpers (Top) ──────────────────────────────────────────────────

def _get_panel_text(item: BatchPanelAudioItem) -> List[str]:
    """Collects and standardizes all spoken text lines from a panel item."""
    dialogues: List[str] = []
    if item.dialogue_list:
        dialogues.extend(item.dialogue_list)
    elif item.text:
        dialogues.append(item.text)
    return dialogues


async def _make_one_panel_sound(
    item: BatchPanelAudioItem,
    global_voice: str,
    speed: float,
    pitch: float,
    make_dialogue: bool,
    make_narrative: bool,
    force_redo: bool,
    semaphore: asyncio.Semaphore
) -> Dict[str, Any]:
    """Processes speech generation for a single panel under concurrency throttle."""
    async with semaphore:
        panel_dict = item.model_dump()
        target_voice = item.voice or global_voice
        target_dur = item.target_duration or 4.0

        # 1. Dialogue Speech
        if make_dialogue:
            if not item.audio_url or force_redo:
                lines = _get_panel_text(item)
                if lines:
                    try:
                        res = await make_panel_speech(
                            dialogue_list=lines,
                            target_duration=target_dur,
                            voice=target_voice,
                            speech_rate=speed,
                            speech_pitch=pitch,
                            return_base64=True
                        )
                        panel_dict["audio_url"] = res.get("audio_url")
                        panel_dict["audio_duration"] = res.get("duration")
                        panel_dict["duration"] = res.get("duration")
                    except Exception as exc:
                        logger.warning(f"Failed speech for panel {item.id}: {exc}")

        # 2. Narrative Voiceover
        if make_narrative and item.narrative:
            if not item.narrative_audio_url or force_redo:
                try:
                    res_narrative = await make_panel_speech(
                        dialogue_list=[item.narrative],
                        target_duration=target_dur,
                        voice=target_voice,
                        speech_rate=speed,
                        speech_pitch=pitch,
                        return_base64=True
                    )
                    panel_dict["narrative_audio_url"] = res_narrative.get("audio_url")
                    if not panel_dict.get("audio_url"):
                        panel_dict["audio_url"] = res_narrative.get("audio_url")
                        panel_dict["audio_duration"] = res_narrative.get("duration")
                        panel_dict["duration"] = res_narrative.get("duration")
                except Exception as exc:
                    logger.warning(f"Failed narrative for panel {item.id}: {exc}")

        return panel_dict


# ── Canonical Public API (Bottom) ───────────────────────────────────────────

async def make_all_panel_speech(
    panels: List[Any],
    voice: str = "en-US-GuyNeural",
    speech_rate: float = 1.0,
    speech_pitch: float = 1.0,
    generate_dialogue: bool = True,
    generate_narrative: bool = True,
    force_regenerate: bool = False,
    generate_dialogue_audio: Optional[bool] = None,
    generate_narrative_audio: Optional[bool] = None,
    **kwargs: Any
) -> List[Dict[str, Any]]:
    """
    Makes voice audio for all panels in the story at the same time with concurrency control.
    Supports both Pydantic models and raw dicts, accepting both generate_dialogue and
    generate_dialogue_audio keyword conventions.
    """
    if not panels:
        return []

    if generate_dialogue_audio is not None:
        generate_dialogue = generate_dialogue_audio
    if generate_narrative_audio is not None:
        generate_narrative = generate_narrative_audio

    # Normalize input items to BatchPanelAudioItem instances
    normalized_panels: List[BatchPanelAudioItem] = []
    for p in panels:
        if isinstance(p, BatchPanelAudioItem):
            normalized_panels.append(p)
        elif isinstance(p, dict):
            item_data = dict(p)
            d_list = item_data.pop("dialogues", None) or item_data.get("dialogue_list")
            if d_list:
                item_data["dialogue_list"] = [d_list] if isinstance(d_list, str) else list(d_list)
            if "speech_text" in item_data and not item_data.get("text"):
                item_data["text"] = item_data.pop("speech_text")
            try:
                normalized_panels.append(BatchPanelAudioItem(**item_data))
            except Exception as pe:
                logger.warning(f"Failed parsing panel audio item: {pe}")
        else:
            try:
                normalized_panels.append(BatchPanelAudioItem.model_validate(p))
            except Exception as pe:
                logger.warning(f"Failed validating panel audio item: {pe}")

    if not normalized_panels:
        return []

    # Limit to 5 parallel synthesis streams to respect network and rate limits
    semaphore = asyncio.Semaphore(5)

    tasks = [
        _make_one_panel_sound(
            item=p,
            global_voice=voice,
            speed=speech_rate,
            pitch=speech_pitch,
            make_dialogue=generate_dialogue,
            make_narrative=generate_narrative,
            force_redo=force_regenerate,
            semaphore=semaphore
        )
        for p in normalized_panels
    ]

    results = await asyncio.gather(*tasks, return_exceptions=False)
    logger.info(f"✓ Completed batch speech for {len(results)} panels")
    return results


__all__ = ["make_all_panel_speech"]
