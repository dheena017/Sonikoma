"""
Unified Master AI Domain Service (`features/ai/service.py`).

Coordinates all comic AI sub-domains:
- Analysis: Vision parsing, smart cropping, speaker attribution, emotion & SFX detection
- Narrative: Story memory, pacing, script writing
- Prompts: Style presets, prompt enhancer, negative prompts
- Agent: Autonomous 1-click video director & job manager
- Series: Story arc architect, chapter writer, image synthesis, voice dubber
- Translation: Slang-aware speech translation, batch chapter translation, name dictionary
- Thumbnails: Cover ideas, 16:9 prompt builder, banner compositor
- Chat: Creative AI assistant & comic context builder
- Training: YOLO model training & dataset preparation
- Catalog: Model catalog, speed testing, cost tracking
"""

from typing import Dict, List, Any, Optional, Union, Literal
from PIL import Image

# Sub-domain functions
from features.ai.analysis import (
    read_panel,
    read_many_panels,
    cut_out_panels,
    match_bubbles_to_faces,
    find_emotion,
    find_sound_effects,
)
from features.ai.narrative import (
    remember_story,
    check_pacing,
    write_story_script,
)
from features.ai.prompts import (
    make_better_prompt,
    make_image_prompts,
    get_art_style,
)
from features.ai.agent import (
    start_video_agent,
    download_chapter,
    write_agent_script,
    assign_voices,
    make_agent_video,
    check_job,
    approve_job,
    get_all_jobs,
)
from features.ai.series import (
    plan_story_arc,
    write_chapter,
    make_panel_prompts,
    make_panel_image,
    dub_chapter_voices,
    save_series_memory,
    build_full_chapter,
)
from features.ai.translation import (
    translate_speech,
    translate_chapter,
    get_names,
    save_names,
)
from features.ai.thumbnails import (
    make_cover_ideas,
    make_cover_prompts,
    make_cover_image,
)
from features.ai.chat import (
    ask_assistant,
    get_comic_context,
)
from features.ai.training import (
    train_bubble_model,
    prep_training_data,
    check_training_status,
)
from features.ai.catalog import (
    get_all_ai_models,
    test_model_speed,
    calculate_token_cost,
)


class AIService:
    """Master service unifying all AI sub-systems across Sonikoma."""

    # 1. Vision & Analysis
    read_panel = staticmethod(read_panel)
    read_many_panels = staticmethod(read_many_panels)
    cut_out_panels = staticmethod(cut_out_panels)
    match_bubbles_to_faces = staticmethod(match_bubbles_to_faces)
    find_emotion = staticmethod(find_emotion)
    find_sound_effects = staticmethod(find_sound_effects)

    # 2. Narrative
    remember_story = staticmethod(remember_story)
    check_pacing = staticmethod(check_pacing)
    write_story_script = staticmethod(write_story_script)

    # 3. Prompts
    make_better_prompt = staticmethod(make_better_prompt)
    make_image_prompts = staticmethod(make_image_prompts)
    get_art_style = staticmethod(get_art_style)

    # 4. Autonomous Agent
    start_video_agent = staticmethod(start_video_agent)
    download_chapter = staticmethod(download_chapter)
    write_agent_script = staticmethod(write_agent_script)
    assign_voices = staticmethod(assign_voices)
    make_agent_video = staticmethod(make_agent_video)
    check_job = staticmethod(check_job)
    approve_job = staticmethod(approve_job)
    get_all_jobs = staticmethod(get_all_jobs)

    # 5. Series Studio
    plan_story_arc = staticmethod(plan_story_arc)
    write_chapter = staticmethod(write_chapter)
    make_panel_prompts = staticmethod(make_panel_prompts)
    make_panel_image = staticmethod(make_panel_image)
    dub_chapter_voices = staticmethod(dub_chapter_voices)
    save_series_memory = staticmethod(save_series_memory)
    build_full_chapter = staticmethod(build_full_chapter)

    # 6. Translation
    translate_speech = staticmethod(translate_speech)
    translate_chapter = staticmethod(translate_chapter)
    get_names = staticmethod(get_names)
    save_names = staticmethod(save_names)

    # 7. Thumbnails
    make_cover_ideas = staticmethod(make_cover_ideas)
    make_cover_prompts = staticmethod(make_cover_prompts)
    make_cover_image = staticmethod(make_cover_image)

    # 8. Chat
    ask_assistant = staticmethod(ask_assistant)
    get_comic_context = staticmethod(get_comic_context)

    # 9. Training
    train_bubble_model = staticmethod(train_bubble_model)
    prep_training_data = staticmethod(prep_training_data)
    check_training_status = staticmethod(check_training_status)

    # 10. Catalog & Usage
    get_all_ai_models = staticmethod(get_all_ai_models)
    test_model_speed = staticmethod(test_model_speed)
    calculate_token_cost = staticmethod(calculate_token_cost)


ai_service = AIService()

__all__ = ["AIService", "ai_service"]
