from passlib.context import CryptContext

# bcrypt is the industry-standard choice for password hashing: it's slow
# by design (resists brute-force attacks) and automatically handles
# per-password salting, so we never manage salts ourselves.
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain_password: str) -> str:
    """Turns a plaintext password into a one-way bcrypt hash for storage."""
    return pwd_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Checks a login attempt's password against the stored hash."""
    return pwd_context.verify(plain_password, hashed_password)