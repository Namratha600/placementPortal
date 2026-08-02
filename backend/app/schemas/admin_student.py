from typing import Optional, List
from pydantic import BaseModel


class StudentApplicationItem(BaseModel):
    """One application row shown on the admin's student profile view."""
    opportunity_type: str            # 'on_campus' | 'off_campus'
    opportunity_id: int
    company_or_title: Optional[str] = None


class AdminStudentProfileOut(BaseModel):
    """Full student profile for admins, including applications + resume status."""
    id: int
    full_name: str
    register_number: str
    phone: Optional[str] = None
    email: Optional[str] = None
    branch: Optional[str] = None
    cgpa: Optional[float] = None
    skills: Optional[str] = None
    has_resume: bool
    resume_filename: Optional[str] = None
    applications: List[StudentApplicationItem] = []