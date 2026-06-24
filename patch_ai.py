import re

with open('c:/Users/dheen/project/Sonikoma/backend/python/routes/ai_routes.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Add get_user_gemini_key
header_import = 'from fastapi import Header, HTTPException\n\n'
key_func = '''def get_user_gemini_key(x_user_gemini_key: str = Header(None)):
    if not x_user_gemini_key:
        raise HTTPException(
            status_code=401, 
            detail="MISSING_API_KEY"
        )
    return x_user_gemini_key\n\n'''

if 'get_user_gemini_key' not in content:
    content = content.replace('from fastapi import APIRouter', 'from fastapi import APIRouter, Header, HTTPException')
    content = content.replace('router = APIRouter()', key_func + 'router = APIRouter()')

# Update analyze_image
content = re.sub(
    r'async def analyze_image\(body: AnalyzeImageRequest\):',
    'async def analyze_image(body: AnalyzeImageRequest, user_api_key: str = Depends(get_user_gemini_key)):',
    content
)
content = re.sub(
    r'raw_text = await skill.execute\(model=target_model, image_bytes=img_buffer, tone_hint=tone_hint, narrative_length_hint=narrative_length_hint\)',
    'raw_text = await skill.execute(model=target_model, image_bytes=img_buffer, api_key=user_api_key, tone_hint=tone_hint, narrative_length_hint=narrative_length_hint)',
    content
)
content = re.sub(
    r'except Exception as e:\n(\s*)elapsed = int',
    r'except Exception as e:\n\1if "API_KEY_INVALID" in str(e).upper() or "API KEY NOT VALID" in str(e).upper():\n\1    raise HTTPException(status_code=401, detail="Your API key is invalid.")\n\1elapsed = int',
    content
)

# Update analyze_batch
content = re.sub(
    r'async def analyze_batch\(body: AnalyzeBatchRequest\):',
    'async def analyze_batch(body: AnalyzeBatchRequest, user_api_key: str = Depends(get_user_gemini_key)):',
    content
)
content = re.sub(
    r'(raw_text = await skill\.execute\(model=target_model,\s*image_bytes=img_buffer,)( tone_hint=tone_hint,\s*narrative_length_hint=narrative_length_hint\))',
    r'\g<1> api_key=user_api_key,\g<2>',
    content
)
content = re.sub(
    r'except Exception as e:\n(\s*)logger\.warning\(\f"\[Batch\] Failed \{url\[:50\]\}: \{e\}"\)',
    r'except Exception as e:\n\1if "API_KEY_INVALID" in str(e).upper() or "API KEY NOT VALID" in str(e).upper():\n\1    raise HTTPException(status_code=401, detail="Your API key is invalid.")\n\1logger.warning(f"[Batch] Failed {url[:50]}: {e}")',
    content
)

# Update analyze_sequence
content = re.sub(
    r'async def analyze_sequence\(body: AnalyzeSequenceRequest\):',
    'async def analyze_sequence(body: AnalyzeSequenceRequest, user_api_key: str = Depends(get_user_gemini_key)):',
    content
)
content = re.sub(
    r'api_key = os\.getenv\("GEMINI_API_KEY"\)\n\s*client = genai\.Client\(api_key=api_key\)',
    'client = genai.Client(api_key=user_api_key)',
    content
)
content = re.sub(
    r'except Exception as e:\n(\s*)logger\.error\(f"\[Sequence\] Analysis failed: \{e\}"',
    r'except Exception as e:\n\1if "API_KEY_INVALID" in str(e).upper() or "API KEY NOT VALID" in str(e).upper():\n\1    raise HTTPException(status_code=401, detail="Your API key is invalid.")\n\1logger.error(f"[Sequence] Analysis failed: {e}"',
    content
)

# Update run_md_skill
content = re.sub(
    r'async def run_md_skill\(skill_name: str, model: str, \*\*kwargs\) -> Dict\[str, Any\]:',
    'async def run_md_skill(skill_name: str, model: str, api_key: str = None, **kwargs) -> Dict[str, Any]:',
    content
)
content = re.sub(
    r'raw_text = await skill\.execute\(model=model, \*\*kwargs\)',
    'raw_text = await skill.execute(model=model, api_key=api_key, **kwargs)',
    content
)
content = re.sub(
    r'except Exception as e:\n(\s*)logger\.error',
    r'except Exception as e:\n\1if "API_KEY_INVALID" in str(e).upper() or "API KEY NOT VALID" in str(e).upper():\n\1    raise HTTPException(status_code=401, detail="Your API key is invalid.")\n\1logger.error',
    content
)

# Update all endpoints calling run_md_skill
content = re.sub(
    r'async def ([a-zA-Z0-9_]+)\(([a-zA-Z0-9_]+):\s*([a-zA-Z0-9_]+)\):\n(\s*)return await run_md_skill\((.*?),\s*\2\.model,',
    r'async def \1(\2: \3, user_api_key: str = Depends(get_user_gemini_key)):\n\4return await run_md_skill(\5, \2.model, api_key=user_api_key,',
    content
)

# Also fix the endpoints that have `current_user` or `request` etc
content = re.sub(
    r'async def translate_script\(\n\s*body: TranslationRequest,\n\s*request: Request,\n\s*current_user: dict = Depends\(get_current_user\)\n\):',
    'async def translate_script(\n    body: TranslationRequest,\n    request: Request,\n    current_user: dict = Depends(get_current_user),\n    user_api_key: str = Depends(get_user_gemini_key)\n):',
    content
)
content = re.sub(
    r'return await run_md_skill\("translation", body\.model, text=body\.text, target_lang=body\.target_lang\)',
    'return await run_md_skill("translation", body.model, api_key=user_api_key, text=body.text, target_lang=body.target_lang)',
    content
)

with open('c:/Users/dheen/project/Sonikoma/backend/python/routes/ai_routes.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("Patched ai_routes.py successfully!")
