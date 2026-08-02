from sqlalchemy import Column, Integer, String, Enum, DateTime, func
from sqlalchemy.orm import relationship
import enum

from app.database import Base


class RoleEnum(str, enum.Enum):
    """
    Restricts the role column to exactly these two values at the DB level,
    not just in application code. Prevents bad data like role="teacher"
    from ever being inserted.
    """
    student = "student"
    admin = "admin"
    super_admin = "super_admin"


class User(Base):
    """
    Base identity table. Both students and admins are Users first —
    this is what login/JWT auth is built against.
    Students have a linked Student row (extra profile fields);
    admins do not (they're inserted directly into this table).

    password_hash is nullable because an invited admin exists in this
    table (so the Super Admin can see them as "pending") before they've
    ever set a password — it's only filled in once they use their
    invitation link.
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=True)
    role = Column(Enum(RoleEnum), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Only populated for admin/super_admin rows. Students keep their name
    # in the Student table instead — this isn't used for them.
    full_name = Column(String(255), nullable=True)

    # Admin invitation tracking. All nullable since students and
    # already-provisioned accounts never use these.
    invitation_status = Column(String(20), nullable=True)  # 'pending' | 'accepted'
    invitation_token = Column(String(255), unique=True, nullable=True, index=True)
    invitation_expiry = Column(DateTime(timezone=True), nullable=True)

    # One-to-one link to Student profile (only populated when role == student).
    # uselist=False makes this a scalar relationship instead of a list.
    student = relationship("Student", back_populates="user", uselist=False)