"""
backend/app/services/scraper/ai/orchestrator_scraper.py
─────────────────────────────────────────────────────────────────────────────
Autonomous AI Comic Intelligence & Scraper Orchestrator
Uses Gemini 2.5 Flash to extract complete series/chapter metadata and generate
a dynamic, zero-hardcoding execution blueprint in ~300ms.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import re
import json
import time
import logging
import asyncio
from enum import Enum
from typing import Dict, Any, Optional, List, Tuple
from pydantic import BaseModel, Field

from bs4 import BeautifulSoup
from dotenv import load_dotenv

from ..constants import UNWANTED_PATTERNS, IMAGE_EXTENSIONS

load_dotenv()
logger = logging.getLogger("sonikoma.scraper.ai")


class ReadingDirection(str, Enum):
    VERTICAL_SCROLL = "VERTICAL_SCROLL"       # Webtoon / Manhwa
    RIGHT_TO_LEFT = "RIGHT_TO_LEFT"           # Traditional Manga
    LEFT_TO_RIGHT = "LEFT_TO_RIGHT"           # Western Comic
    SLIDESHOW = "SLIDESHOW"                   # Interactive Reader


class UniversalComicBlueprint(BaseModel):
    # ── Series Catalog Metadata ──────────────────────────────
    series_title: Optional[str] = Field(None, description="Full comic / series title")
    series_slug: Optional[str] = Field(None, description="URL-safe slug handle")
    author: Optional[str] = Field(None, description="Writer or original author name")
    artist: Optional[str] = Field(None, description="Illustrator / comic artist name")
    publisher: Optional[str] = Field(None, description="Publisher, studio, or scanlation group")
    status: Optional[str] = Field("Ongoing", description="Publication status: Ongoing, Completed, Hiatus")
    genres: List[str] = Field(default_factory=list, description="Categorized genres (e.g. Romance, Fantasy, Action)")
    tags: List[str] = Field(default_factory=list, description="Content / theme keywords (e.g. Royalty, Reincarnation)")
    synopsis: Optional[str] = Field(None, description="Full series summary / synopsis")
    cover_image_url: Optional[str] = Field(None, description="High-resolution series cover poster URL")
    original_language: Optional[str] = Field("en", description="Primary content language code: ko, ja, en, zh, fr")

    # ── Chapter Metadata ─────────────────────────────────────
    chapter_number: Optional[float] = Field(None, description="Numerical chapter or episode number")
    chapter_title: Optional[str] = Field(None, description="Specific chapter subtitle or title")
    publication_date: Optional[str] = Field(None, description="Publication timestamp if present")
    previous_chapter_url: Optional[str] = Field(None, description="URL to preceding chapter")
    next_chapter_url: Optional[str] = Field(None, description="URL to subsequent chapter")
    total_estimated_pages: Optional[int] = Field(None, description="Total number of pages or panels in chapter if indicated in page/state")

    # ── Autonomous Extraction Directives ────────────────────
    reading_direction: Optional[str] = Field("VERTICAL_SCROLL", description="Reading layout: VERTICAL_SCROLL, RIGHT_TO_LEFT, LEFT_TO_RIGHT, SLIDESHOW")
    worker_strategy: Optional[str] = Field("DOM_DIRECT", description="Optimal worker route: DOM_DIRECT, STATE_JSON, PLAYWRIGHT_FAST, VISION_SLICER")
    container_selector: Optional[str] = Field(None, description="CSS selector for the comic reader container (e.g. #readerarea, div.reading-content, #_imageList, div#app-root)")
    image_src_attribute: Optional[str] = Field("src", description="Target image attribute: data-original, data-src, nitro-lazy-src, src, data-url, data-srcset, data-echo")
    image_url_pattern: Optional[str] = Field(None, description="Regex pattern or URL domain/path pattern matching genuine comic panel URLs")
    sample_image_urls: List[str] = Field(default_factory=list, description="Sample comic panel URLs extracted from the page snippet")
    total_sample_images: int = Field(0, description="Total count of sample comic panels extracted in blueprint")
    unwanted_patterns: List[str] = Field(default_factory=list, description="Autonomous list of noise patterns, app download badges, or logos to reject for this site")
    json_path_query: Optional[str] = Field(None, description="JSONPath / key path for dynamic embedded state (e.g. $..chapter.images[*], props.pageProps.images, state.reader.pages)")
    is_infinite_scroll: bool = Field(True, description="True if reader requires progressive scrolling down to trigger dynamic lazy loading")
    is_canvas_or_slice_rendered: bool = Field(False, description="True if comic renders via canvas blobs or dynamic cropped slices")
    is_tile_scrambled: bool = Field(False, description="True if images use scrambled tile DRM matrices (e.g. DMM, Piccoma)")
    requires_anti_hotlink_proxy: bool = Field(True, description="True if referer spoofing is required to load images")
    requires_headless_browser: bool = Field(False, description="True if page requires JavaScript execution/Playwright to load comic panels")
    ad_banner_selectors: List[str] = Field(default_factory=list, description="CSS selectors for promotional ads or watermark images to drop")

    @classmethod
    def sanitize_data(cls, data: Dict[str, Any]) -> Dict[str, Any]:
        """Ensures that null/None values for required defaults are gracefully populated."""
        if not isinstance(data, dict):
            return data
        d = dict(data)
        if not d.get("reading_direction"):
            d["reading_direction"] = "VERTICAL_SCROLL"
        if not d.get("worker_strategy"):
            d["worker_strategy"] = "DOM_DIRECT"
        if not d.get("image_src_attribute"):
            d["image_src_attribute"] = "src"
        if not d.get("status"):
            d["status"] = "Ongoing"
        if not d.get("original_language"):
            d["original_language"] = "en"
        if d.get("genres") is None:
            d["genres"] = []
        if d.get("tags") is None:
            d["tags"] = []
        if d.get("sample_image_urls") is None:
            d["sample_image_urls"] = []
        d["total_sample_images"] = len(d.get("sample_image_urls", []))
        if d.get("unwanted_patterns") is None:
            d["unwanted_patterns"] = []
        if d.get("ad_banner_selectors") is None:
            d["ad_banner_selectors"] = []
        if d.get("requires_anti_hotlink_proxy") is None:
            d["requires_anti_hotlink_proxy"] = True
        if d.get("requires_headless_browser") is None:
            d["requires_headless_browser"] = d.get("worker_strategy") in ("PLAYWRIGHT_FAST", "VISION_SLICER")
        if d.get("is_tile_scrambled") is None:
            d["is_tile_scrambled"] = False
        if d.get("is_infinite_scroll") is None:
            d["is_infinite_scroll"] = True
        if d.get("is_canvas_or_slice_rendered") is None:
            d["is_canvas_or_slice_rendered"] = False
        return d


class ScraperAIOrchestrator:
    """
    Central AI Intelligence Engine for Universal Scraper.
    Transforms raw HTML snippets and URLs into comprehensive comic metadata & dynamic blueprints.
    """

    @classmethod
    def extract_token_optimized_snippet(cls, html: str, max_chars: int = 25000) -> str:
        """
        Extracts high-information HTML tokens (<head> meta, Schema.org, OpenGraph, reader containers, script hydration data)
        while stripping noisy inline CSS, SVGs, and base64 noise.
        """
        if not html:
            return ""

        soup = BeautifulSoup(html[:150000], "html.parser")
        
        # Remove noisy elements
        for tag in soup(["style", "svg", "noscript", "iframe"]):
            tag.decompose()

        # 1. Collect <head> metadata (Meta, OpenGraph, JSON-LD)
        head_parts = []
        if soup.head:
            for meta in soup.head.find_all(["meta", "title", "link", "script"]):
                if meta.name == "script" and meta.get("type") == "application/ld+json":
                    head_parts.append(f"<script type='application/ld+json'>{meta.get_text()[:3000]}</script>")
                elif meta.name in ("meta", "title"):
                    head_parts.append(str(meta))

        # 2. Collect hydration / JSON state scripts & comic state data
        state_parts = []
        for script in soup.find_all("script"):
            s_type = script.get("type", "")
            s_id = script.get("id", "")
            text = script.get_text()
            if not text:
                continue

            # Target key state signals
            is_json_state = (
                "__NEXT_DATA__" in s_id
                or "__NUXT__" in text
                or "window.__INITIAL_STATE__" in text
                or "window.__DATA__" in text
                or "window._comic_data" in text
                or "window.__pinia" in text
                or "application/json" in s_type
            )
            has_comic_image_signals = any(k in text.lower() for k in ["chapter", "pages", "images", "chapter_images", "picture_list", "img_list", "pagelist"])

            if is_json_state or (has_comic_image_signals and len(text) < 10000):
                state_parts.append(f"<script id='{s_id}' type='{s_type}'>{text[:5000]}</script>")

        # 3. Collect reader candidate container outlines & navigation links
        body_parts = []
        if soup.body:
            # Look for navigation links (Next/Prev/Chapters)
            for a in soup.body.find_all("a", limit=30):
                href = a.get("href", "")
                text = a.get_text(strip=True).lower()
                cls_id = f"{a.get('class', '')} {a.get('id', '')}".lower()
                if any(kw in f"{text} {cls_id} {href}" for kw in ["next", "prev", "chapter", "episode", "nav", "btn-next", "btn-prev"]):
                    body_parts.append(f"<a href='{href}' class='{a.get('class', '')}'>{a.get_text(strip=True)[:50]}</a>")

            # Collect candidate reader containers and sample images
            for div in soup.body.find_all(["div", "section", "main", "article", "ul", "picture"], limit=60):
                d_id = div.get("id", "")
                d_class = " ".join(div.get("class", [])) if isinstance(div.get("class"), list) else str(div.get("class", ""))
                imgs = div.find_all(["img", "source", "canvas"], limit=8)
                is_candidate = bool(imgs) or any(k in f"{d_id} {d_class}".lower() for k in [
                    "read", "chapter", "viewer", "comic", "manga", "image", "content", "list", "page", "panel", "webtoon"
                ])
                if is_candidate:
                    img_attrs = []
                    for im in imgs:
                        if im.name == "canvas":
                            img_attrs.append(f"<canvas id='{im.get('id', '')}' class='{im.get('class', '')}' />")
                            continue
                        attrs = {
                            k: v for k, v in im.attrs.items()
                            if k in (
                                "src", "data-url", "data-src", "data-original", "data-original-src",
                                "data-lazy-src", "nitro-lazy-src", "data-cfsrc", "data-actualsrc",
                                "data-echo", "data-srcset", "srcset", "class", "alt", "data-page"
                            )
                        }
                        img_attrs.append(f"<{im.name} {attrs} />")
                    body_parts.append(f"<div id='{d_id}' class='{d_class}'>{''.join(img_attrs)}</div>")

        combined = "\n".join(head_parts + state_parts + body_parts)
        return combined[:max_chars]

    @classmethod
    async def analyze_page(cls, html: str, url: str) -> Optional[UniversalComicBlueprint]:
        """
        Calls Gemini 2.5 Flash to analyze page structure and output a zero-hardcoding UniversalComicBlueprint.
        """
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            logger.debug("[ScraperAIOrchestrator] GEMINI_API_KEY not configured. Skipping AI blueprint.")
            return None

        snippet = cls.extract_token_optimized_snippet(html)
        if not snippet:
            return None

        prompt = f"""
You are the Sonikoma Comic Web Architecture Intelligence Engine.
Analyze this webpage HTML snippet from comic URL: {url}

Your mission:
1. Extract complete Series & Chapter metadata (Title, Slug, Author, Artist, Publisher, Genres, Tags, Synopsis, Cover Poster, Chapter Number, Chapter Title, Next/Prev links, Total Pages if noted).
2. Autonomously discover the exact Comic Reader Architecture with ZERO hardcoding:
   - Identify the CSS selector for the PARENT comic panel container (e.g. '#_imageList', '#readerarea', '.reading-content', 'div.comic-view', '.viewer-cnt', 'div#app-root', '.page-break').
     CRITICAL: Must be the container wrapping multiple panels (e.g. 'div#_imageList' or '#readerarea'), NEVER an individual <img> element.
   - Identify the exact image URL attribute where high-res panels are stored (e.g. 'data-url', 'data-original', 'data-src', 'nitro-lazy-src', 'data-srcset', 'src').
   - Identify the image URL regex pattern or domain pattern matching the story panels (e.g. 'https://webtoon-phinf\\.pstatic\\.net/.*\\.(?:jpg|png|webp)', 'https://cdn\\..*/chapters/.*').
   - Provide 1 to 5 sample full image URLs found in the snippet.
   - If embedded JSON state (Next.js __NEXT_DATA__, Nuxt, etc.) contains image URLs, provide the exact JSONPath query (e.g. '$.props.pageProps.chapter.images[*].url', '$.state.reader.images[*].url').
   - Determine reading direction: 'VERTICAL_SCROLL', 'RIGHT_TO_LEFT', 'LEFT_TO_RIGHT', or 'SLIDESHOW'.
   - Determine optimal worker strategy: 'DOM_DIRECT' (static HTML), 'STATE_JSON' (Next.js/Nuxt state), 'PLAYWRIGHT_FAST' (heavy dynamic SPA / Cloudflare), or 'VISION_SLICER' (encrypted canvas).
   - Indicate if headless browser execution is required in 'requires_headless_browser'.
3. Image Filtering & Autonomous Noise Exclusion Rules:
   - Valid comic image extensions: {', '.join(IMAGE_EXTENSIONS)}
   - Identify site-specific UI icons, app store banners, or tracking noise keywords to drop in 'unwanted_patterns' (e.g. ['pocketcomics', 'app_store', '_nuxt', 'thumb', 'promo', 'banner', 'logo']).
   - NEVER select promotional banners or recommended carousels as the comic reader container.
   - If promotional ads or app store banners are present, list their CSS selectors in 'ad_banner_selectors'.
   - Indicate if the reader is infinite vertical scroll in 'is_infinite_scroll' (true for Webtoons/Comico/Tapas/Manhwa).
   - Indicate if panels are delivered via dynamic sliced strips or canvas in 'is_canvas_or_slice_rendered'.

Respond ONLY with a valid JSON object strictly matching this schema:
{{
  "series_title": string or null,
  "series_slug": string or null,
  "author": string or null,
  "artist": string or null,
  "publisher": string or null,
  "status": "Ongoing" | "Completed" | "Hiatus",
  "genres": string[],
  "tags": string[],
  "synopsis": string or null,
  "cover_image_url": string or null,
  "original_language": string,
  "chapter_number": number or null,
  "chapter_title": string or null,
  "publication_date": string or null,
  "previous_chapter_url": string or null,
  "next_chapter_url": string or null,
  "total_estimated_pages": number or null,
  "reading_direction": "VERTICAL_SCROLL" | "RIGHT_TO_LEFT" | "LEFT_TO_RIGHT" | "SLIDESHOW",
  "worker_strategy": "DOM_DIRECT" | "STATE_JSON" | "PLAYWRIGHT_FAST" | "VISION_SLICER",
  "container_selector": string or null,
  "image_src_attribute": string,
  "image_url_pattern": string or null,
  "sample_image_urls": string[],
  "total_sample_images": number,
  "unwanted_patterns": string[],
  "json_path_query": string or null,
  "is_infinite_scroll": boolean,
  "is_canvas_or_slice_rendered": boolean,
  "is_tile_scrambled": boolean,
  "requires_anti_hotlink_proxy": boolean,
  "requires_headless_browser": boolean,
  "ad_banner_selectors": string[]
}}

HTML Snippet:
{snippet}
"""
        try:
            t0 = time.time()
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=api_key)
            primary_model = os.getenv("GEMINI_MODEL_PRIMARY", "gemini-2.5-flash")
            candidate_models = [primary_model, "gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.5-flash-lite", "gemini-flash-latest", "gemini-2.5-pro"]
            
            # Deduplicate models preserving order
            seen_models = set()
            models_to_try = [m for m in candidate_models if m and not (m in seen_models or seen_models.add(m))]

            raw_text = ""
            selected_model = primary_model

            for model_candidate in models_to_try:
                try:
                    response = client.models.generate_content(
                        model=model_candidate,
                        contents=prompt,
                        config=types.GenerateContentConfig(
                            response_mime_type="application/json",
                            temperature=0.0,
                        )
                    )
                    if response and response.text:
                        raw_text = response.text.strip()
                        selected_model = model_candidate
                        break
                except Exception as ex:
                    ex_str = str(ex)
                    if "429" in ex_str or "RESOURCE_EXHAUSTED" in ex_str or "quota" in ex_str.lower():
                        logger.warning(f"[ScraperAIOrchestrator] Model {model_candidate} quota exhausted (429). Failing over to next model candidate...")
                        continue
                    else:
                        logger.warning(f"[ScraperAIOrchestrator] Model {model_candidate} failed: {ex}. Retrying next candidate...")
                        continue

            if not raw_text:
                logger.error("[ScraperAIOrchestrator] All Gemini model candidates failed or were quota-exhausted.")
                return None

            try:
                data = json.loads(raw_text)
            except json.JSONDecodeError:
                # Sanitize unescaped regex backslashes in LLM JSON output
                cleaned_text = re.sub(r'\\(?![/"\\bfnrtu])', r'\\\\', raw_text)
                try:
                    data = json.loads(cleaned_text, strict=False)
                except Exception:
                    # Strip any markdown code fences if present
                    fence_match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', raw_text)
                    if fence_match:
                        cleaned_fenced = re.sub(r'\\(?![/"\\bfnrtu])', r'\\\\', fence_match.group(1))
                        data = json.loads(cleaned_fenced, strict=False)
                    else:
                        raise

            sanitized = UniversalComicBlueprint.sanitize_data(data)
            blueprint = UniversalComicBlueprint(**sanitized)

            # Auto-fill sample image URLs from HTML if AI did not copy them directly
            if len(blueprint.sample_image_urls) == 0 and html:
                try:
                    samples: List[str] = []
                    attr_name = blueprint.image_src_attribute or "src"
                    
                    # 1. Try container selector with target attribute
                    if blueprint.container_selector:
                        soup_dom = BeautifulSoup(html[:150000], "html.parser")
                        container_el = soup_dom.select_one(blueprint.container_selector)
                        if container_el:
                            for img_tag in container_el.find_all(["img", "source"]):
                                candidate_u = img_tag.get(attr_name) or img_tag.get("data-url") or img_tag.get("data-src") or img_tag.get("src")
                                if candidate_u and candidate_u.startswith("http") and not any(u in candidate_u.lower() for u in blueprint.unwanted_patterns):
                                    if candidate_u not in samples:
                                        samples.append(candidate_u)
                                if len(samples) >= 3:
                                    break
                    
                    # 2. Try regex pattern match across HTML
                    if len(samples) < 3 and blueprint.image_url_pattern:
                        pat = re.compile(blueprint.image_url_pattern, re.IGNORECASE)
                        for match in pat.finditer(html):
                            m_url = match.group(0)
                            if m_url.startswith("http") and not any(u in m_url.lower() for u in blueprint.unwanted_patterns):
                                if m_url not in samples:
                                    samples.append(m_url)
                            if len(samples) >= 3:
                                break

                    if samples:
                        blueprint.sample_image_urls = samples
                        blueprint.total_sample_images = len(samples)
                except Exception as ex:
                    logger.debug(f"[ScraperAIOrchestrator] Sample image auto-fill notice: {ex}")

            latency_ms = int((time.time() - t0) * 1000)
            
            logger.info(
                f"\n{'='*70}\n"
                f"🤖 [AI COMIC INTELLIGENCE REPORT] ({selected_model} • {latency_ms}ms)\n"
                f"{'='*70}\n"
                f"📖 Series Title    : {blueprint.series_title or 'Unknown'}\n"
                f"📑 Chapter Number  : {blueprint.chapter_number} ({blueprint.chapter_title or 'Untitled'})\n"
                f"✍️  Author / Studio : {blueprint.author or 'Unknown'} / {blueprint.publisher or 'Unknown'}\n"
                f"🏷️  Genres & Tags   : {', '.join(blueprint.genres or [])} | {', '.join(blueprint.tags or [])}\n"
                f"🧭 Reading Flow    : {blueprint.reading_direction}\n"
                f"⚙️  Worker Strategy : {blueprint.worker_strategy}\n"
                f"🎯 Container Target: {blueprint.container_selector or 'Auto-detected'}\n"
                f"🖼️  Image Attribute : {blueprint.image_src_attribute}\n"
                f"🔍 Image Pattern   : {blueprint.image_url_pattern or 'None'}\n"
                f"📸 Sample Panels   : {len(blueprint.sample_image_urls)} found\n"
                f"🔗 JSONPath Query  : {blueprint.json_path_query or 'None'}\n"
                f"{'='*70}\n"
            )
            logger.debug(f"[ScraperAIOrchestrator] Full Raw AI Output JSON:\n{json.dumps(data, indent=2)}")
            return blueprint

        except Exception as e:
            logger.warning(f"[ScraperAIOrchestrator] AI analysis failed: {e}")
            return None
