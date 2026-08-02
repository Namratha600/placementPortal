from datetime import datetime, timedelta
from jose import jwt

from app.config import settings


def create_access_token(user_id: int, role: str) -> str:
    """
    Builds a signed JWT containing exactly what the doc specifies:
    user_id and role — nothing else. Keeping the payload minimal means
    less sensitive data floating around in a token that lives in the
    browser's localStorage.

    'sub' (subject) and 'exp' (expiry) are standard JWT claim names that
    libraries and tools recognize automatically.
    """
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": str(user_id),
        "role": role,
        "exp": expire,
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> dict:
    """
    Decodes and validates a JWT's signature and expiry.
    Raises jose.JWTError if the token is invalid, tampered with, or expired
    — the caller (Step 12's dependency) is responsible for turning that
    into a proper 401 response.
    """
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])