from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.utils.validators import (
    graduation_year_from_register_number,
    is_current_batch,
)

from app.database import get_db
from app.schemas.student import (
    StudentRegisterRequest,
    StudentOTPVerifyRequest,
    StudentLoginRequest,
    StudentOut,
)
from app.schemas.user import Token
from app.models.user import User, RoleEnum
from app.models.student import Student
from app.utils.email_generator import generate_college_email
from app.auth.hashing import hash_password, verify_password
from app.auth.jwt_handler import create_access_token
from app.services.pending_registration_store import (
    save_pending_registration,
    get_pending_registration,
    mark_pending_verified,
    delete_pending_registration,
)
from app.services.otp_service import create_and_store_otp, is_otp_valid
from app.services.email_service import send_otp_email

router = APIRouter(prefix="/auth/student", tags=["Student Auth"])


@router.post("/register", status_code=status.HTTP_200_OK)
async def register_student(payload: StudentRegisterRequest, db: Session = Depends(get_db)):
    """
    Step 1-3 of the registration flow:
    1. Pydantic (StudentRegisterRequest) already validated format/strength.
    2. Check the register number isn't already registered (or pending).
    3. Generate the college email and hash the password.
    4. Stash everything in the pending store and (next step) send an OTP.

    Nothing is written to MySQL yet — that only happens after OTP
    verification (Step 9), so a half-registered, unverified account can
    never exist in the real Student/User tables.
    """
    register_number = payload.register_number  # already uppercased by the schema
    # Block registration for batches that have already graduated.
    if not is_current_batch(register_number):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This batch has already graduated. Registration is no longer available.",
        )
    email = generate_college_email(register_number)

    # Check against already-verified accounts in MySQL.
    existing_user = (
        db.query(User)
        .join(Student, Student.user_id == User.id)
        .filter(
            or_(User.email == email, Student.register_number == register_number)
        )
        .first()
    )
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this register number already exists.",
        )

    # Check against registrations awaiting OTP verification.
    if get_pending_registration(register_number):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "A registration for this register number is already pending "
                "OTP verification. Please verify or wait for it to expire."
            ),
        )

    password_hash = hash_password(payload.password)

    save_pending_registration(
        register_number=register_number,
        full_name=payload.full_name,
        phone=payload.phone,
        password_hash=password_hash,
        email=email,
    )

    otp = create_and_store_otp(register_number)
    await send_otp_email(email, otp)

    return {
        "message": "Registration details received. OTP sent to your college email.",
        "email": email,
    }


@router.post("/verify-otp", status_code=status.HTTP_201_CREATED, response_model=StudentOut)
def verify_student_otp(payload: StudentOTPVerifyRequest, db: Session = Depends(get_db)):
    """
    Step 5-6 of the registration flow: student submits the OTP they
    received. If it's valid, we immediately create the real User + Student
    rows in MySQL — this is the only place in the whole registration flow
    where a row actually gets written to the database, which guarantees an
    unverified student can never exist in the real tables.
    """
    register_number = payload.register_number.strip().upper()

    valid, error_message = is_otp_valid(register_number, payload.otp)
    if not valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_message,
        )

    mark_pending_verified(register_number)

    entry = get_pending_registration(register_number)
    # Defensive check: shouldn't happen if is_otp_valid just succeeded,
    # but guards against the entry vanishing between the two calls.
    if entry is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Pending registration not found. Please register again.",
        )

    # Create the base User row first (needed for Student's foreign key).
    new_user = User(
        email=entry["email"],
        password_hash=entry["password_hash"],
        role=RoleEnum.student,
    )
    db.add(new_user)
    db.flush()  # assigns new_user.id without committing yet

    new_student = Student(
        user_id=new_user.id,
        full_name=entry["full_name"],
        register_number=register_number,
        phone=entry["phone"],
        graduation_year=graduation_year_from_register_number(register_number),
    )
    db.add(new_student)

    # Only commit once both rows are ready — if anything above raised,
    # nothing gets persisted, avoiding a User row with no matching Student.
    db.commit()
    db.refresh(new_user)
    db.refresh(new_student)

    # The pending entry has done its job; remove it so it can't be reused
    # or linger in memory.
    delete_pending_registration(register_number)

    return StudentOut(
        id=new_student.id,
        full_name=new_student.full_name,
        register_number=new_student.register_number,
        phone=new_student.phone,
        email=new_user.email,
        role=new_user.role.value,
    )


@router.post("/login", response_model=Token)
def login_student(payload: StudentLoginRequest, db: Session = Depends(get_db)):
    """
    Student logs in with register_number + password (not email — students
    don't need to remember their generated college email to log in).
    """
    register_number = payload.register_number.strip().upper()

    student = (
        db.query(Student)
        .filter(Student.register_number == register_number)
        .first()
    )

    # Deliberately vague error message: we don't reveal whether it was the
    # register number or the password that was wrong. Being specific here
    # would let an attacker enumerate valid register numbers.
    invalid_credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid register number or password.",
    )

    if student is None:
        raise invalid_credentials_error

    user = db.query(User).filter(User.id == student.user_id).first()
    if user is None or not verify_password(payload.password, user.password_hash):
        raise invalid_credentials_error

    access_token = create_access_token(user_id=user.id, role=user.role.value)
    return Token(access_token=access_token, role=user.role.value)