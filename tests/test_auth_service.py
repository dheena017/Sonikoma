import os
import sys
import unittest

sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend', 'app'))

from services.auth.auth_service import AuthService


class FakeUserRepository:
    def __init__(self):
        self.api_key_calls = []
        self.user_id_calls = []

    def get_user_by_api_key(self, token):
        self.api_key_calls.append(token)
        return {"id": "api-user"} if token == "av_live_abc" else None

    def get_user_by_id(self, user_id):
        self.user_id_calls.append(user_id)
        return {"id": user_id} if user_id == "jwt-user" else None


class AuthServiceTests(unittest.TestCase):
    def test_authenticates_api_key_via_repository(self):
        repo = FakeUserRepository()
        service = AuthService(user_repo=repo)

        user = service.authenticate_token("av_live_abc")

        self.assertEqual(user["id"], "api-user")
        self.assertEqual(repo.api_key_calls, ["av_live_abc"])

    def test_authenticates_jwt_via_repository(self):
        repo = FakeUserRepository()
        service = AuthService(
            user_repo=repo,
            jwt_decoder=lambda token, secret, algorithms: {"sub": "jwt-user"},
        )

        user = service.authenticate_token("jwt-token")

        self.assertEqual(user["id"], "jwt-user")
        self.assertEqual(repo.user_id_calls, ["jwt-user"])


if __name__ == "__main__":
    unittest.main()
