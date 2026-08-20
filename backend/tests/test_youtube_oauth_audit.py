import time
import pytest
from app.api.v1.export.youtube import (
    _generate_signed_state,
    _verify_signed_state,
    YOUTUBE_SCOPES,
)
from repositories.user import create_user_relational, delete_user
from repositories.youtube import (
    save_youtube_oauth_tokens,
    get_youtube_oauth_tokens,
    save_selected_youtube_channel,
    get_selected_youtube_channel,
)

def test_youtube_oauth_state_signature_validity():
    user_id = 'test_user_abc123'
    state = _generate_signed_state(user_id)
    verified_user_id = _verify_signed_state(state)
    assert verified_user_id == user_id

def test_youtube_oauth_state_tamper_detection():
    user_id = 'legit_user_1'
    state = _generate_signed_state(user_id)
    tampered_state = state.replace('legit_user_1', 'hacker_user_99')
    assert _verify_signed_state(tampered_state) is None

    parts = state.split(':')
    tampered_sig = parts[:-1] + ['0' * 64]
    tampered_state_2 = ':'.join(tampered_sig)
    assert _verify_signed_state(tampered_state_2) is None

def test_youtube_oauth_state_expiration():
    user_id = 'test_user_exp'
    old_timestamp = str(int(time.time()) - 350)
    raw = f'{user_id}:nonce123:{old_timestamp}'
    from app.core.config import JWT_SECRET_KEY
    import hmac
    import hashlib
    sig = hmac.new(JWT_SECRET_KEY.encode(), raw.encode(), hashlib.sha256).hexdigest()
    expired_state = f'{raw}:{sig}'
    assert _verify_signed_state(expired_state) is None

def test_youtube_oauth_scopes_minimization():
    assert 'https://www.googleapis.com/auth/youtube.readonly' in YOUTUBE_SCOPES
    assert 'https://www.googleapis.com/auth/youtube.upload' in YOUTUBE_SCOPES
    assert 'https://www.googleapis.com/auth/youtube' not in YOUTUBE_SCOPES

def test_youtube_oauth_token_persistence():
    import uuid
    uid_hex = uuid.uuid4().hex[:8]
    user_id = f'test_user_db_{uid_hex}'
    email = f'test_yt_{uid_hex}@example.com'
    create_user_relational(user_id=user_id, username=f'testuser_{uid_hex}', email=email, password_hash='hash123')

    try:
        save_youtube_oauth_tokens(
            user_id=user_id,
            access_token='test_access_tok_xyz',
            refresh_token='test_refresh_tok_123',
            client_id='test_client_id.apps.googleusercontent.com',
            client_secret='test_secret_999',
            scopes=' '.join(YOUTUBE_SCOPES),
        )

        tokens = get_youtube_oauth_tokens(user_id)
        assert tokens is not None
        assert tokens['access_token'] == 'test_access_tok_xyz'
        assert tokens['refresh_token'] == 'test_refresh_tok_123'

        save_selected_youtube_channel(
            user_id=user_id,
            channel_id='UC_Channel_B_99',
            title='My Gaming Channel',
            thumbnail='https://example.com/thumb.jpg',
            handle='@mygaming',
        )

        selected = get_selected_youtube_channel(user_id)
        assert selected is not None
        assert selected['id'] == 'UC_Channel_B_99'
        assert selected['title'] == 'My Gaming Channel'
    finally:
        delete_user(user_id)
