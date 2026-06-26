import os
import requests
from dotenv import load_dotenv

# Load env variables
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
load_dotenv(dotenv_path=os.path.join(PROJECT_ROOT, ".env"))

api_key = os.getenv("HUGGINGFACE_API_KEY")
print("HF API Key found:", bool(api_key))

test_models = [
    "Qwen/Qwen2.5-7B-Instruct",
    "Qwen/Qwen2.5-1.5B-Instruct",
    "meta-llama/Llama-3.2-1B-Instruct",
    "meta-llama/Llama-3.2-3B-Instruct",
    "mistralai/Mistral-7B-Instruct-v0.3",
    "google/gemma-2-2b-it",
    "microsoft/Phi-3-mini-4k-instruct"
]

headers = {"Authorization": f"Bearer {api_key}"}
prompt = "Say: OK"

print("Testing Hugging Face models...")
print("-" * 60)

for model in test_models:
    url = f"https://api-inference.huggingface.co/models/{model}"
    try:
        r = requests.post(url, json={"inputs": prompt, "parameters": {"max_new_tokens": 10}}, headers=headers)
        if r.status_code == 200:
            print(f"✅ {model:40} : SUCCESS (HTTP 200)")
        elif r.status_code == 503:
            print(f"⏳ {model:40} : LOADING (HTTP 503 - Model is loading)")
        else:
            print(f"❌ {model:40} : FAILED (HTTP {r.status_code}) - {r.text[:50]}")
    except Exception as e:
        print(f"❌ {model:40} : Error: {e}")

print("-" * 60)
