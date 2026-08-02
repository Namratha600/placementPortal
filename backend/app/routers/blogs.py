from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth_dependency import require_roles
from app.schemas.blog import (
    BlogCreate, BlogUpdate, BlogListOut, BlogDetailOut, UpvoteResult,
)
from app.services import blog_service

router = APIRouter(prefix="/blogs", tags=["Blogs"])

ANY_USER = require_roles("student", "admin", "super_admin")
STUDENT = require_roles("student")


@router.get("", response_model=BlogListOut)
def list_blogs(
    company_id: Optional[int] = Query(None, description="Filter blogs by company"),
    sort: str = Query("latest", description="latest | upvotes"),
    page: int = 1,
    page_size: int = 10,
    db: Session = Depends(get_db),
    user=Depends(ANY_USER),
):
    return blog_service.list_blogs(
        db, user, company_id=company_id, sort=sort, page=page, page_size=page_size
    )


@router.get("/{blog_id}", response_model=BlogDetailOut)
def get_blog(
    blog_id: int,
    db: Session = Depends(get_db),
    user=Depends(ANY_USER),
):
    return blog_service.get_blog(db, blog_id, user)


@router.post("", response_model=BlogDetailOut, status_code=status.HTTP_201_CREATED)
def create_blog(
    data: BlogCreate,
    db: Session = Depends(get_db),
    user=Depends(STUDENT),
):
    blog = blog_service.create_blog(db, data, user)
    # reuse the detail serializer so the response matches GET /blogs/{id}
    return blog_service.get_blog(db, blog.id, user)


@router.put("/{blog_id}", response_model=BlogDetailOut)
def update_blog(
    blog_id: int,
    data: BlogUpdate,
    db: Session = Depends(get_db),
    user=Depends(STUDENT),
):
    blog_service.update_blog(db, blog_id, data, user)
    return blog_service.get_blog(db, blog_id, user)


@router.delete("/{blog_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_blog(
    blog_id: int,
    db: Session = Depends(get_db),
    user=Depends(ANY_USER),   # author OR admin; enforced in the service
):
    blog_service.delete_blog(db, blog_id, user)
    return None


@router.post("/{blog_id}/upvote", response_model=UpvoteResult)
def toggle_upvote(
    blog_id: int,
    db: Session = Depends(get_db),
    user=Depends(STUDENT),
):
    return blog_service.toggle_upvote(db, blog_id, user)