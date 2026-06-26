import requests
import time

url = "http://127.0.0.1:5173/api/test-model-latency"

free_models = [
    "gemini-3.5-flash",
    "gemini-3.1-flash-lite",
    "gemini-3.1-flash-lite-preview",
    "gemini-3-flash-preview",
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-1.5-flash",
    "gemini-1.5-flash-8b",
    "nano-banana-pro-preview",
    "gemma-4-31b-it",
    "gemma-4-26b-a4b-it"
]

print("Benchmarking all free Google Gemini models...")
print("-" * 60)

for model in free_models:
    payload = {
        "provider": "gemini",
        "model": model,
        "apiKey": "",
        "prompt": "Say: OK"
    }
    
    start_time = time.monotonic()
    try:
        r = requests.post(url, json=payload)
        elapsed = time.monotonic() - start_time
        if r.status_code == 200:
            res_data = r.json()
            if res_data.get("success"):
                response_txt = res_data.get('response', '').strip().replace('\n', ' ')
                print(f"[SUCCESS] {model:25} | Latency: {res_data.get('latencyMs')}ms | Response: {response_txt}")
            else:
                err = res_data.get("error", "")
                if "RESOURCE_EXHAUSTED" in err:
                    print(f"[EXHAUSTED] {model:25} | 429 Rate Limit")
                elif "NOT_FOUND" in err or "404" in err:
                    print(f"[UNSUPPORTED] {model:25} | 404 Not Found")
                else:
                    print(f"[FAILED] {model:25} | Error: {err[:80]}")
        else:
            print(f"[HTTP ERROR] {model:25} | Status Code {r.status_code}")
    except Exception as e:
        print(f"[ERROR] {model:25} | Connection Error: {e}")

print("-" * 60)
