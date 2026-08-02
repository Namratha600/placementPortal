import re
from pydantic import BaseModel, field_validator, model_validator
from app.utils.validators import validate_password_strength


class ForgotPasswordRequest(BaseModel):
    """Step 1: student submits their register number to receive a reset OTP."""
    register_number: str

    @field_validator("register_number")
    @classmethod
    def not_blank(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Register number is required")
        return v


class ResetPasswordRequest(BaseModel):
    """Step 2: student submits OTP + new password."""
    register_number: str
    otp: str
    new_password: str
    confirm_password: str

    @field_validator("otp")
    @classmethod
    def otp_6_digits(cls, v: str) -> str:
        if not re.match(r"^\d{6}$", v):
            raise ValueError("OTP must be exactly 6 digits")
        return v

    @field_validator("new_password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        # reuse the same strength rules as registration
        return validate_password_strength(v)

    @model_validator(mode="after")
    def passwords_match(self):
        if self.new_password != self.confirm_password:
            raise ValueError("Password and confirm password do not match")
        return self