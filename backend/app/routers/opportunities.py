from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timezone
from app.database import get_db
from app.models.opportunity import OnCampusOpportunity, OffCampusOpportunity, Application
from app.models.student import Student
from app.schemas.opportunity import (
    OnCampusOpportunityCreate,
    OnCampusOpportunityOut,
    OffCampusOpportunityCreate,
    OffCampusOpportunityOut,
    ApplicantsResponse,
    MyApplicationsResponse,
)
from app.dependencies.auth_dependency import require_role, get_current_user, CurrentUser

router = APIRouter(prefix="/opportunities", tags=["Opportunities"])


def _build_applicants_response(db: Session, applied_student_ids: set[int]) -> ApplicantsResponse:
    all_students = db.query(Student).order_by(Student.full_name.asc()).all()
    applied = [s for s in all_students if s.id in applied_student_ids]
    not_applied = [s for s in all_students if s.id not in applied_student_ids]
    return ApplicantsResponse(
        applied=applied,
        not_applied=not_applied,
        applied_count=len(applied),
        not_applied_count=len(not_applied),
    )


def _get_student_for_current_user(db: Session, current_user: CurrentUser) -> Student:
    student = db.query(Student).filter(Student.user_id == current_user.user_id).first()
    if student is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student profile not found for this account.",
        )
    return student


def _is_past_deadline(last_date_to_apply: datetime) -> bool:
    deadline = last_date_to_apply
    if deadline.tzinfo is None:
        deadline = deadline.replace(tzinfo=timezone.utc)
    return deadline < datetime.now(timezone.utc)


def _csv_to_set(value) -> set:
    if not value:
        return set()
    return {x.strip().lower() for x in str(value).split(",") if x.strip()}


def _matches_student(opportunity, student: Student) -> bool:
    """
    True if this opportunity should be visible to this student.
    Empty target = visible to everyone. Otherwise the student's
    graduation_year must be in target years AND branch in target branches.
    """
    year_targets = _csv_to_set(opportunity.target_graduation_years)
    branch_targets = _csv_to_set(opportunity.target_branches)

    if year_targets:
        if str(student.graduation_year or "").lower() not in year_targets:
            return False
    if branch_targets:
        if str(student.branch or "").lower() not in branch_targets:
            return False
    return True


# ---------- On-Campus ----------
@router.post("/on-campus", response_model=OnCampusOpportunityOut, status_code=status.HTTP_201_CREATED)
def create_on_campus_opportunity(
    payload: OnCampusOpportunityCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_role("super_admin")),
):
    new_opportunity = OnCampusOpportunity(**payload.model_dump(), created_by=current_user.user_id)
    db.add(new_opportunity)
    db.commit()
    db.refresh(new_opportunity)
    return new_opportunity


@router.put("/on-campus/{opportunity_id}", response_model=OnCampusOpportunityOut)
def update_on_campus_opportunity(
    opportunity_id: int,
    payload: OnCampusOpportunityCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_role("super_admin")),
):
    opportunity = db.query(OnCampusOpportunity).filter(OnCampusOpportunity.id == opportunity_id).first()
    if opportunity is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Opportunity not found.")
    for field, value in payload.model_dump().items():
        setattr(opportunity, field, value)
    db.commit()
    db.refresh(opportunity)
    return opportunity


@router.get("/on-campus", response_model=List[OnCampusOpportunityOut])
def list_on_campus_opportunities(
    include_expired: bool = Query(False, description="Admin view: also include past-deadline and skip student targeting."),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    opportunities = (
        db.query(OnCampusOpportunity)
        .order_by(OnCampusOpportunity.last_date_to_apply.asc())
        .all()
    )
    if not include_expired:
        opportunities = [o for o in opportunities if not _is_past_deadline(o.last_date_to_apply)]
        # Apply batch+branch targeting for students only.
        if current_user.role == "student":
            student = _get_student_for_current_user(db, current_user)
            opportunities = [o for o in opportunities if _matches_student(o, student)]
    return opportunities


@router.get("/on-campus/{opportunity_id}/applicants", response_model=ApplicantsResponse)
def get_on_campus_applicants(
    opportunity_id: int,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_role("super_admin")),
):
    opportunity = db.query(OnCampusOpportunity).filter(OnCampusOpportunity.id == opportunity_id).first()
    if opportunity is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Opportunity not found.")
    applied_student_ids = {
        app.student_id
        for app in db.query(Application).filter(Application.on_campus_opportunity_id == opportunity_id).all()
    }
    return _build_applicants_response(db, applied_student_ids)


# ---------- Off-Campus ----------
@router.post("/off-campus", response_model=OffCampusOpportunityOut, status_code=status.HTTP_201_CREATED)
def create_off_campus_opportunity(
    payload: OffCampusOpportunityCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_role("super_admin")),
):
    new_opportunity = OffCampusOpportunity(**payload.model_dump(), created_by=current_user.user_id)
    db.add(new_opportunity)
    db.commit()
    db.refresh(new_opportunity)
    return new_opportunity


@router.put("/off-campus/{opportunity_id}", response_model=OffCampusOpportunityOut)
def update_off_campus_opportunity(
    opportunity_id: int,
    payload: OffCampusOpportunityCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_role("super_admin")),
):
    opportunity = db.query(OffCampusOpportunity).filter(OffCampusOpportunity.id == opportunity_id).first()
    if opportunity is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Opportunity not found.")
    for field, value in payload.model_dump().items():
        setattr(opportunity, field, value)
    db.commit()
    db.refresh(opportunity)
    return opportunity


@router.get("/off-campus", response_model=List[OffCampusOpportunityOut])
def list_off_campus_opportunities(
    include_expired: bool = Query(False, description="Admin view: also include past-deadline and skip student targeting."),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    opportunities = (
        db.query(OffCampusOpportunity)
        .order_by(OffCampusOpportunity.last_date_to_apply.asc())
        .all()
    )
    if not include_expired:
        opportunities = [o for o in opportunities if not _is_past_deadline(o.last_date_to_apply)]
        if current_user.role == "student":
            student = _get_student_for_current_user(db, current_user)
            opportunities = [o for o in opportunities if _matches_student(o, student)]
    return opportunities


@router.get("/off-campus/{opportunity_id}/applicants", response_model=ApplicantsResponse)
def get_off_campus_applicants(
    opportunity_id: int,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_role("super_admin")),
):
    opportunity = db.query(OffCampusOpportunity).filter(OffCampusOpportunity.id == opportunity_id).first()
    if opportunity is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Opportunity not found.")
    applied_student_ids = {
        app.student_id
        for app in db.query(Application).filter(Application.off_campus_opportunity_id == opportunity_id).all()
    }
    return _build_applicants_response(db, applied_student_ids)


# ---------- Student: Apply & My Applications ----------
@router.post("/on-campus/{opportunity_id}/apply", status_code=status.HTTP_201_CREATED)
def apply_to_on_campus_opportunity(
    opportunity_id: int,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_role("student")),
):
    opportunity = db.query(OnCampusOpportunity).filter(OnCampusOpportunity.id == opportunity_id).first()
    if opportunity is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Opportunity not found.")
    if _is_past_deadline(opportunity.last_date_to_apply):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="The deadline to apply for this opportunity has passed.")
    student = _get_student_for_current_user(db, current_user)
    already_applied = (
        db.query(Application)
        .filter(Application.student_id == student.id, Application.on_campus_opportunity_id == opportunity_id)
        .first()
    )
    if already_applied:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="You have already applied to this opportunity.")
    new_application = Application(student_id=student.id, on_campus_opportunity_id=opportunity_id)
    db.add(new_application)
    db.commit()
    return {"message": f"Applied to {opportunity.company_name}."}


@router.post("/off-campus/{opportunity_id}/apply", status_code=status.HTTP_201_CREATED)
def apply_to_off_campus_opportunity(
    opportunity_id: int,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_role("student")),
):
    opportunity = db.query(OffCampusOpportunity).filter(OffCampusOpportunity.id == opportunity_id).first()
    if opportunity is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Opportunity not found.")
    if _is_past_deadline(opportunity.last_date_to_apply):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="The deadline to apply for this opportunity has passed.")
    student = _get_student_for_current_user(db, current_user)
    already_applied = (
        db.query(Application)
        .filter(Application.student_id == student.id, Application.off_campus_opportunity_id == opportunity_id)
        .first()
    )
    if already_applied:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="You have already applied to this opportunity.")
    new_application = Application(student_id=student.id, off_campus_opportunity_id=opportunity_id)
    db.add(new_application)
    db.commit()
    return {"message": f"Applied to {opportunity.title}."}


@router.get("/my-applications", response_model=MyApplicationsResponse)
def get_my_applications(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_role("student")),
):
    student = _get_student_for_current_user(db, current_user)
    applications = db.query(Application).filter(Application.student_id == student.id).all()
    return MyApplicationsResponse(
        on_campus_ids=[a.on_campus_opportunity_id for a in applications if a.on_campus_opportunity_id],
        off_campus_ids=[a.off_campus_opportunity_id for a in applications if a.off_campus_opportunity_id],
    )