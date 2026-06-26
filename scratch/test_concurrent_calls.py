import asyncio
import time
import requests

url = "http://127.0.0.1:5173/api/test-model-latency"

models_to_test = [
    "gemini-1.5-flash",
    "gemini-2.0-flash",
    "gemini-2.5-flash"
]

def make_call(model_name):
    payload = {
        "provider": "Google Gemini",
        "model": model_name,
        "apiKey": "",  # Fallback to server key
        "prompt": "Say: OK"
    }
    start = time.monotonic()
    try:
        r = requests.post(url, json=payload)
        elapsed = time.monotonic() - start
        return f"{model_name}: Status {r.status_code} | Took {elapsed:.2f}s | Response: {r.json()}"
    except Exception as e:
        return f"{model_name}: Error: {e}"

async def run_test():
    loop = asyncio.get_running_loop()
    print("Launching concurrent calls to local API server...")
    tasks = [
        loop.run_in_executor(None, make_call, m)
        for m in models_to_test
    ]
    results = await asyncio.gather(*tasks)
    print("\nResults:")
    for res in results:
        print(res)

if __name__ == "__main__":
    asyncio.run(run_test())
