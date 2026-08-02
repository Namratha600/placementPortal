from pydantic import BaseModel, ConfigDict
from datetime import datetime
from enum import Enum


class RoleEnum(str, Enum):
    """Mirrors app.models.user.RoleEnum, but kept in schemas as the
    API-facing contract. Two separate enums (DB vs API) are intentional:
    it means changing the DB representation later doesn't automatically
    change the API contract, and vice versa."""
    student = "student"
    admin = "admin"
    super_admin = "super_admin"


class UserOut(BaseModel):
    """
    What we return to the client when referring to a User.
    Notice: NO password_hash field here. This is the whole point of
    separating schemas from models — it's structurally impossible to
    accidentally leak the password hash if it's just not in this class.
    """
    id: int
    email: str
    role: RoleEnum
    created_at: datetime

    # Lets Pydantic build this schema directly from a SQLAlchemy model
    # instance (e.g. UserOut.model_validate(db_user)) instead of manually
    # mapping fields one by one.
    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    """
    Returned by both student and admin login endpoints. token_type is
    always 'bearer' — this tells the frontend how to attach it to future
    requests: `Authorization: Bearer <access_token>`.
    """
    access_token: str
    token_type: str = "bearer"
    role: str