from sqlalchemy import (
    Column, Integer, String, Numeric, Date, DateTime,
    ForeignKey, UniqueConstraint, func,
)
from app.database import Base


class PlacementRecord(Base):
    """
    One row = one student placed at one company.

    Dedup key is (roll_number, company_id): a student can appear multiple
    times across DIFFERENT companies (multiple offers), but only once per
    company. Re-uploading the same (roll_number, company) UPDATES the row.

    student_id is nullable on purpose — historical placement data often
    refers to graduates who no longer exist (or never existed) as users.
    """
    __tablename__ = "placement_records"

    id = Column(Integer, primary_key=True, index=True)

    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=True)

    roll_number = Column(String(50), nullable=False, index=True)
    student_name = Column(String(255), nullable=True)
    branch = Column(String(50), nullable=True, index=True)
    graduation_year = Column(Integer, nullable=True, index=True)
    role = Column(String(255), nullable=True)
    package = Column(Numeric(10, 2), nullable=True)      # LPA or absolute, as uploaded
    placement_date = Column(Date, nullable=True)

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        UniqueConstraint("roll_number", "company_id", name="uq_placement_roll_company"),
    )