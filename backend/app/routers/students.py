import os
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from fastapi import UploadFile, File
from app.services import cgpa_upload_service
from app.schemas.student import StudentPlacementStatusOut
from app.services import student_placement_service
from app.dependencies.auth_dependency import require_roles
from app.schemas.student import StudentDetailsUpdate, StudentDetailsOut
from app.database import get_db
from app.models.student import Student
from app.models.user import User
from app.schemas.student import StudentProfileUpdate, StudentProfileOut
from app.dependencies.auth_dependency import require_role, require_roles, CurrentUser
from sqlalchemy import text
from app.schemas.admin_student import AdminStudentProfileOut, StudentApplicationItem
from pydantic import BaseModel

class AdminCgpaUpdate(BaseModel):
    cgpa: float

router = APIRouter(prefix="/students", tags=["Student Profile"])

RESUME_DIR = "uploads/resumes"
MAX_RESUME_SIZE_MB = 2


def _get_student_and_user(db: Session, current_user: CurrentUser) -> tuple[Student, User]:
    """
    Same user_id -> Student mapping pattern used in opportunities.py —
    the JWT only carries user_id, but profile fields live on the Student
    row. Also fetches the User row since email lives there, not on Student.
    """
    student = db.query(Student).filter(Student.user_id == current_user.user_id).first()
    if student is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student profile not found.")
    user = db.query(User).filter(User.id == current_user.user_id).first()
    return student, user


def _build_profile_out(student: Student, user: User) -> StudentProfileOut:
    return StudentProfileOut(
        id=student.id,
        full_name=student.full_name,
        register_number=student.register_number,
        phone=student.phone,
        email=user.email,
        branch=student.branch,
        cgpa=float(student.cgpa) if student.cgpa is not None else None,
        skills=student.skills,
        resume_filename=student.resume_filename,
    )


@router.get("/me/profile", response_model=StudentProfileOut)
def get_my_profile(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_role("student")),
):
    student, user = _get_student_and_user(db, current_user)
    return _build_profile_out(student, user)


@router.put("/me/profile", response_model=StudentProfileOut)
def update_my_profile(
    payload: StudentProfileUpdate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_role("student")),
):
    """
    Partial update — only fields the student actually submitted get
    changed. Using `is not None` (not just checking truthiness) means a
    student can't accidentally wipe their branch by submitting an empty
    string; they'd need to explicitly send null for that, which the
    frontend form never does.
    """
    student, user = _get_student_and_user(db, current_user)

    if payload.branch is not None:
        student.branch = payload.branch
    
    if payload.skills is not None:
        student.skills = payload.skills

    db.commit()
    db.refresh(student)
    return _build_profile_out(student, user)


@router.post("/me/resume", response_model=StudentProfileOut)
async def upload_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_role("student")),
):
    student, user = _get_student_and_user(db, current_user)

    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Resume must be a PDF file.",
        )

    contents = await file.read()
    if len(contents) > MAX_RESUME_SIZE_MB * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Resume must be smaller than {MAX_RESUME_SIZE_MB}MB.",
        )

    os.makedirs(RESUME_DIR, exist_ok=True)
    # Fixed filename per student (not the original uploaded filename) —
    # this is exactly what makes a new upload overwrite the old resume
    # instead of accumulating multiple versions on disk.
    filename = f"resume_{student.id}.pdf"
    filepath = os.path.join(RESUME_DIR, filename)
    with open(filepath, "wb") as f:
        f.write(contents)

    student.resume_filename = filename
    db.commit()
    db.refresh(student)
    return _build_profile_out(student, user)


@router.get("/me/resume")
def download_my_resume(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_role("student")),
):
    """
    Authenticated download — deliberately not a public static file URL.
    Only the logged-in student (via their own JWT) can ever reach their
    own resume; there's no guessable /uploads/resumes/resume_7.pdf path
    exposed to the outside world.
    """
    student, _ = _get_student_and_user(db, current_user)
    if not student.resume_filename:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No resume uploaded yet.")

    filepath = os.path.join(RESUME_DIR, student.resume_filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume file not found on server.")

    return FileResponse(filepath, media_type="application/pdf", filename=student.resume_filename)
# ---------------------------------------------------------------------------
# Admin: student lookup + resume access (admin / super_admin only)
# ---------------------------------------------------------------------------
ADMIN = require_roles("admin", "super_admin")


def _admin_get_student(db: Session, register_number: str) -> Student:
    rn = register_number.strip()
    student = (
        db.query(Student)
        .filter(Student.register_number == rn)
        .first()
    )
    if student is None:
        # fall back to case-insensitive match
        from sqlalchemy import func
        student = (
            db.query(Student)
            .filter(func.lower(Student.register_number) == rn.lower())
            .first()
        )
    if student is None:
        raise HTTPException(status_code=404, detail="No student found with that register number.")
    return student


def _student_applications(db: Session, student_id: int) -> list:
    """Read the student's applications defensively (schema-name tolerant)."""
    items = []
    try:
        rows = db.execute(text("""
            SELECT a.on_campus_opportunity_id  AS on_id,
                   a.off_campus_opportunity_id AS off_id,
                   onc.company_name            AS on_label,
                   offc.title                  AS off_label
            FROM applications a
            LEFT JOIN on_campus_opportunities  onc  ON onc.id  = a.on_campus_opportunity_id
            LEFT JOIN off_campus_opportunities offc ON offc.id = a.off_campus_opportunity_id
            WHERE a.student_id = :sid
        """), {"sid": student_id}).fetchall()
        for r in rows:
            m = r._mapping
            if m["on_id"] is not None:
                items.append({"opportunity_type": "on_campus",
                              "opportunity_id": m["on_id"],
                              "company_or_title": m["on_label"]})
            elif m["off_id"] is not None:
                items.append({"opportunity_type": "off_campus",
                              "opportunity_id": m["off_id"],
                              "company_or_title": m["off_label"]})
    except Exception:
        pass  # if the applications schema differs, just return an empty list
    return items


@router.get("/by-register/{register_number}/profile", response_model=AdminStudentProfileOut)
def admin_get_student_profile(
    register_number: str,
    db: Session = Depends(get_db),
    _user: CurrentUser = Depends(ADMIN),
):
    student = _admin_get_student(db, register_number)
    user = db.query(User).filter(User.id == student.user_id).first()
    return AdminStudentProfileOut(
        id=student.id,
        full_name=student.full_name,
        register_number=student.register_number,
        phone=student.phone,
        email=user.email if user else None,
        branch=student.branch,
        cgpa=float(student.cgpa) if student.cgpa is not None else None,
        skills=student.skills,
        has_resume=bool(student.resume_filename),
        resume_filename=student.resume_filename,
        applications=[StudentApplicationItem(**a) for a in _student_applications(db, student.id)],
    )


def _admin_resume_path(db: Session, student_id: int) -> tuple[Student, str]:
    student = db.query(Student).filter(Student.id == student_id).first()
    if student is None:
        raise HTTPException(status_code=404, detail="Student not found.")
    if not student.resume_filename:
        raise HTTPException(status_code=404, detail="This student has no resume uploaded.")
    filepath = os.path.join(RESUME_DIR, student.resume_filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Resume file not found on server.")
    return student, filepath


@router.get("/{student_id}/resume/view")
def admin_view_resume(
    student_id: int,
    db: Session = Depends(get_db),
    _user: CurrentUser = Depends(ADMIN),
):
    """Open the resume inline in the browser."""
    student, filepath = _admin_resume_path(db, student_id)
    from fastapi.responses import Response
    with open(filepath, "rb") as f:
        data = f.read()
    return Response(
        content=data,
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="{student.register_number}-RESUME.pdf"'},
    )


@router.get("/{student_id}/resume/download")
def admin_download_resume(
    student_id: int,
    db: Session = Depends(get_db),
    _user: CurrentUser = Depends(ADMIN),
):
    """Force download named {register_number}-RESUME.pdf."""
    student, filepath = _admin_resume_path(db, student_id)
    return FileResponse(
        filepath,
        media_type="application/pdf",
        filename=f"{student.register_number}-RESUME.pdf",
    )
@router.put("/by-register/{register_number}/cgpa", response_model=AdminStudentProfileOut)
def admin_update_cgpa(
    register_number: str,
    payload: AdminCgpaUpdate,
    db: Session = Depends(get_db),
    _user: CurrentUser = Depends(ADMIN),
):
    if payload.cgpa < 0 or payload.cgpa > 10:
        raise HTTPException(status_code=400, detail="CGPA must be between 0 and 10.")

    student = _admin_get_student(db, register_number)
    student.cgpa = payload.cgpa
    db.commit()

    # return the refreshed admin profile (reuses the search endpoint's builder)
    return admin_get_student_profile(register_number, db, _user)
@router.post("/cgpa/upload")
async def admin_upload_cgpa(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _user: CurrentUser = Depends(ADMIN),
):
    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 5 MB).")
    rows = cgpa_upload_service.parse_file(file.filename, content)
    return cgpa_upload_service.bulk_update_cgpa(db, rows)
@router.get("/me/placement-status", response_model=StudentPlacementStatusOut)
def my_placement_status(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_role("student")),
):
    student = db.query(Student).filter(Student.user_id == current_user.user_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")
    return student_placement_service.get_placement_status(db, student.register_number)

@router.get("/graduation-years")
def list_graduation_years(
    db: Session = Depends(get_db),
    _user: CurrentUser = Depends(require_roles("admin", "super_admin")),
):
    """Distinct graduation years present among current students, newest first."""
    rows = (
        db.query(Student.graduation_year)
        .filter(Student.graduation_year.isnot(None))
        .distinct()
        .order_by(Student.graduation_year.desc())
        .all()
    )
    return [r[0] for r in rows]
@router.get("/me/details", response_model=StudentDetailsOut)
def get_my_details(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_role("student")),
):
    student = db.query(Student).filter(Student.user_id == current_user.user_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")
    user = db.query(User).filter(User.id == student.user_id).first()
    data = StudentDetailsOut.model_validate(student).model_dump()
    data["email"] = user.email if user else None
    return data


@router.put("/me/details", response_model=StudentDetailsOut)
def update_my_details(
    payload: StudentDetailsUpdate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_role("student")),
):
    student = db.query(Student).filter(Student.user_id == current_user.user_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")

    # Apply only the fields the student actually sent.
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(student, field, value)
    db.commit()
    db.refresh(student)

    user = db.query(User).filter(User.id == student.user_id).first()
    data = StudentDetailsOut.model_validate(student).model_dump()
    data["email"] = user.email if user else None
    return data