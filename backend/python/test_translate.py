import os
import sys
import asyncio
from dotenv import load_dotenv

# Load environment
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
load_dotenv(dotenv_path=os.path.join(PROJECT_ROOT, ".env"))

# Add backend/python to path
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from skills.registry import registry

async def main():
    try:
        skill = registry.get("translation")
        text = "Arise. The shadow army obeys my command."
        print(f"Translating to Tamil: '{text}'")
        res = await skill.execute(text=text, target_lang="Tamil")
        print("\nAI Response:")
        print(res)
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
