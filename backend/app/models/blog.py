from sqlalchemy import (
    Column, Integer, String, Text, DateTime,
    ForeignKey, UniqueConstraint, func,
)
from app.database import Base


class Blog(Base):
    """
    An interview-experience blog written by a student.

    upvote_count is DENORMALIZED: it's kept in sync inside the same
    transaction that inserts/deletes a BlogUpvote row. This makes
    'sort by most upvoted' a plain indexed ORDER BY instead of a
    GROUP BY + aggregate on every list request.

    status: 'approved' | 'pending' | 'rejected'. Defaults to 'approved'
    so students publish immediately; the admin approval gate can be
    layered on later without a schema change.
    """
    __tablename__ = "blogs"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True, index=True)

    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    status = Column(String(20), nullable=False, default="approved", index=True)
    upvote_count = Column(Integer, nullable=False, default=0)

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class BlogUpvote(Base):
    """
    One row = one student's upvote on one blog. The unique (blog_id,
    student_id) constraint makes double-upvoting impossible at the DB level.
    """
    __tablename__ = "blog_upvotes"

    id = Column(Integer, primary_key=True, index=True)
    blog_id = Column(Integer, ForeignKey("blogs.id"), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    created_at = Column(DateTime, server_default=func.now())

    __table_args__ = (
        UniqueConstraint("blog_id", "student_id", name="uq_blog_upvote"),
    )