import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy.orm import Session

from app.models.user import User, RoleEnum

INVITATION_EXPIRY_HOURS = 24


def generate_invitation_token() -> str:
    """
    secrets.token_urlsafe (not random.randint or uuid4) is the correct
    choice here: it's cryptographically secure and unpredictable, which
    matters because this token is effectively a temporary password —
    anyone who guesses or intercepts it could set an admin's password.
    """
    return secrets.token_urlsafe(32)


def create_admin_invitation(db: Session, full_name: str, email: str) -> User:
    """
    Inserts a new pending admin row directly into the existing `users`
    table (no separate admins table, no in-memory pending store like
    student registration uses — the spec calls for the row to exist
    immediately, since the Super Admin needs to see it in the list
    right away, even before it's accepted).
    """
    token = generate_invitation_token()
    expiry = datetime.now(timezone.utc) + timedelta(hours=INVITATION_EXPIRY_HOURS)

    new_admin = User(
        email=email,
        full_name=full_name,
        password_hash=None,
        role=RoleEnum.admin,
        invitation_status="pending",
        invitation_token=token,
        invitation_expiry=expiry,
    )
    db.add(new_admin)
    db.commit()
    db.refresh(new_admin)
    return new_admin


def get_effective_status(user: User) -> str:
    """
    'Expired' is never stored — it's derived on read. A pending invite
    that's past its expiry is effectively expired the moment 'now' passes
    the deadline, without needing a background job to update rows.
    """
    if user.invitation_status == "pending":
        expiry = user.invitation_expiry
        if expiry is not None:
            if expiry.tzinfo is None:
                expiry = expiry.replace(tzinfo=timezone.utc)
            if expiry < datetime.now(timezone.utc):
                return "expired"
    return user.invitation_status or "accepted"


def find_valid_invitation(db: Session, token: str) -> Optional[User]:
    """
    Looks up a user by invitation token and confirms it's still usable:
    exists, still pending (not already accepted — tokens are single-use),
    and not expired. Returns None for any failure case rather than
    raising, so the caller can give one consistent error message without
    leaking which specific check failed (existence vs. expiry vs. reuse).
    """
    user = db.query(User).filter(User.invitation_token == token).first()
    if user is None:
        return None
    if user.invitation_status != "pending":
        return None
    if get_effective_status(user) == "expired":
        return None
    return user


def accept_invitation(db: Session, user: User, password_hash: str) -> None:
    """
    Finalizes the invitation: sets the real password hash, marks accepted,
    and — critically — clears the token and expiry so this same link can
    never be used again (single-use, as required).
    """
    user.password_hash = password_hash
    user.invitation_status = "accepted"
    user.invitation_token = None
    user.invitation_expiry = None
    db.commit()