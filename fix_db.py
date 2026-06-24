import re

with open("backend/python/database/db.py", "r") as f:
    content = f.read()

# Fix the broken else block
broken_block = """        # 6. AI Voices Preference
        voice_pref = prefs.get('voiceActor', 'Matthew')
        voices = {"Matthew": 0, "Rachel": 0, "Marcus": 0}
            voices["Rachel"] = 30
            voices["Marcus"] = 10
            
        # 7. Narration Mode
        narrations = {"Storyteller Badges": 85, "Snappy Subtitles": 15}"""

fixed_block = """        # 6. AI Voices Preference
        voice_pref = prefs.get('voiceActor', 'Matthew')
        voices = {"Matthew": 0, "Rachel": 0, "Marcus": 0}
        if total_chaps > 0 and voice_pref in voices:
            voices[voice_pref] = 100
            
        # 7. Narration Mode
        narrations = {"Storyteller Badges": 0, "Snappy Subtitles": 0}
        if total_chaps > 0:
            narrations["Storyteller Badges"] = 100"""

if broken_block in content:
    content = content.replace(broken_block, fixed_block)
else:
    print("Could not find the broken block exactly. Using regex.")
    content = re.sub(
        r"# 6\. AI Voices Preference.*?# 8\. Activity feed",
        fixed_block + "\n        \n        # 8. Activity feed",
        content,
        flags=re.DOTALL
    )

with open("backend/python/database/db.py", "w") as f:
    f.write(content)

print("Fixed db.py")
