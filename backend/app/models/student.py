from sqlalchemy import Column, Integer, String, ForeignKey, Numeric, Text, Date
from sqlalchemy.orm import relationship
from app.database import Base


class Student(Base):
    """
    Extra profile fields for users with role == student.
    """
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    register_number = Column(String(20), unique=True, nullable=False, index=True)
    phone = Column(String(15), nullable=False)

    # Academic profile
    branch = Column(String(100), nullable=True)
    cgpa = Column(Numeric(3, 2), nullable=True)
    skills = Column(Text, nullable=True)
    graduation_year = Column(Integer, nullable=True)
    resume_filename = Column(String(255), nullable=True)

    # --- Extended personal details ---
    date_of_birth = Column(Date, nullable=True)
    alt_email = Column(String(100), nullable=True)
    category = Column(String(10), nullable=True)

    # Academic (extended)
    course = Column(String(50), nullable=True)
    batch = Column(String(20), nullable=True)
    section = Column(String(20), nullable=True)

    # Family
    father_name = Column(String(100), nullable=True)
    father_occupation = Column(String(100), nullable=True)
    mother_name = Column(String(100), nullable=True)
    mother_maiden_name = Column(String(100), nullable=True)
    parent_mobile_no = Column(String(15), nullable=True)

    # Address
    address_for_communication = Column(Text, nullable=True)
    hometown = Column(String(100), nullable=True)
    district = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    pincode = Column(String(10), nullable=True)
    stay_type = Column(String(20), nullable=True)   # 'Day Scholar' | 'Hosteler'

    # Identity
    aadhar_no = Column(String(20), nullable=True)
    name_as_per_aadhar = Column(String(100), nullable=True)
    pan_number = Column(String(20), nullable=True)

    user = relationship("User", back_populates="student")