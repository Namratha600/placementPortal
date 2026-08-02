"""
Standalone resume-reminder runner.

Run every 3 days via Windows Task Scheduler. It opens a DB session, emails all
students a resume-update reminder, and exits. Independent of the web server.

Run manually to test (from the backend/ folder, with the venv active):
    python send_resume_reminders.py
"""
import asyncio

from app.database import SessionLocal
from app.services import resume_reminder_service

# register all models before any ORM query runs
import app.models.user          # noqa: F401
import app.models.student       # noqa: F401
import app.models.company       # noqa: F401
import app.models.placement_record  # noqa: F401
import app.models.blog          # noqa: F401
import app.models.notification  # noqa: F401
import app.models.opportunity   # noqa: F401

def main():
    db = SessionLocal()
    try:
        count = asyncio.run(resume_reminder_service.send_resume_reminders(db))
        print(f"Resume-update reminder sent to {count} student(s).")
    finally:
        db.close()


if __name__ == "__main__":
    main()