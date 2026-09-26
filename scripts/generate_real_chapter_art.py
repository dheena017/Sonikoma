"""
scripts/generate_real_chapter_art.py
─────────────────────────────────────────────────────────────────────────────
Generates REAL AI artwork for all panels of a chapter using Pollinations.ai,
with polite rate limiting and retry handling.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import sys
import asyncio
import sqlite3
import urllib.parse
import uuid
import httpx

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
LOCAL_MEDIA_DIR = os.path.join(PROJECT_ROOT, "data", "local_media")
DB_PATH = os.path.join(PROJECT_ROOT, "data", "webtoon_local.db")

os.makedirs(LOCAL_MEDIA_DIR, exist_ok=True)


async def fetch_image(prompt: str, width: int = 768, height: int = 1024, style: str = "comic") -> bytes:
    enhanced = f"modern anime comic art, dynamic lighting, sharp focus, {prompt}"
    encoded = urllib.parse.quote(enhanced)
    url = f"https://image.pollinations.ai/prompt/{encoded}?width={width}&height={height}&nologo=true"

    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
    
    for attempt in range(1, 6):
        try:
            async with httpx.AsyncClient(timeout=45.0) as client:
                resp = await client.get(url, headers=headers)
                if resp.status_code == 200 and len(resp.content) > 3000:
                    return resp.content
                elif resp.status_code == 429:
                    print(f"    [Rate Limited 429] Waiting 3s before retry {attempt}...", flush=True)
                    await asyncio.sleep(3.0)
                else:
                    print(f"    [Attempt {attempt}] HTTP {resp.status_code}. Retrying...", flush=True)
                    await asyncio.sleep(2.0)
        except Exception as e:
            print(f"    [Attempt {attempt}] Error: {e}. Retrying in 2.5s...", flush=True)
            await asyncio.sleep(2.5)

    return None


async def process_chapter(chapter_id: str):
    print(f"\n=======================================================", flush=True)
    print(f"Generating REAL AI Art for Chapter: {chapter_id}", flush=True)
    print(f"=======================================================", flush=True)

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute(
        "SELECT id, panel_index, narrative, speech_text FROM panels WHERE chapter_id = ? ORDER BY panel_index",
        (chapter_id,)
    )
    panels = c.fetchall()
    conn.close()

    if not panels:
        print(f"No panels found for chapter {chapter_id}")
        return

    print(f"Found {len(panels)} panels to generate.", flush=True)

    for p_id, p_idx, narr, speech in panels:
        clean_speech = (speech or "").replace("Kaito:", "").replace("Jax:", "").replace("Aether:", "").strip()
        desc = narr or clean_speech or f"Dramatic cyber sci-fi anime scene panel {p_idx + 1}"
        prompt = f"cyberpunk anime scene, {desc}"
        
        print(f"Panel #{p_idx + 1}: '{desc[:50]}...'", flush=True)
        img_bytes = await fetch_image(prompt, width=768, height=1024, style="comic")

        if img_bytes:
            filename = f"gen_panel_{uuid.uuid4().hex[:10]}.webp"
            filepath = os.path.join(LOCAL_MEDIA_DIR, filename)
            with open(filepath, "wb") as f:
                f.write(img_bytes)

            pub_url = f"/media/{filename}"
            conn = sqlite3.connect(DB_PATH)
            conn.cursor().execute("UPDATE panels SET image_url = ? WHERE id = ?", (pub_url, p_id))
            conn.commit()
            conn.close()
            print(f"  -> SUCCESS! Saved to {pub_url} ({len(img_bytes)} bytes)\n", flush=True)
        else:
            print(f"  -> Skipped panel {p_idx + 1} (could not fetch from network)\n", flush=True)

        # Polite 2-second rate limit buffer between calls
        await asyncio.sleep(2.0)

    print(f"Finished generating real artwork for {chapter_id}!", flush=True)


async def main():
    target = sys.argv[1] if len(sys.argv) > 1 else "ser_e45ae9ea83_ch10"
    await process_chapter(target)


if __name__ == "__main__":
    asyncio.run(main())
