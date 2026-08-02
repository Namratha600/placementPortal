"""
Password-reset business logic. Reuses:
  - otp_service.generate_otp()   (OTP primitive)
  - hashing.hash_password()      (same hashing as registration/login)
  - validators.validate_password_strength (in the schema)

Registration code is left completely untouched.
"""
from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.student import Student
from app.models.user import User
from app.services.otp_service import generate_otp
from app.services import password_reset_store
from app.auth.hashing import hash_password


def request_reset(db: Session, register_number: str) -> dict:
    """Find the student, generate + store a reset OTP, return OTP + email so
    the router can send/print it."""
    rn = register_number.strip()
    student = (
        db.query(Student)
        .filter(func.lower(Student.register_number) == rn.lower())
        .first()
    )
    if not student:
        # For an internal college portal we surface this clearly. (If you want
        # to avoid revealing which register numbers exist, return a generic
        # success message here instead of 404.)
        raise HTTPException(
            status_code=404,
            detail="No account found for this register number.",
        )

    key = rn.upper()
    otp = generate_otp()
    password_reset_store.create_reset_otp(key, otp)

    # email is auto-generated from the register number, same rule as registration
    email = f"{rn.lower()}@svecw.edu.in"
    return {"otp": otp, "email": email, "register_number": key}


def verify_and_reset(db: Session, register_number: str, otp: str, new_password: str) -> None:
    key = register_number.strip().upper()

    valid, msg = password_reset_store.is_reset_otp_valid(key, otp)
    if not valid:
        raise HTTPException(status_code=400, detail=msg)

    student = (
        db.query(Student)
        .filter(func.lower(Student.register_number) == key.lower())
        .first()
    )
    if not student:
        raise HTTPException(status_code=404, detail="Account no longer exists.")

    user = db.query(User).filter(User.id == student.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Linked user account not found.")

    user.password_hash = hash_password(new_password)
    db.commit()

    # one-time OTP: clear it so it can't be reused
    password_reset_store.delete_reset(key)