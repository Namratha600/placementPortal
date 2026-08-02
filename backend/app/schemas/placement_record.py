from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict


class PlacementRecordOut(BaseModel):
    """Full record shape — ADMIN ONLY. Students must never receive this."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    company_id: int
    student_id: Optional[int] = None
    roll_number: str
    student_name: Optional[str] = None
    branch: Optional[str] = None
    graduation_year: Optional[int] = None
    role: Optional[str] = None
    package: Optional[float] = None
    placement_date: Optional[date] = None
    created_at: datetime
    updated_at: datetime


class PlacementRecordListOut(BaseModel):
    """Paginated wrapper for the admin 'Get Records' view."""
    total: int
    page: int
    page_size: int
    items: List[PlacementRecordOut]


class RowError(BaseModel):
    row: int          # 1-based row number in the uploaded file (data rows)
    reason: str


class UploadResult(BaseModel):
    """Returned by the upload endpoint so the admin sees exactly what happened."""
    inserted: int
    updated: int
    skipped: int
    total_rows: int
    companies_created: List[str] = []
    errors: List[RowError] = []