"""
In-memory store for password-reset OTPs. Separate from
pending_registration_store so registration and reset never collide on the
same register-number key.

Same limitation as the registration store (intentional for this stage):
lives in server memory, cleared on restart, single-process only. Swap for
Redis / a DB table with expiry before real deployment.
"""
from typing import Optional
from datetime import datetime, timedelta

_password_resets: dict[str, dict] = {}

RESET_OTP_EXPIRY_MINUTES = 10


def create_reset_otp(register_number: str, otp: str) -> None:
    _password_resets[register_number] = {
        "otp": otp,
        "otp_expires_at": datetime.utcnow() + timedelta(minutes=RESET_OTP_EXPIRY_MINUTES),
        "created_at": datetime.utcnow(),
    }


def get_reset(register_number: str) -> Optional[dict]:
    return _password_resets.get(register_number)


def is_reset_otp_valid(register_number: str, submitted_otp: str) -> tuple[bool, str]:
    entry = _password_resets.get(register_number)
    if entry is None:
        return False, "No password reset request found. Please start again."
    if entry.get("otp_expires_at") is None or datetime.utcnow() > entry["otp_expires_at"]:
        return False, "OTP has expired. Please request a new one."
    if entry["otp"] != submitted_otp:
        return False, "Incorrect OTP."
    return True, ""


def delete_reset(register_number: str) -> None:
    _password_resets.pop(register_number, None)