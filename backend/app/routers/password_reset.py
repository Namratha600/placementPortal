from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.password_reset import ForgotPasswordRequest, ResetPasswordRequest
from app.services import password_reset_service

# These endpoints are PUBLIC — a student who forgot their password can't log in,
# so no auth dependency here.
router = APIRouter(prefix="/auth/student", tags=["Student Auth - Password Reset"])


@router.post("/forgot-password")
async def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    info = password_reset_service.request_reset(db, payload.register_number)

    # Reuse the existing email service — same async call registration uses.
    # In dev (EMAIL_ENABLED=false) this prints the OTP to console;
    # in prod (EMAIL_ENABLED=true) it sends a real email via SMTP.
    from app.services.email_service import send_otp_email
    await send_otp_email(info["email"], info["otp"])

    return {"message": "An OTP has been sent to your registered email."}


@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    password_reset_service.verify_and_reset(
        db, payload.register_number, payload.otp, payload.new_password
    )
    return {"message": "Password reset successful. You can now log in with your new password."}