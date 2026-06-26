import os
from dotenv import load_dotenv

# Load env variables
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
load_dotenv(dotenv_path=os.path.join(PROJECT_ROOT, ".env"))

api_key = os.getenv("GEMINI_API_KEY")

try:
    from google import genai
    client = genai.Client(api_key=api_key)
    print("Available Gemini Models:")
    print("-" * 60)
    for m in client.models.list():
        supported = "Yes" if "generateContent" in getattr(m, "supported_actions", []) else "No"
        print(f"Name: {m.name:35} | Actions: {getattr(m, 'supported_actions', [])}")
    print("-" * 60)
except Exception as e:
    print("Error:", e)
