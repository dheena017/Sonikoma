import os
import sys
from dotenv import load_dotenv

# Load env variables
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
load_dotenv(dotenv_path=os.path.join(PROJECT_ROOT, ".env"))

api_key = os.getenv("GEMINI_API_KEY")
print("API Key found:", bool(api_key))

try:
    from google import genai
    client = genai.Client(api_key=api_key)
    print("Attempting to call client.models.generate_content...")
    response = client.models.generate_content(
        model="BAAI/bge-small-en-v1.5",
        contents="Explain the concept of Webtoons in three short sentences."
    )
    print("Response text:", response.text)
except Exception as e:
    print("Caught exception type:", type(e))
    print("String representation:", str(e))
    print("Repr:", repr(e))
