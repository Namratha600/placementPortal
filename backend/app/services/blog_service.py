"""
Business logic for interview-experience blogs.

Author identity is resolved the same way the existing /students/me/* routes
do it: map current_user.user_id -> students.id. A user whose token isn't
linked to a student row can't author, edit, or upvote blogs.
"""
from typing import Optional, List, Dict

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.blog import Blog, BlogUpvote
from app.models.company import Company
from app.models.student import Student


# ---------------------------------------------------------------------------
# Identity helpers
# ---------------------------------------------------------------------------
def _resolve_student(db: Session, current_user) -> Student:
    """current_user.user_id (a users.id) -> the matching Student row."""
    student = (
        db.query(Student)
        .filter(Student.user_id == current_user.user_id)
        .first()
    )
    if not student:
        raise HTTPException(
            status_code=403,
            detail="Only students can perform this action.",
        )
    return student


def _current_student_id_or_none(db: Session, current_user) -> Optional[int]:
    """Like _resolve_student but returns None for non-students (e.g. admins)
    so read endpoints still work for them."""
    student = (
        db.query(Student)
        .filter(Student.user_id == current_user.user_id)
        .first()
    )
    return student.id if student else None


def _is_admin(current_user) -> bool:
    return current_user.role in ("admin", "super_admin")


# ---------------------------------------------------------------------------
# Create / Update / Delete
# ---------------------------------------------------------------------------
def create_blog(db: Session, data, current_user) -> Blog:
    student = _resolve_student(db, current_user)

    if data.company_id is not None:
        exists = db.query(Company.id).filter(Company.id == data.company_id).first()
        if not exists:
            raise HTTPException(status_code=404, detail="Company not found")

    blog = Blog(
        student_id=student.id,
        company_id=data.company_id,
        title=data.title.strip(),
        content=data.content.strip(),
        status="approved",   # publish immediately; approval gate added later
        upvote_count=0,
    )
    db.add(blog)
    db.commit()
    db.refresh(blog)
    return blog


def update_blog(db: Session, blog_id: int, data, current_user) -> Blog:
    blog = _get_blog_or_404(db, blog_id)
    student = _resolve_student(db, current_user)

    # only the author may edit (admins do NOT get edit rights, only delete)
    if blog.student_id != student.id:
        raise HTTPException(status_code=403, detail="You can only edit your own blog.")

    if data.title is not None:
        blog.title = data.title.strip()
    if data.content is not None:
        blog.content = data.content.strip()
    if data.company_id is not None:
        exists = db.query(Company.id).filter(Company.id == data.company_id).first()
        if not exists:
            raise HTTPException(status_code=404, detail="Company not found")
        blog.company_id = data.company_id

    db.commit()
    db.refresh(blog)
    return blog


def delete_blog(db: Session, blog_id: int, current_user) -> None:
    blog = _get_blog_or_404(db, blog_id)

    if _is_admin(current_user):
        pass  # admins/super_admins can delete any blog (moderation)
    else:
        student = _resolve_student(db, current_user)
        if blog.student_id != student.id:
            raise HTTPException(status_code=403, detail="You can only delete your own blog.")

    # remove upvotes first to satisfy the FK, then the blog (single transaction)
    db.query(BlogUpvote).filter(BlogUpvote.blog_id == blog_id).delete()
    db.delete(blog)
    db.commit()


# ---------------------------------------------------------------------------
# Read
# ---------------------------------------------------------------------------
def get_blog(db: Session, blog_id: int, current_user) -> dict:
    blog = _get_blog_or_404(db, blog_id)
    me = _current_student_id_or_none(db, current_user)

    has_upvoted = False
    if me is not None:
        has_upvoted = (
            db.query(BlogUpvote.id)
            .filter(BlogUpvote.blog_id == blog_id, BlogUpvote.student_id == me)
            .first()
            is not None
        )

    author_name = _author_name(db, blog.student_id)
    company_name = _company_name(db, blog.company_id)

    return {
        "id": blog.id,
        "title": blog.title,
        "content": blog.content,
        "author_name": author_name,
        "student_id": blog.student_id,
        "company_id": blog.company_id,
        "company_name": company_name,
        "status": blog.status,
        "upvote_count": blog.upvote_count,
        "has_upvoted": has_upvoted,
        "is_author": (me is not None and me == blog.student_id),
        "created_at": blog.created_at,
        "updated_at": blog.updated_at,
    }


def list_blogs(
    db: Session,
    current_user,
    company_id: Optional[int] = None,
    sort: str = "latest",
    page: int = 1,
    page_size: int = 10,
) -> dict:
    page = max(page, 1)
    page_size = min(max(page_size, 1), 50)
    me = _current_student_id_or_none(db, current_user)

    q = db.query(Blog).filter(Blog.status == "approved")
    if company_id is not None:
        q = q.filter(Blog.company_id == company_id)

    if sort == "upvotes":
        q = q.order_by(Blog.upvote_count.desc(), Blog.created_at.desc())
    else:  # 'latest' (default)
        q = q.order_by(Blog.created_at.desc())

    total = q.count()
    blogs = q.offset((page - 1) * page_size).limit(page_size).all()

    # which of these has the current student upvoted? one query, not N.
    upvoted_ids = set()
    if me is not None and blogs:
        ids = [b.id for b in blogs]
        rows = (
            db.query(BlogUpvote.blog_id)
            .filter(BlogUpvote.student_id == me, BlogUpvote.blog_id.in_(ids))
            .all()
        )
        upvoted_ids = {r[0] for r in rows}

    # author + company names (small maps to avoid per-row queries)
    author_names = _author_name_map(db, [b.student_id for b in blogs])
    company_names = _company_name_map(db, [b.company_id for b in blogs if b.company_id])

    items = [{
        "id": b.id,
        "title": b.title,
        "author_name": author_names.get(b.student_id),
        "company_id": b.company_id,
        "company_name": company_names.get(b.company_id),
        "upvote_count": b.upvote_count,
        "has_upvoted": b.id in upvoted_ids,
        "is_author": (me is not None and me == b.student_id),
        "created_at": b.created_at,
    } for b in blogs]

    return {"total": total, "page": page, "page_size": page_size, "items": items}


# ---------------------------------------------------------------------------
# Upvote toggle
# ---------------------------------------------------------------------------
def toggle_upvote(db: Session, blog_id: int, current_user) -> dict:
    blog = _get_blog_or_404(db, blog_id)
    student = _resolve_student(db, current_user)

    existing = (
        db.query(BlogUpvote)
        .filter(BlogUpvote.blog_id == blog_id, BlogUpvote.student_id == student.id)
        .first()
    )

    try:
        if existing:
            db.delete(existing)
            blog.upvote_count = max((blog.upvote_count or 0) - 1, 0)
            upvoted = False
        else:
            db.add(BlogUpvote(blog_id=blog_id, student_id=student.id))
            blog.upvote_count = (blog.upvote_count or 0) + 1
            upvoted = True
        db.commit()
        db.refresh(blog)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Upvote failed: {e}")

    return {"blog_id": blog_id, "upvoted": upvoted, "upvote_count": blog.upvote_count}


# ---------------------------------------------------------------------------
# small internal helpers
# ---------------------------------------------------------------------------
def _get_blog_or_404(db: Session, blog_id: int) -> Blog:
    blog = db.query(Blog).filter(Blog.id == blog_id).first()
    if not blog:
        raise HTTPException(status_code=404, detail="Blog not found")
    return blog


def _author_name(db: Session, student_id: int) -> Optional[str]:
    s = db.query(Student.full_name).filter(Student.id == student_id).first()
    return s[0] if s else None


def _company_name(db: Session, company_id: Optional[int]) -> Optional[str]:
    if company_id is None:
        return None
    c = db.query(Company.name).filter(Company.id == company_id).first()
    return c[0] if c else None


def _author_name_map(db: Session, student_ids: List[int]) -> Dict[int, str]:
    ids = list({sid for sid in student_ids if sid is not None})
    if not ids:
        return {}
    rows = db.query(Student.id, Student.full_name).filter(Student.id.in_(ids)).all()
    return {r[0]: r[1] for r in rows}


def _company_name_map(db: Session, company_ids: List[int]) -> Dict[int, str]:
    ids = list({cid for cid in company_ids if cid is not None})
    if not ids:
        return {}
    rows = db.query(Company.id, Company.name).filter(Company.id.in_(ids)).all()
    return {r[0]: r[1] for r in rows}