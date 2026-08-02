from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError
from pydantic import BaseModel

from app.auth.jwt_handler import decode_access_token

# HTTPBearer reads the "Authorization: Bearer <token>" header and extracts
# just the token part. auto_error=True means it automatically returns a
# 403 if the header is missing entirely, before our code even runs.
bearer_scheme = HTTPBearer()


class CurrentUser(BaseModel):
    """
    What every protected route receives once authentication succeeds.
    Deliberately just user_id + role — exactly what's in the JWT payload,
    nothing pulled from the database here. If a route needs full profile
    data (name, phone, etc.), it queries for it explicitly using user_id.
    """
    user_id: int
    role: str


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> CurrentUser:
    """
    The core auth dependency. Any route that adds
    `current_user: CurrentUser = Depends(get_current_user)` to its
    signature becomes protected: FastAPI won't even call the route's
    function body unless this returns successfully.
    """
    token = credentials.credentials  # the raw JWT string, header already stripped

    try:
        payload = decode_access_token(token)
    except JWTError:
        # Covers: invalid signature, tampered token, and expired tokens
        # (jose raises JWTError for expiry too) — all treated as "not
        # authenticated" rather than leaking which specific problem it was.
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    role = payload.get("role")
    if user_id is None or role is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token.",
        )

    return CurrentUser(user_id=int(user_id), role=role)


def require_role(required_role: str):
    """
    A dependency FACTORY (a function that returns a dependency), used for
    role-gating routes on top of authentication.

    Usage in a route:
        @router.get("/admin-only")
        def some_route(user: CurrentUser = Depends(require_role("admin"))):
            ...

    This runs get_current_user first (so authentication is always checked),
    then additionally verifies the role matches before allowing access.
    """

    def role_checker(current_user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        if current_user.role != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"This action requires '{required_role}' role.",
            )
        return current_user

    return role_checker
# --- append to auth_dependency.py, keep everything above unchanged ---

def require_roles(*allowed_roles: str):
    """
    Like require_role, but accepts multiple roles.
    Reuses the same JWT decoding path as require_role.
    """
    def dependency(current_user=Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action",
            )
        return current_user
    return dependency