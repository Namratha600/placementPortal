import random

from app.services.pending_registration_store import (
    get_pending_registration,
    update_pending_registration_otp,
)


def generate_otp() -> str:
    """
    Generates a random 6-digit OTP as a zero-padded string
    (e.g. '004821', not just '4821').
    """
    return f"{random.randint(0, 999999):06d}"


def create_and_store_otp(register_number: str) -> str:
    """
    Generates a fresh OTP and attaches it (with a 10-minute expiry, set in
    pending_registration_store.py) to the given pending registration.
    Returns the OTP so the caller can email it.
    """
    otp = generate_otp()
    update_pending_registration_otp(register_number, otp)
    return otp


def is_otp_valid(register_number: str, submitted_otp: str) -> tuple[bool, str]:
    """
    Checks a submitted OTP against the stored one for this register number.
    Returns (is_valid, error_message). error_message is empty on success.
    Used in Step 8 (OTP verification endpoint) — included here now since
    it's tightly coupled to how the OTP is generated/stored.
    """
    from datetime import datetime

    entry = get_pending_registration(register_number)
    if entry is None:
        return False, "No pending registration found for this register number."

    if entry.get("otp") is None:
        return False, "No OTP has been generated for this registration yet."

    if entry.get("otp_expires_at") is None or datetime.utcnow() > entry["otp_expires_at"]:
        return False, "OTP has expired. Please request a new one."

    if entry["otp"] != submitted_otp:
        return False, "Incorrect OTP."

    return True, ""