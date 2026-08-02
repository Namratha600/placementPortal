"""
Resume-update reminder: emails every student a reminder to keep their resume
current. Used by both the manual admin endpoint and the standalone script that
Windows Task Scheduler runs every 3 days.
"""
from sqlalchemy.orm import Session

from app.models.user import User
from app.services import email_service


def get_student_emails(db: Session) -> list[str]:
    """All student email addresses (email lives on the users row)."""
    rows = (
        db.query(User.email)
        .filter(User.role == "student", User.email.isnot(None))
        .all()
    )
    # de-dupe and drop blanks
    return sorted({r[0] for r in rows if r[0]})


async def send_resume_reminders(db: Session) -> int:
    """Send the reminder to all students. Returns the recipient count."""
    emails = get_student_emails(db)
    await email_service.send_resume_update_reminder(emails)
    return len(emails)