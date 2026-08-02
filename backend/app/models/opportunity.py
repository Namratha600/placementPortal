from sqlalchemy import (
    Column, Integer, String, Text, Boolean, DateTime, ForeignKey, func, Numeric,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship
from sqlalchemy import ForeignKey
from app.database import Base


class OnCampusOpportunity(Base):
    __tablename__ = "on_campus_opportunities"

    id = Column(Integer, primary_key=True, index=True)
    company_name = Column(String(255), nullable=False, index=True)
    is_existing_company = Column(Boolean, nullable=False, default=False)
    registration_link = Column(String(500), nullable=False)
    last_date_to_apply = Column(DateTime(timezone=True), nullable=False)
    eligibility_criteria = Column(Text, nullable=True)
    package_offered = Column(Numeric(10, 2), nullable=True)

    # Targeting: comma-separated. NULL/empty = visible to everyone.
    target_graduation_years = Column(String(255), nullable=True)  # e.g. "2028,2029"
    target_branches = Column(String(255), nullable=True)          # e.g. "CSE,IT,ML"

    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    applications = relationship("Application", back_populates="on_campus_opportunity")

    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    company = relationship("Company", back_populates="opportunities", foreign_keys=[company_id])


class OffCampusOpportunity(Base):
    __tablename__ = "off_campus_opportunities"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    link = Column(String(500), nullable=False)
    photo_url = Column(String(500), nullable=True)
    last_date_to_apply = Column(DateTime(timezone=True), nullable=False)

    # Targeting: comma-separated. NULL/empty = visible to everyone.
    target_graduation_years = Column(String(255), nullable=True)
    target_branches = Column(String(255), nullable=True)

    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    applications = relationship("Application", back_populates="off_campus_opportunity")


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    on_campus_opportunity_id = Column(Integer, ForeignKey("on_campus_opportunities.id"), nullable=True)
    off_campus_opportunity_id = Column(Integer, ForeignKey("off_campus_opportunities.id"), nullable=True)
    applied_at = Column(DateTime(timezone=True), server_default=func.now())
    student = relationship("Student")
    on_campus_opportunity = relationship("OnCampusOpportunity", back_populates="applications")
    off_campus_opportunity = relationship("OffCampusOpportunity", back_populates="applications")

    __table_args__ = (
        UniqueConstraint("student_id", "on_campus_opportunity_id", name="uq_student_on_campus"),
        UniqueConstraint("student_id", "off_campus_opportunity_id", name="uq_student_off_campus"),
    )