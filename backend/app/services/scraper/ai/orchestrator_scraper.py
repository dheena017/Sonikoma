"""
backend/app/services/scraper/ai/orchestrator_scraper.py
─────────────────────────────────────────────────────────────────────────────
Autonomous AI Comic Intelligence & Scraper Orchestrator.
Positioned strictly as an architectural Planner (not raw scraper) via Gemini 2.5 Flash.
Features:
  1. DOMReductionEngine: Distills 500 KB - 2 MB HTML into a 1-3 KB structural digest.
  2. BlueprintValidator: Tests proposed AI selectors against actual DOM before persistence.
  3. AI Circuit Breaker: Automatically prevents cascading failures with rate-limiting cooldown.
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
        if not d.get("reading_direction"): d["reading_direction"] = "VERTICAL_SCROLL"
        if not d.get("worker_strategy"): d["worker_strategy"] = "DOM_DIRECT"
        if not d.get("image_src_attribute"): d["image_src_attribute"] = "src"
        if not d.get("status"): d["status"] = "Ongoing"
        if not d.get("original_language"): d["original_language"] = "en"
        if d.get("genres") is None: d["genres"] = []
        if d.get("tags") is None: d["tags"] = []
        if d.get("sample_image_urls") is None: d["sample_image_urls"] = []
        d["total_sample_images"] = len(d.get("sample_image_urls", []))
        if d.get("unwanted_patterns") is None: d["unwanted_patterns"] = []
        if d.get("ad_banner_selectors") is None: d["ad_banner_selectors"] = []
        if d.get("requires_anti_hotlink_proxy") is None: d["requires_anti_hotlink_proxy"] = True
        if d.get("requires_headless_browser") is None:
            d["requires_headless_browser"] = d.get("worker_strategy") in ("PLAYWRIGHT_FAST", "VISION_SLICER")
        if d.get("is_tile_scrambled") is None: d["is_tile_scrambled"] = False
        if d.get("is_infinite_scroll") is None: d["is_infinite_scroll"] = True
        if d.get("is_canvas_or_slice_rendered") is None: d["is_canvas_or_slice_rendered"] = False
        return d


class DOMReductionEngine:
    """
    Compresses raw 500 KB - 2 MB HTML documents into a 1-3 KB structural digest
    containing only relevant reader candidate regions, image attributes, and script keys.
    Dramatically reduces Gemini token consumption and latency.
    """

    @classmethod
    def build_structural_digest(cls, html: str, url: str, max_chars: int = 4000) -> str:
        if not html:
            return f"URL: {url}\n(Empty HTML)"

        soup = BeautifulSoup(html[:120000], "html.parser")

        # Decompose non-relevant markup
        for tag in soup(["style", "svg", "noscript", "iframe", "footer", "nav", "header", "form"]):
            tag.decompose()

        # 1. Meta / OpenGraph metadata
        meta_items = []
        if soup.head:
            title_el = soup.head.find("title")
            if title_el:
                meta_items.append(f"Title: {title_el.get_text(strip=True)}")
            for m in soup.head.find_all("meta"):
                p = m.get("property") or m.get("name") or ""
                c = m.get("content") or ""
                if any(k in p.lower() for k in ("og:title", "og:image", "og:description", "author", "comic", "chapter")):
                    meta_items.append(f"{p}: {c[:100]}")

        # 2. Embedded State Scripts
        script_summaries = []
        for s in soup.find_all("script"):
            s_id = s.get("id", "")
            s_text = s.get_text() or ""
            if any(k in s_text for k in ("__NEXT_DATA__", "__NUXT__", "window.__INITIAL_STATE__", "chapter_images", "picture_list")):
                keys = re.findall(r'"([a-zA-Z0-9_-]+)":', s_text[:1000])[:15]
                script_summaries.append(f"Script #{s_id}: keys={keys}")

        # 3. Candidate Reader Containers
        candidate_containers = []
        for el in soup.find_all(["div", "section", "main", "article", "ul"], limit=40):
            el_id = el.get("id", "")
            el_class = ".".join(el.get("class", [])) if isinstance(el.get("class"), list) else str(el.get("class", ""))
            imgs = el.find_all(["img", "source", "canvas"], limit=6)
            if len(imgs) >= 1 or any(k in f"{el_id} {el_class}".lower() for k in ("read", "chapter", "viewer", "comic", "manga", "content", "page", "image", "panel")):
                # Collect attributes present on the images
                sample_attrs = set()
                sample_srcs = []
                for im in imgs:
                    for attr_name in im.attrs:
                        if attr_name in ("src", "data-src", "data-lazy-src", "data-original", "nitro-lazy-src", "data-url", "data-echo"):
                            sample_attrs.add(attr_name)
                            val = im.attrs[attr_name]
                            if val and val.startswith("http") and len(sample_srcs) < 3:
                                sample_srcs.append(val[:80])

                tag_id_str = f"#{el_id}" if el_id else ""
                tag_cls_str = f".{el_class}" if el_class else ""
                selector_hint = f"{el.name}{tag_id_str}{tag_cls_str}"
                candidate_containers.append(
                    f"Container: {selector_hint} | Images inside: {len(imgs)} | Image attrs: {list(sample_attrs)} | Sample URLs: {sample_srcs}"
                )

        digest = (
            f"=== TARGET URL ===\n{url}\n\n"
            f"=== META ===\n" + "\n".join(meta_items[:6]) + "\n\n"
            f"=== STATE SCRIPTS ===\n" + ("\n".join(script_summaries[:3]) if script_summaries else "None") + "\n\n"
            f"=== CANDIDATE READER CONTAINERS ===\n" + ("\n".join(candidate_containers[:10]) if candidate_containers else "None")
        )
        return digest[:max_chars]


class BlueprintValidator:
    """
    Validates proposed AI blueprints against the actual DOM to prevent
    hallucinated selectors, non-existent attributes, or empty extraction results.
    """

    @classmethod
    def validate_blueprint(
        cls,
        blueprint: UniversalComicBlueprint,
        html: str
    ) -> Tuple[bool, str, int]:
        """
        Tests blueprint selectors on the HTML.
        Returns (is_valid, reason, discovered_images_count).
        """
        if not html:
            return False, "HTML is empty", 0

        soup = BeautifulSoup(html[:150000], "html.parser")
        selector = blueprint.container_selector
        src_attr = blueprint.image_src_attribute or "src"

        # 1. Test Container Selector
        container = None
        if selector:
            try:
                container = soup.select_one(selector)
            except Exception as e:
                return False, f"Invalid CSS selector syntax '{selector}': {e}", 0

        if not container:
            # Fallback test: check if image_url_pattern or sample images match directly in HTML
            if blueprint.sample_image_urls and len(blueprint.sample_image_urls) > 0:
                valid_samples = [u for u in blueprint.sample_image_urls if u in html and u.startswith("http")]
                if len(valid_samples) > 0:
                    return True, "Accepted via verified sample URL matches", len(valid_samples)
            return False, f"Container selector '{selector}' not found in DOM", 0

        # 2. Count image nodes inside container
        img_nodes = container.find_all(["img", "source", "canvas"])
        if not img_nodes:
            return False, f"Container '{selector}' exists but contains 0 <img> or <source> elements", 0

        valid_urls = []
        for im in img_nodes:
            raw_url = im.get(src_attr) or im.get("data-src") or im.get("data-original") or im.get("data-lazy-src") or im.get("src")
            if raw_url and isinstance(raw_url, str) and raw_url.startswith("http") and not raw_url.startswith("data:image/svg"):
                valid_urls.append(raw_url)

        if not valid_urls and not blueprint.is_canvas_or_slice_rendered:
            return False, f"Container '{selector}' has {len(img_nodes)} image tags, but none have valid URLs under attribute '{src_attr}'", 0

        return True, "Blueprint verified against DOM", len(valid_urls)


class ScraperAIOrchestrator:
    """
    Central AI Planning Engine for the Universal Scraper.
    Uses Gemini 2.5 Flash strictly as an Architectural Planner to produce validated blueprints.
    """

    _consecutive_failures: int = 0
    _circuit_open_until: float = 0.0

    @classmethod
    def is_circuit_open(cls) -> bool:
        return time.time() < cls._circuit_open_until

    @classmethod
    def record_gemini_success(cls):
        cls._consecutive_failures = 0

    @classmethod
    def record_gemini_failure(cls):
        cls._consecutive_failures += 1
        if cls._consecutive_failures >= 3:
            cls._circuit_open_until = time.time() + 60.0  # 60 second circuit breaker cooldown
            logger.warning(f"[ScraperAIOrchestrator] Circuit breaker OPEN for 60s due to {cls._consecutive_failures} consecutive Gemini failures.")

    @classmethod
    async def analyze_page(cls, html: str, url: str) -> Optional[UniversalComicBlueprint]:
        """
        Generates a token-reduced digest and prompts Gemini 2.5 Flash for extraction directives.
        Validates the generated blueprint before returning.
        """
        if cls.is_circuit_open():
            logger.info("[ScraperAIOrchestrator] AI Circuit is open (cooling down). Skipping Gemini call.")
            return None

        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            return None

        # Build compact 1-3 KB structural digest
        digest = DOMReductionEngine.build_structural_digest(html, url)
        if not digest:
            return None

        prompt = f"""
You are the Sonikoma Comic Web Architecture Planner.
Analyze this compact structural digest of a comic webpage ({url}):

{digest}

Your task: Return a JSON extraction plan answering:
1. Series & Chapter Metadata: series_title, series_slug, author, genres, synopsis, cover_image_url, chapter_number, chapter_title.
2. Reader Architecture:
   - 'container_selector': CSS selector for the main reader container wrapping panels (e.g. '#readerarea', '.reading-content', '#_imageList', 'div.comic-view').
   - 'image_src_attribute': the primary attribute holding high-res image URLs ('data-src', 'data-original', 'src', 'nitro-lazy-src', 'data-url').
   - 'reading_direction': 'VERTICAL_SCROLL', 'RIGHT_TO_LEFT', 'LEFT_TO_RIGHT', or 'SLIDESHOW'.
   - 'worker_strategy': 'DOM_DIRECT', 'STATE_JSON', 'PLAYWRIGHT_FAST', or 'VISION_SLICER'.
   - 'sample_image_urls': 1 to 5 sample image URLs verified in the digest.
   - 'unwanted_patterns': noise keywords to reject (e.g. ['logo', 'banner', 'thumb', 'promo']).
   - 'is_infinite_scroll': true or false.

Respond ONLY with a valid JSON object matching the UniversalComicBlueprint schema.
"""

        t0 = time.time()
        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=api_key)
            response = await asyncio.to_thread(
                client.models.generate_content,
                model="gemini-2.5-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.1,
                    max_output_tokens=1500,
                )
            )

            raw_json = response.text.strip()
            if raw_json.startswith("```json"):
                raw_json = raw_json[7:]
            if raw_json.startswith("```"):
                raw_json = raw_json[3:]
            if raw_json.endswith("```"):
                raw_json = raw_json[:-3]

            parsed_data = json.loads(raw_json.strip())
            sanitized = UniversalComicBlueprint.sanitize_data(parsed_data)
            blueprint = UniversalComicBlueprint(**sanitized)

            # Validate blueprint against real DOM
            is_valid, val_reason, val_count = BlueprintValidator.validate_blueprint(blueprint, html)
            duration_ms = (time.time() - t0) * 1000.0

            if is_valid:
                cls.record_gemini_success()
                logger.info(f"[ScraperAIOrchestrator] Generated validated blueprint for {url} in {duration_ms:.1f}ms: {val_reason} ({val_count} images)")
                return blueprint
            else:
                logger.warning(f"[ScraperAIOrchestrator] Gemini blueprint rejected by BlueprintValidator: {val_reason}")
                return None

        except Exception as e:
            cls.record_gemini_failure()
            logger.warning(f"[ScraperAIOrchestrator] Gemini analysis error for {url}: {e}")
            return None
