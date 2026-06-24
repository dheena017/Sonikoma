import re

with open('c:/Users/dheen/project/Sonikoma/backend/python/routes/ai_routes.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Add get_all_user_keys
deps = '''def get_all_user_keys(
    x_user_gemini_key: str = Header(None),
    x_user_openai_key: str = Header(None),
    x_user_anthropic_key: str = Header(None),
    x_user_huggingface_key: str = Header(None),
):
    return {
        "gemini": x_user_gemini_key,
        "openai": x_user_openai_key,
        "anthropic": x_user_anthropic_key,
        "huggingface": x_user_huggingface_key,
    }

'''

if 'get_all_user_keys' not in content:
    content = content.replace('def get_user_gemini_key', deps + 'def get_user_gemini_key')

# Update api_list_models
content = re.sub(
    r'async def api_list_models\(body: Optional\[ListModelsRequest\] = None\):',
    'async def api_list_models(body: Optional[ListModelsRequest] = None, user_keys: dict = Depends(get_all_user_keys)):',
    content
)

list_models_fallback = '''
        else:
            # Fallback to headers
            api_key = user_keys.get(provider)
            # Fallback to server config keys
            if not api_key:
                if provider == "huggingface":
                    api_key = os.getenv("HUGGINGFACE_API_KEY")
                elif provider == "openai":
                    api_key = os.getenv("OPENAI_API_KEY")
                elif provider == "anthropic":
                    api_key = os.getenv("ANTHROPIC_API_KEY")
                else:
                    api_key = os.getenv("GEMINI_API_KEY")
'''
content = re.sub(
    r'\s*else:\n\s*# Fallback to server config keys.*?(?=\s*if not api_key:)',
    list_models_fallback,
    content,
    flags=re.DOTALL,
    count=1
)


# Update test_model_latency
content = re.sub(
    r'async def test_model_latency\(body: TestModelLatencyRequest\):',
    'async def test_model_latency(body: TestModelLatencyRequest, user_keys: dict = Depends(get_all_user_keys)):',
    content
)

test_latency_fallback = '''
    else:
        # Fallback to headers
        api_key = user_keys.get(provider)
        # Fallback to env
        if not api_key:
            if provider == "huggingface":
                api_key = os.getenv("HUGGINGFACE_API_KEY")
            elif provider == "openai":
                api_key = os.getenv("OPENAI_API_KEY")
            elif provider == "anthropic":
                api_key = os.getenv("ANTHROPIC_API_KEY")
            else:
                api_key = os.getenv("GEMINI_API_KEY")
'''
content = re.sub(
    r'\s*else:\n\s*# Fallback to env.*?(?=\s*if not api_key:)',
    test_latency_fallback,
    content,
    flags=re.DOTALL,
    count=1
)

with open('c:/Users/dheen/project/Sonikoma/backend/python/routes/ai_routes.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("Patched ai_routes.py for multiple keys successfully!")
