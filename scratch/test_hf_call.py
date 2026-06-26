import os
import requests
from dotenv import load_dotenv

# Load env variables
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
load_dotenv(dotenv_path=os.path.join(PROJECT_ROOT, ".env"))

api_key = os.getenv("HUGGINGFACE_API_KEY")
print("HF API Key found:", bool(api_key))

model_id = "BAAI/bge-small-en-v1.5"
url = f"https://api-inference.huggingface.co/models/{model_id}"
headers = {"Authorization": f"Bearer {api_key}"}
prompt = "Explain the concept of Webtoons in three short sentences."

try:
    print(f"Calling HF API at {url}...")
    r = requests.post(url, json={"inputs": prompt, "parameters": {"max_new_tokens": 50}}, headers=headers)
    print("Status code:", r.status_code)
    print("Headers:", r.headers)
    print("Response text:", r.text)
except Exception as e:
    print("Error:", e)
