from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.dependencies.auth_dependency import require_roles  # added in step 7 below
from app.schemas.company import (
    CompanyCreate, CompanyUpdate, CompanyOut, CompanySearchItem,
)
from app.services import company_service
from app.services import analytics_service
from app.schemas.analytics import CompanyAnalyticsOut
router = APIRouter(prefix="/companies", tags=["Companies"])

ANY_USER = require_roles("student", "admin", "super_admin")
ADMIN = require_roles("admin", "super_admin")


@router.get("/search", response_model=List[CompanySearchItem])
def search_companies(
    q: str = Query("", description="Partial company name"),
    db: Session = Depends(get_db),
    _user=Depends(ANY_USER),
):
    return company_service.search_companies(db, q)


@router.get("")
def list_companies(
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    _user=Depends(ADMIN),
):
    return company_service.list_companies(db, page, page_size)


@router.get("/{company_id}", response_model=CompanyOut)
def get_company(
    company_id: int,
    db: Session = Depends(get_db),
    _user=Depends(ANY_USER),
):
    return company_service.get_company(db, company_id)
@router.get("/{company_id}/analytics", response_model=CompanyAnalyticsOut)

def get_company_analytics(
    company_id: int,
    db: Session = Depends(get_db),
    _user=Depends(ANY_USER),
):
    return analytics_service.get_company_analytics(db, company_id)

@router.post("", response_model=CompanyOut, status_code=status.HTTP_201_CREATED)
def create_company(
    data: CompanyCreate,
    db: Session = Depends(get_db),
    user=Depends(ADMIN),
):
    return company_service.create_company(db, data, created_by=None)

@router.put("/{company_id}", response_model=CompanyOut)
def update_company(
    company_id: int,
    data: CompanyUpdate,
    db: Session = Depends(get_db),
    _user=Depends(ADMIN),
):
    return company_service.update_company(db, company_id, data)


@router.delete("/{company_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_company(
    company_id: int,
    db: Session = Depends(get_db),
    _user=Depends(ADMIN),
):
    company_service.delete_company(db, company_id)
    return None