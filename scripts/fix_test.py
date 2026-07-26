import re

with open("backend/tests/test_narrative_fault_tolerance.py", "r") as f:
    content = f.read()

# Fix the token encoding issue
content = content.replace('self.app.dependency_overrides[get_current_user] = lambda: {', 'async def override_get_current_user():\n            return {\n                "id": "test_user_123",\n                "user_id": "test_user_123",\n                "email": "test@test.local",\n                "full_name": "Test User",\n                "creator_role": "creator"\n            }\n        self.app.dependency_overrides[get_current_user] = override_get_current_user\n\n        # remove lambda')

with open("backend/tests/test_narrative_fault_tolerance.py", "w") as f:
    f.write(content)
