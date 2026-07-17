import os
import sys
import asyncio
from dotenv import load_dotenv

# Load environment
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
load_dotenv(dotenv_path=os.path.join(PROJECT_ROOT, ".env"))

# Add backend/python to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from config.clients import ai_initialized
from services.ai.facade import validate_analysis
from services.ai.skills.registry import registry
import json

async def test():
    print("AI Initialized:", ai_initialized)
    if not ai_initialized:
        print("Gemini client not initialized. Check GEMINI_API_KEY.")
        return

    # Let's try to generate a mock image
    # 1x1 red PNG bytes:
    img_bytes = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc` \x00\x00\x00\x03\x00\x01\xa0\xac\x01\x1e\x00\x00\x00\x00IEND\xaeB`\x82'

    # Try testing panel_analysis skill loaded from markdown
    try:
        panel_skill = registry.get("panel_analysis")
        print(f"Retrieved panel_analysis skill successfully: model={panel_skill.default_model}")
        
        # Test building prompt template
        test_prompt = panel_skill.build_prompt(tone_hint=" The panel appears dark or moody.")
        print("Built prompt template preview:")
        print("---")
        print(test_prompt)
        print("---")
        
        # Run test execution
        print("\nExecuting panel analysis against Gemini...")
        response_text = await panel_skill.execute(model="gemini-2.5-flash", image_bytes=img_bytes, tone_hint=" The panel appears dark or moody.")
        print("Raw AI response:")
        print(response_text)
        
        # Validate JSON parsing
        parsed = json.loads(response_text)
        validated = validate_analysis(parsed)
        print("\nValidated output dictionary:")
        print(validated)
        
    except Exception as e:
        print(f"Error during panel analysis execution: {e}")

    # Test executing another skill like title_ab_tester
    try:
        print("\nTesting title_ab_tester skill...")
        title_skill = registry.get("title_ab_tester")
        ab_response = await title_skill.execute(title="Solo Leveling Reborn", key_climax_event="S-Rank hunter awakens his shadow army")
        print("Title generator output:")
        print(ab_response)
    except Exception as e:
        print(f"Error executing title_ab_tester: {e}")

if __name__ == "__main__":
    asyncio.run(test())
