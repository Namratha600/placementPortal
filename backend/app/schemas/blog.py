from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, field_validator


class BlogCreate(BaseModel):
    title: str
    content: str
    company_id: Optional[int] = None

    @field_validator("title")
    @classmethod
    def title_len(cls, v):
        if v is None:
            return v
        v = v.strip()
        if len(v) < 3:
            raise ValueError("Title must be at least 3 characters")
        if len(v) > 150:
            raise ValueError("Title must be 150 characters or fewer")
        return v

    @field_validator("content")
    @classmethod
    def content_len(cls, v):
        if v is None:
            return v
        v = v.strip()
        if len(v) < 10:
            raise ValueError("Content must be at least 10 characters")
        if len(v) > 20000:
            raise ValueError("Content must be 20,000 characters or fewer")
        return v


class BlogUpdate(BaseModel):
    """Partial update — author edits their own blog."""
    title: Optional[str] = None
    content: Optional[str] = None
    company_id: Optional[int] = None


class BlogListItem(BaseModel):
    """Lightweight card for the blog list (no full content)."""
    id: int
    title: str
    author_name: Optional[str] = None
    company_id: Optional[int] = None
    company_name: Optional[str] = None
    upvote_count: int
    has_upvoted: bool = False
    is_author: bool = False
    created_at: datetime


class BlogListOut(BaseModel):
    total: int
    page: int
    page_size: int
    items: List[BlogListItem]


class BlogDetailOut(BaseModel):
    """Full blog view including content."""
    id: int
    title: str
    content: str
    author_name: Optional[str] = None
    student_id: int
    company_id: Optional[int] = None
    company_name: Optional[str] = None
    status: str
    upvote_count: int
    has_upvoted: bool = False
    is_author: bool = False
    created_at: datetime
    updated_at: datetime


class UpvoteResult(BaseModel):
    blog_id: int
    upvoted: bool          # True = now upvoted, False = upvote removed
    upvote_count: int