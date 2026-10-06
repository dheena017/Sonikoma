"""
backend/app/providers/video/engine.py
─────────────────────────────────────────────────────────────────────────────
Unified Video compilation engine orchestrating rendering, motion, and subtitles.
─────────────────────────────────────────────────────────────────────────────
"""

from typing import List, Optional
from ai_engine.providers.video.render_engine import RenderEngine
from ai_engine.providers.video.subtitle_engine import SubtitleEngine
from ai_engine.providers.ffmpeg.types import TransitionSpec, CutSpec, FilterType


class VideoEngine:
    """Unified engine coordinating video cuts, frame extraction, transitions, and subtitles."""

    def __init__(self, ffmpeg_path: str = "ffmpeg"):
        self.render = RenderEngine(ffmpeg_path=ffmpeg_path)
        self.subtitles = SubtitleEngine(ffmpeg_path=ffmpeg_path)

    async def extract_frames(self, *args, **kwargs) -> List[str]:
        return await self.render.extract_frames(*args, **kwargs)

    async def cut_video(self, *args, **kwargs) -> str:
        return await self.render.cut_video(*args, **kwargs)

    async def mix_audio(self, *args, **kwargs) -> str:
        return await self.render.mix_audio(*args, **kwargs)

    async def concatenate(self, *args, **kwargs) -> str:
        return await self.render.concatenate_videos(*args, **kwargs)

    async def add_subtitles(self, *args, **kwargs) -> str:
        return await self.subtitles.add_subtitles(*args, **kwargs)


_video_engine_instance: Optional[VideoEngine] = None


def get_video_engine(ffmpeg_path: str = "ffmpeg") -> VideoEngine:
    global _video_engine_instance
    if _video_engine_instance is None:
        _video_engine_instance = VideoEngine(ffmpeg_path=ffmpeg_path)
    return _video_engine_instance
