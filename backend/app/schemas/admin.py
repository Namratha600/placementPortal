from pydantic import BaseModel, EmailStr, field_validator, model_validator
from typing import Optional

from app.utils.validators import validate_password_strength


class InviteAdminRequest(BaseModel):
    """What the Super Admin submits on the 'Invite Admin' form.
    No password field — the invited admin sets their own later."""
    full_name: str
    email: EmailStr

    @field_validator("full_name")
    @classmethod
    def full_name_not_blank(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Full name must be at least 2 characters")
        return v


class AdminListItem(BaseModel):
    """One row in the 'Manage Admins' table."""
    id: int
    full_name: Optional[str]
    email: str
    role: str
    # 'pending' | 'accepted' | 'expired' — 'expired' is computed (not
    # stored) by the service layer when a pending invite's time is up.
    invitation_status: str

    class Config:
        from_attributes = True


class SetPasswordRequest(BaseModel):
    """
    What the invited admin submits from the public /admin/set-password
    page. Reuses the exact same password strength rule as student
    registration (app/utils/validators.py) so the two flows can't
    silently drift apart on what counts as a strong password.
    """
    token: str
    password: str
    confirm_password: str

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        return validate_password_strength(v)

    @model_validator(mode="after")
    def passwords_match(self):
        if self.password != self.confirm_password:
            raise ValueError("Password and confirm password do not match")
        return self