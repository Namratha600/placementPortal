from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth_dependency import require_roles
from app.services import resume_reminder_service

router = APIRouter(prefix="/admin", tags=["Admin Tasks"])

ADMIN = require_roles("admin", "super_admin")


@router.post("/resume-reminders/send-now")
async def send_resume_reminders_now(
    db: Session = Depends(get_db),
    _user=Depends(ADMIN),
):
    count = await resume_reminder_service.send_resume_reminders(db)
    return {
        "recipients": count,
        "message": f"Resume-update reminder sent to {count} student(s).",
    }