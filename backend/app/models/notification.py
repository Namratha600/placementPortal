from sqlalchemy import (
    Column, Integer, String, Text, Boolean, DateTime,
    ForeignKey, UniqueConstraint, func,
)
from app.database import Base


class Notification(Base):
    """
    One row per recipient student.
    type:
      - 'announcement' : sent by an admin (opportunity_* are NULL)
      - 'deadline'     : auto-generated when an opportunity nears its deadline
                         (opportunity_type + opportunity_id set)
    """
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(20), nullable=False, default="announcement")
    link = Column(String(500), nullable=True)
    opportunity_type = Column(String(20), nullable=True)   # 'on_campus' | 'off_campus'
    opportunity_id = Column(Integer, nullable=True)
    # Links an admin announcement row back to the broadcast it came from.
    # NULL for deadline notifications.
    broadcast_id = Column(Integer, ForeignKey("notification_broadcasts.id"), nullable=True, index=True)
    is_read = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, server_default=func.now())

    __table_args__ = (
        UniqueConstraint("student_id", "opportunity_type", "opportunity_id",
                         name="uq_notification_dedup"),
    )


class NotificationBroadcast(Base):
    """
    One row per admin 'send' action — the history record. Per-student
    Notification rows link back to this via broadcast_id, so read/unread
    analytics are computed live from those linked rows.
    """
    __tablename__ = "notification_broadcasts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    target_type = Column(String(20), nullable=False)       # all | branch | year | year_branch
    target_branch = Column(String(50), nullable=True)
    target_year = Column(Integer, nullable=True)
    recipient_count = Column(Integer, nullable=False, default=0)
    created_by = Column(Integer, nullable=True)
    created_at = Column(DateTime, server_default=func.now())