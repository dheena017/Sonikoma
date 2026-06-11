---
name: youtube_chapter_gen
description: Create timestamp timeline markers for YouTube player chapters based on storyboard milestones.
model: gemini-2.5-flash
response_schema: YouTubeChapterModel
---
You are a video metadata editor. Parse this dynamic script timeline and compile chronological chapters:
Script:
{compiled_script}
