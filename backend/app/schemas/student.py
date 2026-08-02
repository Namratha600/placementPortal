import re
from datetime import date
from typing import Optional
from pydantic import BaseModel, field_validator, model_validator
from app.schemas.user import UserOut
from app.utils.validators import validate_register_number_format, validate_password_strength


class StudentRegisterRequest(BaseModel):
    full_name: str
    register_number: str
    phone: str
    password: str
    confirm_password: str

    @field_validator("full_name")
    @classmethod
    def full_name_not_blank(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Full name must be at least 2 characters")
        return v

    @field_validator("register_number")
    @classmethod
    def validate_register_number(cls, v: str) -> str:
        return validate_register_number_format(v)

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        v = v.strip()
        if not re.match(r"^[6-9]\d{9}$", v):
            raise ValueError("Phone number must be a valid 10-digit Indian mobile number")
        return v

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        return validate_password_strength(v)

    @model_validator(mode="after")
    def passwords_match(self):
        if self.password != self.confirm_password:
            raise ValueError("Password and confirm password do not match")
        return self


class StudentOTPVerifyRequest(BaseModel):
    register_number: str
    otp: str

    @field_validator("otp")
    @classmethod
    def otp_must_be_6_digits(cls, v: str) -> str:
        if not re.match(r"^\d{6}$", v):
            raise ValueError("OTP must be exactly 6 digits")
        return v


class StudentLoginRequest(BaseModel):
    register_number: str
    password: str


class StudentOut(BaseModel):
    id: int
    full_name: str
    register_number: str
    phone: str
    email: str
    role: str

    class Config:
        from_attributes = True


class StudentProfileUpdate(BaseModel):
    branch: Optional[str] = None
    cgpa: Optional[float] = None
    skills: Optional[str] = None

    @field_validator("cgpa")
    @classmethod
    def cgpa_in_range(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and not (0 <= v <= 10):
            raise ValueError("CGPA must be between 0 and 10.")
        return v


class StudentProfileOut(BaseModel):
    id: int
    full_name: str
    register_number: str
    phone: str
    email: str
    branch: Optional[str] = None
    cgpa: Optional[float] = None
    skills: Optional[str] = None
    resume_filename: Optional[str] = None


class StudentPlacementItem(BaseModel):
    company: Optional[str] = None
    role: Optional[str] = None
    package: Optional[float] = None
    placement_date: Optional[str] = None

    class Config:
        from_attributes = True


class StudentPlacementStatusOut(BaseModel):
    is_placed: bool
    total_offers: int
    highest_package: Optional[float] = None
    placements: list[StudentPlacementItem] = []


# ---------------------------------------------------------------------------
# Extended student details (personal / family / address / identity)
# ---------------------------------------------------------------------------
class StudentDetailsUpdate(BaseModel):
    """Partial update — student can save any subset of fields."""
    full_name: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[date] = None
    alt_email: Optional[str] = None
    category: Optional[str] = None
    course: Optional[str] = None
    batch: Optional[str] = None
    branch: Optional[str] = None
    section: Optional[str] = None
    father_name: Optional[str] = None
    father_occupation: Optional[str] = None
    mother_name: Optional[str] = None
    mother_maiden_name: Optional[str] = None
    parent_mobile_no: Optional[str] = None
    address_for_communication: Optional[str] = None
    hometown: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    stay_type: Optional[str] = None
    aadhar_no: Optional[str] = None
    name_as_per_aadhar: Optional[str] = None
    pan_number: Optional[str] = None

    @field_validator("phone", "parent_mobile_no")
    @classmethod
    def valid_mobile(cls, v):
        if v is None or v == "":
            return v
        if not re.match(r"^[6-9]\d{9}$", v.strip()):
            raise ValueError("Mobile number must be a valid 10-digit Indian number.")
        return v.strip()

    @field_validator("pincode")
    @classmethod
    def valid_pincode(cls, v):
        if v is None or v == "":
            return v
        if not re.match(r"^\d{6}$", v.strip()):
            raise ValueError("Pincode must be 6 digits.")
        return v.strip()

    @field_validator("aadhar_no")
    @classmethod
    def valid_aadhar(cls, v):
        if v is None or v == "":
            return v
        digits = v.replace(" ", "")
        if not re.match(r"^\d{12}$", digits):
            raise ValueError("Aadhar number must be 12 digits.")
        return digits


class StudentDetailsOut(BaseModel):
    id: int
    full_name: Optional[str] = None
    register_number: str
    phone: Optional[str] = None
    email: Optional[str] = None
    date_of_birth: Optional[date] = None
    alt_email: Optional[str] = None
    category: Optional[str] = None
    course: Optional[str] = None
    batch: Optional[str] = None
    branch: Optional[str] = None
    section: Optional[str] = None
    graduation_year: Optional[int] = None
    father_name: Optional[str] = None
    father_occupation: Optional[str] = None
    mother_name: Optional[str] = None
    mother_maiden_name: Optional[str] = None
    parent_mobile_no: Optional[str] = None
    address_for_communication: Optional[str] = None
    hometown: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    stay_type: Optional[str] = None
    aadhar_no: Optional[str] = None
    name_as_per_aadhar: Optional[str] = None
    pan_number: Optional[str] = None

    class Config:
        from_attributes = True