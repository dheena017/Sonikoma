import logging
from typing import Any, Callable, Optional

import jwt

from core.security import SECRET_KEY, ALGORITHM

logger = logging.getLogger("sonikoma.services.auth")


class AuthService:
    def __init__(self, user_repo=None, jwt_decoder=None):
        self.user_repo = user_repo or self._default_user_repo()
        self.jwt_decoder = jwt_decoder or self._default_jwt_decoder()

    def _default_user_repo(self):
        from repositories.user import get_user_by_api_key, get_user_by_id

        return type(
            "_UserRepositoryAdapter",
            (),
            {
                "get_user_by_api_key": staticmethod(get_user_by_api_key),
                "get_user_by_id": staticmethod(get_user_by_id),
            },
        )()

    def _default_jwt_decoder(self):
        def _decode(token: str, secret: str, algorithms: list[str]):
            return jwt.decode(token, secret, algorithms=algorithms)

        return _decode

    def authenticate_token(self, token: Optional[str], *, secret: str = SECRET_KEY, algorithms: Optional[list[str]] = None) -> Optional[dict[str, Any]]:
        if not token or not isinstance(token, str):
            return None

        if token.startswith("av_live_"):
            return self.user_repo.get_user_by_api_key(token)

        try:
            payload = self.jwt_decoder(token, secret, algorithms or [ALGORITHM])
        except jwt.PyJWTError:
            return None

        user_id = payload.get("sub")
        if not user_id:
            return None

        return self.user_repo.get_user_by_id(user_id)
