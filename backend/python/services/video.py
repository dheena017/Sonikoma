import os
import logging
import numpy as np
from typing import List, Dict, Any

# MoviePy imports supporting both v1.x and v2.x
try:
    # MoviePy v2.x direct imports
    from moviepy import (
        ImageClip,
        AudioFileClip,
        CompositeVideoClip,
        CompositeAudioClip,
        concatenate_videoclips
    )
    import moviepy.audio.fx as afx
    import moviepy.video.fx as vfx
except ImportError:
    try:
        # MoviePy v1.x editor imports
        from moviepy.editor import (
            ImageClip,
            AudioFileClip,
            CompositeVideoClip,
            CompositeAudioClip,
            concatenate_videoclips,
            afx
        )
        vfx = None
    except ImportError:
        # Fallback to moviepy v1.x internal imports
        from moviepy.video.VideoClip import ImageClip
        from moviepy.audio.io.AudioFileClip import AudioFileClip
        from moviepy.video.compositing.CompositeVideoClip import CompositeVideoClip
        from moviepy.audio.AudioClip import CompositeAudioClip
        from moviepy.video.compositing.concatenate import concatenate_videoclips
        import moviepy.audio.fx.all as afx
        vfx = None

# Compatibility helper wrappers for moviepy v1.x vs v2.x
def set_clip_duration(clip, duration):
    if hasattr(clip, "with_duration"):
        return clip.with_duration(duration)
    return clip.set_duration(duration)

def resize_clip(clip, size_or_factor):
    if hasattr(clip, "with_effects") and vfx is not None:
        return clip.with_effects([vfx.Resize(size_or_factor)])
    return clip.resize(size_or_factor)

def set_clip_position(clip, position):
    if hasattr(clip, "with_position"):
        return clip.with_position(position)
    return clip.set_position(position)

def set_clip_audio(clip, audio):
    if hasattr(clip, "with_audio"):
        return clip.with_audio(audio)
    return clip.set_audio(audio)

def apply_volume_ducking(bgm_clip, ducking_volume_func):
    if hasattr(bgm_clip, "volumex"):
        return bgm_clip.volumex(ducking_volume_func)
    
    # For moviepy v2.x, write a custom frame function wrapper
    original_frame_function = bgm_clip.frame_function
    def new_frame_function(t):
        frames = original_frame_function(t)
        factors = ducking_volume_func(t)
        if isinstance(factors, np.ndarray):
            if len(frames.shape) > 1:
                return frames * factors[:, np.newaxis]
            return frames * factors
        return frames * factors
        
    return bgm_clip.with_updated_frame_function(new_frame_function)


logger = logging.getLogger("webtoon_engine.video")

async def compile_video(
    panel_data: List[Dict[str, Any]], 
    output_path: str, 
    bgm_path: str = None,
    target_width: int = 1920,
    target_height: int = 1080,
    fps: int = 24,
    zoom_factor: float = 0.05,
    ducking_volume: float = 0.15
) -> str:
    """
    Cinematically combines downloaded manhwa frames, binds high-fidelity TTS voiceover
    tracks, and layers a background music track with automatic volume ducking.
    Applies continuous sub-pixel camera pan/zoom transformations to the images.
    """
    logger.info(f"Compiling cinematic timeline with {len(panel_data)} scenes.")
    
    dialogue_intervals = []
    current_time = 0.0
    video_clips = []
    
    try:
        for idx, panel in enumerate(panel_data):
            image_path = panel.get("image_path")
            audio_path = panel.get("audio_path")
            nominal_duration = panel.get("duration", 5.0)

            if not image_path or not os.path.exists(image_path):
                logger.warning(f"Image path missing or not found: {image_path}. Skipping slot {idx}.")
                continue

            # 1. Load the individual image frame
            img_clip = ImageClip(image_path)
            
            # 2. Determine duration based on dialogue voice track length
            duration = nominal_duration
            panel_audio = None
            if audio_path and os.path.exists(audio_path):
                try:
                    panel_audio = AudioFileClip(audio_path)
                    duration = panel_audio.duration
                    # Register interval for background music ducking
                    dialogue_intervals.append((current_time, current_time + duration))
                except Exception as audio_err:
                    logger.error(f"Failed to integrate audio track at {audio_path}: {audio_err}")
            
            # Apply duration to the base image clip
            img_clip = set_clip_duration(img_clip, duration)
            
            # 3. Apply continuous sub-pixel camera pan/zoom transformation
            # Calculate optimal scale to fit screen dimensions without black bars
            w, h = img_clip.size
            if w / h > target_width / target_height:
                scale_to_fit = target_height / h
            else:
                scale_to_fit = target_width / w
                
            img_clip = resize_clip(img_clip, scale_to_fit)
            
            # Define zoom function over time
            def zoom_func(t):
                return 1.0 + (zoom_factor * (t / duration))
                
            animated_clip = resize_clip(img_clip, zoom_func)
            
            # Center the animating clip within the target viewport (crops overflow gracefully)
            viewport_clip = set_clip_duration(
                CompositeVideoClip(
                    [set_clip_position(animated_clip, ('center', 'center'))], 
                    size=(target_width, target_height)
                ),
                duration
            )
            
            # Attach the dialogue track to this specific temporal block
            if panel_audio:
                viewport_clip = set_clip_audio(viewport_clip, panel_audio)
                
            video_clips.append(viewport_clip)
            current_time += duration

        if not video_clips:
            raise ValueError("Zero valid frames compiled. All target images or audio were corrupted or missing.")

        # 4. Composite the timeline
        logger.info("Concatenating individual video clips into final narrative track...")
        final_video_clip = concatenate_videoclips(video_clips, method="compose")
        total_duration = final_video_clip.duration
        
        final_audio_tracks = []
        
        # Add the concatenated dialogue tracks (if any exist)
        if final_video_clip.audio:
            final_audio_tracks.append(final_video_clip.audio)

        # 5. Layer background music with audio ducking
        if bgm_path and os.path.exists(bgm_path):
            try:
                bgm_clip = AudioFileClip(bgm_path)
                # Loop BGM across the entire video runtime
                if hasattr(afx, "audio_loop"):
                    bgm_clip = afx.audio_loop(bgm_clip, duration=total_duration)
                else:
                    bgm_clip = bgm_clip.with_effects([afx.AudioLoop(duration=total_duration)])
                
                # Function to dynamically lower BGM volume during dialogues
                def ducking_volume_func(t):
                    is_scalar = np.isscalar(t)
                    t_arr = np.atleast_1d(t)
                    vols = np.ones_like(t_arr, dtype=float)
                    
                    for start_t, end_t in dialogue_intervals:
                        vols[(t_arr >= start_t) & (t_arr <= end_t)] = ducking_volume
                        
                    return vols[0] if is_scalar else vols
                    
                bgm_clip = apply_volume_ducking(bgm_clip, ducking_volume_func)
                final_audio_tracks.append(bgm_clip)
                logger.info(f"Background music track loaded and layered with ducking: {bgm_path}")
            except Exception as e:
                logger.error(f"Failed to apply BGM track {bgm_path}: {e}")

        # Combine all audio tracks into one master mix
        if final_audio_tracks:
            composite_audio = CompositeAudioClip(final_audio_tracks)
            final_video_clip = set_clip_audio(final_video_clip, composite_audio)

        # 6. Stitch frames and write output
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        logger.info(f"Rendering master MP4 payload to: {output_path}")
        final_video_clip.write_videofile(
            output_path,
            fps=fps,
            codec="libx264",
            audio_codec="aac",
            temp_audiofile=output_path.replace(".mp4", "_temp_audio.m4a"),
            remove_temp=True,
            logger=None
        )

        # Cleanup memory locks
        final_video_clip.close()
        for c in video_clips:
            c.close()

        logger.info(f"Master cinematic rendering finished successfully: {output_path}")
        return output_path

    except Exception as compile_err:
        logger.critical(f"Cinematic compilation failed: {str(compile_err)}", exc_info=True)
        raise compile_err

if __name__ == "__main__":
    import argparse
    import json
    import asyncio

    parser = argparse.ArgumentParser(description="Anivox Video Compiler CLI")
    parser.add_argument("--panel_data_path", required=True, help="Path to JSON file containing panel data")
    parser.add_argument("--output_path", required=True, help="Path to write the final MP4")
    parser.add_argument("--bgm_path", help="Path to optional background music")
    parser.add_argument("--target_width", type=int, default=1920)
    parser.add_argument("--target_height", type=int, default=1080)
    parser.add_argument("--fps", type=int, default=24)

    args = parser.parse_args()

    async def main():
        try:
            with open(args.panel_data_path, 'r') as f:
                panel_data = json.load(f)

            await compile_video(
                panel_data=panel_data,
                output_path=args.output_path,
                bgm_path=args.bgm_path,
                target_width=args.target_width,
                target_height=args.target_height,
                fps=args.fps
            )
            print("SUCCESS")
        except Exception as e:
            import sys
            print(f"ERROR: {str(e)}", file=sys.stderr)
            sys.exit(1)

    asyncio.run(main())
