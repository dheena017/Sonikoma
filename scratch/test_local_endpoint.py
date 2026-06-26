import requests

url = "http://127.0.0.1:5173/api/test-model-latency"
payload = {
    "provider": "Google Gemini",
    "model": "BAAI/bge-small-en-v1.5",
    "apiKey": "some-key",
    "prompt": "Test"
}

try:
    print(f"Calling local backend at {url}...")
    r = requests.post(url, json=payload)
    print("Status code:", r.status_code)
    print("Response JSON:", r.json())
except Exception as e:
    print("Error:", e)
