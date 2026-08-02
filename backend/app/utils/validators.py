import re

# Maps each valid branch code to its department name. Keeping this as a
# dict (not just a set of allowed codes) means we can give a more specific
# error message, and it's ready to reuse later if a dashboard ever needs to
# display "IT", "CSE", etc. from a register number.
BRANCH_CODES: dict[str, str] = {
    "02": "EEE",
    "03": "MECH",
    "04": "ECE",
    "05": "CSE",
    "12": "IT",
    "42": "ML",
    "45": "DS",
    "46": "CYBER",
}

# Format: YY (admission year, any 2 digits) + B01A (constant) +
# BB (branch code, checked separately against BRANCH_CODES) +
# XX (roll sequence — alphanumeric, NOT restricted to numeric-only,
# since real sequences include endings like 'A0', 'B8', 'C3').
# Example: 24B01A1286
REGISTER_NUMBER_PATTERN = re.compile(r"^(\d{2})B01A(\d{2})([A-Z0-9]{2})$")


def validate_register_number_format(value: str) -> str:
    """
    Validates and normalizes a register number against the college's real
    format. Raises ValueError with a specific, user-facing message on
    failure. Returns the normalized (trimmed, uppercased) value on success.

    Deliberately does NOT hardcode specific admission years — any 2-digit
    year is structurally valid, so 24, 25, 26, 27... all work automatically
    without code changes as new batches join.
    """
    normalized = value.strip().upper()

    match = REGISTER_NUMBER_PATTERN.match(normalized)
    if not match:
        raise ValueError(
            "Register number must be in the format YYB01ABBXX "
            "(e.g. 24B01A1286) — YY is your admission year, "
            "BB is your branch code, XX is your roll sequence."
        )

    branch_code = match.group(2)
    if branch_code not in BRANCH_CODES:
        valid_codes = ", ".join(sorted(BRANCH_CODES))
        raise ValueError(
            f"'{branch_code}' is not a recognized branch code. "
            f"Valid branch codes are: {valid_codes}."
        )

    return normalized


def validate_password_strength(password: str) -> str:
    """
    Shared password strength rule, used by both StudentRegisterRequest
    and SetPasswordRequest (admin invitation flow) — kept in one place so
    the two flows can't silently drift apart on what counts as a strong
    password.
    """
    if len(password) < 8:
        raise ValueError("Password must be at least 8 characters")
    if not re.search(r"[A-Z]", password):
        raise ValueError("Password must contain at least one uppercase letter")
    if not re.search(r"[a-z]", password):
        raise ValueError("Password must contain at least one lowercase letter")
    if not re.search(r"\d", password):
        raise ValueError("Password must contain at least one digit")
    return password

from datetime import date


def graduation_year_from_register_number(register_number: str) -> int:
    """YYB01A... -> admission year 20YY -> graduation year 20YY + 4."""
    normalized = validate_register_number_format(register_number)
    yy = int(normalized[:2])
    return 2000 + yy + 4


def current_academic_year() -> int:
    """Academic year rolls over in June. Before June, still the previous year."""
    today = date.today()
    return today.year if today.month >= 6 else today.year - 1


def is_current_batch(register_number: str) -> bool:
    """True if this register number's batch has NOT yet graduated."""
    return graduation_year_from_register_number(register_number) >= current_academic_year()