"""
Canonical AI Domain Subsystem (`features/ai`).

Consolidates all cognitive, generative, and autonomous AI modules into a single
cohesive domain with plain English naming:
- analysis: Vision parsing, smart cropping, speaker attribution, emotions & SFX
- narrative: Story memory, pacing metrics, voiceover script writing
- prompts: Prompt enhancement, image prompt generation, style presets
- agent: 1-click autonomous video director, scraping, voice casting, job tracking
- series: Multi-chapter arc planning, chapter scripts, panel images, voice dubbing
- translation: Comic dialogue localization, batch chapter translation, name dictionary
- thumbnails: High-CTR cover ideas, 16:9 prompt builder, banner compositing
- chat: Creative AI director chat assistant & story context builder
- training: Custom YOLO comic detector training & dataset preparation
- catalog: Multi-provider models, latency benchmarks, token cost tracking
- utils: Foundational template builder, JSON repair, speech timer, image loader
"""

from .service import AIService, ai_service

# Foundational Utils
from .utils import (
    fill_template,
    fix_bad_json,
    count_speech_seconds,
    load_picture,
)

# Catalog
from .catalog import (
    get_all_ai_models,
    test_model_speed,
    calculate_token_cost,
)

# Analysis
from .analysis import (
    read_panel,
    read_many_panels,
    cut_out_panels,
    match_bubbles_to_faces,
    find_emotion,
    find_sound_effects,
)

# Narrative
from .narrative import (
    remember_story,
    check_pacing,
    write_story_script,
)

# Prompts
from .prompts import (
    make_better_prompt,
    make_image_prompts,
    get_art_style,
    STYLE_PRESETS,
)

# Agent
from .agent import (
    start_video_agent,
    download_chapter,
    write_agent_script,
    assign_voices,
    make_agent_video,
    check_job,
    approve_job,
    get_all_jobs,
)

# Series
from .series import (
    plan_story_arc,
    write_chapter,
    make_panel_prompts,
    make_panel_image,
    dub_chapter_voices,
    save_series_memory,
    build_full_chapter,
    AISeriesRepository,
)

# Translation
from .translation import (
    translate_speech,
    translate_chapter,
    get_names,
    save_names,
)

# Thumbnails
from .thumbnails import (
    make_cover_ideas,
    make_cover_prompts,
    make_cover_image,
)

# Chat
from .chat import (
    ask_assistant,
    get_comic_context,
)

# Training
from .training import (
    train_bubble_model,
    prep_training_data,
    check_training_status,
)

__all__ = [
    "AIService",
    "ai_service",
    # Utils
    "fill_template",
    "fix_bad_json",
    "count_speech_seconds",
    "load_picture",
    # Catalog
    "get_all_ai_models",
    "test_model_speed",
    "calculate_token_cost",
    # Analysis
    "read_panel",
    "read_many_panels",
    "cut_out_panels",
    "match_bubbles_to_faces",
    "find_emotion",
    "find_sound_effects",
    # Narrative
    "remember_story",
    "check_pacing",
    "write_story_script",
    # Prompts
    "make_better_prompt",
    "make_image_prompts",
    "get_art_style",
    "STYLE_PRESETS",
    # Agent
    "start_video_agent",
    "download_chapter",
    "write_agent_script",
    "assign_voices",
    "make_agent_video",
    "check_job",
    "approve_job",
    "get_all_jobs",
    # Series
    "plan_story_arc",
    "write_chapter",
    "make_panel_prompts",
    "make_panel_image",
    "dub_chapter_voices",
    "save_series_memory",
    "build_full_chapter",
    "AISeriesRepository",
    # Translation
    "translate_speech",
    "translate_chapter",
    "get_names",
    "save_names",
    # Thumbnails
    "make_cover_ideas",
    "make_cover_prompts",
    "make_cover_image",
    # Chat
    "ask_assistant",
    "get_comic_context",
    # Training
    "train_bubble_model",
    "prep_training_data",
    "check_training_status",
]
