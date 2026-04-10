import hmac
import hashlib
import base64
import json
import os
from datetime import datetime, timedelta, timezone
from app.config.settings import SECRET_KEY, ACCESS_TOKEN_EXPIRE_MINUTES, REFRESH_TOKEN_EXPIRE_DAYS


# ── Password hashing (PBKDF2-HMAC-SHA256, stdlib only) ──────────────────────

def hash_password(plain: str) -> str:
    """Returns a salted PBKDF2 hash of the password."""
    salt = os.urandom(16)
    key  = hashlib.pbkdf2_hmac("sha256", plain.encode(), salt, 260_000)
    return base64.b64encode(salt + key).decode()


def verify_password(plain: str, stored_hash: str) -> bool:
    """Verifies plain password against stored PBKDF2 hash."""
    try:
        raw  = base64.b64decode(stored_hash.encode())
        salt = raw[:16]
        key  = raw[16:]
        check = hashlib.pbkdf2_hmac("sha256", plain.encode(), salt, 260_000)
        return hmac.compare_digest(key, check)
    except Exception:
        return False


# ── JWT (HS256, stdlib only) ─────────────────────────────────────────────────

def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def _b64url_decode(s: str) -> bytes:
    pad = 4 - len(s) % 4
    return base64.urlsafe_b64decode(s + "=" * (pad % 4))


def _sign(msg: str) -> str:
    return _b64url_encode(
        hmac.new(SECRET_KEY.encode(), msg.encode(), hashlib.sha256).digest()
    )


def create_token(payload: dict, expires_minutes: int) -> str:
    """Creates a signed JWT token."""
    header  = _b64url_encode(json.dumps({"alg": "HS256", "typ": "JWT"}).encode())
    exp     = datetime.now(timezone.utc) + timedelta(minutes=expires_minutes)
    claims  = {**payload, "exp": int(exp.timestamp()), "iat": int(datetime.now(timezone.utc).timestamp())}
    body    = _b64url_encode(json.dumps(claims).encode())
    sig     = _sign(f"{header}.{body}")
    return f"{header}.{body}.{sig}"


def create_access_token(user_id: int, role_name: str, name: str = "") -> str:
    #using create token function to create access token with user_id and role_name as payload
    return create_token(
        payload={"sub": str(user_id), "role": role_name, "name": name, "type": "access"},
        expires_minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )


def create_refresh_token(user_id: int) -> str:
    return create_token(
        {"sub": str(user_id), "type": "refresh"},
        REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60
    )


def decode_token(token: str) -> dict | None:
    """Decodes and validates a JWT. Returns payload dict or None if invalid/expired."""
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None
        header, body, sig = parts
        # Verify signature
        expected = _sign(f"{header}.{body}")
        if not hmac.compare_digest(sig, expected):
            return None
        payload = json.loads(_b64url_decode(body))
        # Check expiry
        if datetime.now(timezone.utc).timestamp() > payload.get("exp", 0):
            return None
        return payload
    except Exception:
        return None
