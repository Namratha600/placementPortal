from typing import Optional
import io
from fastapi.responses import StreamingResponse

from fastapi import APIRouter, Depends, UploadFile, File, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth_dependency import require_roles
from app.schemas.placement_record import PlacementRecordListOut, UploadResult
from app.services import placement_record_service

router = APIRouter(prefix="/placement-records", tags=["Placement Records"])

# Records are admin-only in every respect. Students never touch this router.
ADMIN = require_roles("admin", "super_admin")

MAX_UPLOAD_BYTES = 5 * 1024 * 1024  # 5 MB, consistent with the resume-upload cap


@router.get("", response_model=PlacementRecordListOut)
def get_records(
    year: Optional[int] = Query(None, description="Filter by graduation year"),
    branch: Optional[str] = Query(None, description="Filter by branch code, e.g. CSE"),
    company_id: Optional[int] = Query(None, description="Filter by company id"),
    page: int = 1,
    page_size: int = 25,
    db: Session = Depends(get_db),
    _user=Depends(ADMIN),
):
    return placement_record_service.get_records(
        db, year=year, branch=branch, company_id=company_id,
        page=page, page_size=page_size,
    )

@router.get("/export")
def export_records(
    year: Optional[int] = Query(None),
    branch: Optional[str] = Query(None),
    company_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    _user=Depends(ADMIN),
):
    xlsx_bytes = placement_record_service.build_records_xlsx(db, year, branch, company_id)
    return StreamingResponse(
        io.BytesIO(xlsx_bytes),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=placement_records.xlsx"},
    )

@router.post("/upload", response_model=UploadResult)
async def upload_records(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _user=Depends(ADMIN),
):
    content = await file.read()
    if len(content) > MAX_UPLOAD_BYTES:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="File too large (max 5 MB).")

    rows = placement_record_service.parse_file(file.filename, content)
    result = placement_record_service.merge_records(db, rows)
    return result