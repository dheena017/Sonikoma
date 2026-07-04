"""
backend/python/services/compound_processor.py
─────────────────────────────────────────────────────────────────────────────
Compound media processor orchestrating multi-step workflows:
- Video editing workflows (cut → add audio → mix → render)
- Audio enhancement workflows (transcribe → analyze → enhance)
- Image processing workflows (generate → enhance → compose)
- Full multimedia pipelines
─────────────────────────────────────────────────────────────────────────────
"""

import os
import logging
import asyncio
import tempfile
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from enum import Enum

from services.ffmpeg_engine import get_ffmpeg_engine, CutSpec, TransitionSpec
from services.librosa_engine import get_librosa_engine, LIBROSA_AVAILABLE
from services.whisper_engine import get_whisper_engine, WhisperModel, WHISPER_AVAILABLE
from services.imagemagick_engine import get_imagemagick_engine, ResizeMode, WAND_AVAILABLE
from services.stable_diffusion_engine import get_stable_diffusion_engine, StableDiffusionModel

logger = logging.getLogger("sonikoma.services.compound_processor")


class WorkflowType(str, Enum):
    """Supported compound workflows."""
    VIDEO_EDITING = "video_editing"
    AUDIO_ENHANCEMENT = "audio_enhancement"
    IMAGE_GENERATION = "image_generation"
    FULL_MULTIMEDIA = "full_multimedia"


@dataclass
class WorkflowProgress:
    """Workflow progress tracking."""
    workflow_id: str
    workflow_type: WorkflowType
    status: str  # pending, running, completed, failed
    progress_percent: float
    current_step: str
    total_steps: int
    current_step_num: int
    error: Optional[str] = None
    results: Dict[str, Any] = None


class CompoundProcessor:
    """Orchestrates multi-step media processing workflows."""

    def __init__(self):
        """Initialize compound processor with all engines."""
        self.ffmpeg = get_ffmpeg_engine()
        self.librosa = get_librosa_engine() if LIBROSA_AVAILABLE else None
        self.whisper = get_whisper_engine(model_name=WhisperModel.BASE) if WHISPER_AVAILABLE else None
        self.imagemagick = get_imagemagick_engine() if WAND_AVAILABLE else None
        self.stable_diffusion = get_stable_diffusion_engine(device="cpu")
        
        # Workflow tracking
        self.active_workflows: Dict[str, WorkflowProgress] = {}

    def _progress(
        self,
        workflow_id: str,
        workflow_type: WorkflowType,
        current_step: str,
        current_step_num: int,
        total_steps: int,
        status: str = "running"
    ) -> None:
        """Update workflow progress."""
        progress_percent = (current_step_num / total_steps) * 100

        self.active_workflows[workflow_id] = WorkflowProgress(
            workflow_id=workflow_id,
            workflow_type=workflow_type,
            status=status,
            progress_percent=progress_percent,
            current_step=current_step,
            total_steps=total_steps,
            current_step_num=current_step_num
        )

        logger.info(f"[{workflow_id}] {current_step} ({current_step_num}/{total_steps})")

    async def video_editing_workflow(
        self,
        workflow_id: str,
        video_path: str,
        cuts: List[Dict[str, float]],
        audio_path: Optional[str] = None,
        output_dir: str = ""
    ) -> Dict[str, Any]:
        """
        Video editing workflow: extract → cut → mix audio → render.

        Args:
            workflow_id: Unique workflow identifier
            video_path: Input video path
            cuts: List of cut specifications [{"start": 0, "end": 10}, ...]
            audio_path: Optional audio track to mix
            output_dir: Output directory

        Returns:
            Workflow results dictionary
        """
        if not output_dir:
            output_dir = tempfile.gettempdir()

        os.makedirs(output_dir, exist_ok=True)

        try:
            total_steps = 4
            workflow_type = WorkflowType.VIDEO_EDITING

            # Step 1: Get metadata
            self._progress(workflow_id, workflow_type, "Extracting metadata", 1, total_steps)
            metadata = await self.ffmpeg.get_metadata(video_path)

            # Step 2: Extract audio
            self._progress(workflow_id, workflow_type, "Extracting audio", 2, total_steps)
            extracted_audio = os.path.join(output_dir, "extracted_audio.mp3")
            await self.ffmpeg.extract_audio(video_path, extracted_audio)

            # Step 3: Cut video
            self._progress(workflow_id, workflow_type, "Cutting video", 3, total_steps)
            cut_specs = [CutSpec(
                start_time=c["start"],
                end_time=c["end"],
                fade_in=c.get("fade_in", 0),
                fade_out=c.get("fade_out", 0)
            ) for c in cuts]

            cut_video = os.path.join(output_dir, "cut_video.mp4")
            await self.ffmpeg.cut_video(video_path, cut_specs, cut_video)

            # Step 4: Mix audio (if provided) or use extracted
            self._progress(workflow_id, workflow_type, "Mixing audio", 4, total_steps)
            audio_to_mix = [audio_path] if audio_path else [extracted_audio]
            
            final_output = os.path.join(output_dir, "final_edited_video.mp4")
            await self.ffmpeg.mix_audio(cut_video, audio_to_mix, output_path=final_output)

            self._progress(workflow_id, workflow_type, "Complete", total_steps, total_steps, "completed")

            return {
                "status": "completed",
                "workflow_id": workflow_id,
                "output_path": final_output,
                "metadata": {
                    "original_duration": metadata.duration,
                    "fps": metadata.fps,
                    "width": metadata.width,
                    "height": metadata.height,
                },
                "steps_completed": total_steps
            }

        except Exception as e:
            logger.error(f"Workflow failed: {e}")
            self.active_workflows[workflow_id].status = "failed"
            self.active_workflows[workflow_id].error = str(e)
            raise

    async def audio_enhancement_workflow(
        self,
        workflow_id: str,
        audio_path: str,
        transcribe: bool = True,
        analyze: bool = True,
        output_dir: str = ""
    ) -> Dict[str, Any]:
        """
        Audio enhancement workflow: transcribe → analyze → generate subtitle.

        Args:
            workflow_id: Unique workflow identifier
            audio_path: Input audio path
            transcribe: Whether to transcribe
            analyze: Whether to analyze audio
            output_dir: Output directory

        Returns:
            Workflow results dictionary
        """
        if not output_dir:
            output_dir = tempfile.gettempdir()

        os.makedirs(output_dir, exist_ok=True)

        try:
            total_steps = (2 if transcribe else 0) + (1 if analyze else 0)
            step_num = 0
            workflow_type = WorkflowType.AUDIO_ENHANCEMENT

            results = {}

            # Step 1: Transcribe
            if transcribe:
                if self.whisper is None:
                    raise RuntimeError(
                        "Audio transcription requested but openai-whisper is not installed or unavailable. "
                        "Install with: pip install openai-whisper"
                    )
                step_num += 1
                self._progress(workflow_id, workflow_type, "Transcribing audio", step_num, total_steps)
                
                transcription = await self.whisper.transcribe(audio_path)
                results["transcription"] = transcription.text

                # Generate SRT
                step_num += 1
                self._progress(workflow_id, workflow_type, "Generating subtitles", step_num, total_steps)
                
                srt_path = os.path.join(output_dir, "subtitles.srt")
                await self.whisper.generate_srt(audio_path, srt_path)
                results["srt_path"] = srt_path

            # Step 2: Analyze
            if analyze:
                if self.librosa is None:
                    raise RuntimeError(
                        "Audio analysis requested but librosa/soundfile are not installed. "
                        "Install with: pip install librosa soundfile"
                    )
                step_num += 1
                self._progress(workflow_id, workflow_type, "Analyzing audio features", step_num, total_steps)
                
                summary_stats = await self.librosa.extract_summary_stats(audio_path)
                results["audio_analysis"] = summary_stats

            self._progress(workflow_id, workflow_type, "Complete", total_steps, total_steps, "completed")

            return {
                "status": "completed",
                "workflow_id": workflow_id,
                "output_dir": output_dir,
                "results": results,
                "steps_completed": step_num
            }

        except Exception as e:
            logger.error(f"Workflow failed: {e}")
            self.active_workflows[workflow_id].status = "failed"
            self.active_workflows[workflow_id].error = str(e)
            raise

    async def image_generation_workflow(
        self,
        workflow_id: str,
        prompts: List[str],
        enhance: bool = True,
        output_dir: str = ""
    ) -> Dict[str, Any]:
        """
        Image generation workflow: generate → enhance → save.

        Args:
            workflow_id: Unique workflow identifier
            prompts: List of prompts to generate
            enhance: Whether to auto-enhance images
            output_dir: Output directory

        Returns:
            Workflow results dictionary
        """
        if not output_dir:
            output_dir = tempfile.gettempdir()

        os.makedirs(output_dir, exist_ok=True)

        try:
            total_steps = len(prompts) + (1 if enhance else 0)
            workflow_type = WorkflowType.IMAGE_GENERATION

            generated_images = []

            # Generate images for each prompt
            for i, prompt in enumerate(prompts):
                self._progress(
                    workflow_id, workflow_type,
                    f"Generating image: {prompt[:40]}...",
                    i + 1, total_steps
                )

                images = await self.stable_diffusion.generate_images(
                    prompt=prompt,
                    num_images=1,
                    output_dir=output_dir
                )
                generated_images.extend(images)

            # Enhance if requested
            if enhance:
                self._progress(workflow_id, workflow_type, "Enhancing images", total_steps, total_steps)

                for img in generated_images:
                    enhanced_path = img.image_path.replace(".png", "_enhanced.png")
                    await self.imagemagick.auto_enhance(
                        img.image_path,
                        enhanced_path,
                        brightness=1.1,
                        contrast=1.2,
                        saturation=1.15
                    )
                    img.image_path = enhanced_path

            self._progress(workflow_id, workflow_type, "Complete", total_steps, total_steps, "completed")

            return {
                "status": "completed",
                "workflow_id": workflow_id,
                "output_dir": output_dir,
                "images": [
                    {
                        "path": img.image_path,
                        "prompt": img.prompt,
                        "width": img.width,
                        "height": img.height
                    }
                    for img in generated_images
                ],
                "total_generated": len(generated_images)
            }

        except Exception as e:
            logger.error(f"Workflow failed: {e}")
            self.active_workflows[workflow_id].status = "failed"
            self.active_workflows[workflow_id].error = str(e)
            raise

    def get_workflow_progress(self, workflow_id: str) -> Optional[WorkflowProgress]:
        """Get current progress of a workflow."""
        return self.active_workflows.get(workflow_id)

    def list_active_workflows(self) -> List[WorkflowProgress]:
        """List all active workflows."""
        return list(self.active_workflows.values())


# Singleton instance
_processor_instance: Optional[CompoundProcessor] = None


def get_compound_processor() -> CompoundProcessor:
    """Get or create compound processor singleton."""
    global _processor_instance
    if _processor_instance is None:
        _processor_instance = CompoundProcessor()
    return _processor_instance
