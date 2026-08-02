from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.company import Company
from app.schemas.company import CompanyCreate, CompanyUpdate


def search_companies(db: Session, q: str, limit: int = 10) -> List[Company]:
    q = (q or "").strip()
    if not q:
        return []
    return (
        db.query(Company)
        .filter(Company.name.ilike(f"%{q}%"))
        .order_by(Company.name.asc())
        .limit(limit)
        .all()
    )


def list_companies(db: Session, page: int = 1, page_size: int = 20):
    page = max(page, 1)
    total = db.query(func.count(Company.id)).scalar()
    items = (
        db.query(Company)
        .order_by(Company.name.asc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return {"total": total, "page": page, "page_size": page_size, "items": items}


def get_company(db: Session, company_id: int) -> Company:
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company


def create_company(db: Session, data: CompanyCreate, created_by: int) -> Company:
    name = data.name.strip()
    existing = db.query(Company).filter(func.lower(Company.name) == name.lower()).first()
    if existing:
        raise HTTPException(status_code=409, detail="A company with this name already exists")

    company = Company(
        name=name,
        description=data.description,
        website=data.website,
        logo_url=data.logo_url,
        created_by=created_by,
    )
    db.add(company)
    db.commit()
    db.refresh(company)
    return company


def update_company(db: Session, company_id: int, data: CompanyUpdate) -> Company:
    company = get_company(db, company_id)

    if data.name is not None:
        new_name = data.name.strip()
        clash = (
            db.query(Company)
            .filter(func.lower(Company.name) == new_name.lower(), Company.id != company_id)
            .first()
        )
        if clash:
            raise HTTPException(status_code=409, detail="Another company already uses this name")
        company.name = new_name

    if data.description is not None:
        company.description = data.description
    if data.website is not None:
        company.website = data.website
    if data.logo_url is not None:
        company.logo_url = data.logo_url

    db.commit()
    db.refresh(company)
    return company


def delete_company(db: Session, company_id: int) -> None:
    company = get_company(db, company_id)

    # Block deletion if placement history exists (auto-hide-over-auto-delete principle).
    # Uses a raw count so this file has no hard import dependency on the
    # PlacementRecord model, which arrives in Step B.
    from sqlalchemy import text
    record_count = db.execute(
        text("SELECT COUNT(*) FROM placement_records WHERE company_id = :cid"),
        {"cid": company_id},
    ).scalar() if _table_exists(db, "placement_records") else 0

    if record_count and record_count > 0:
        raise HTTPException(
            status_code=409,
            detail=f"Cannot delete: {record_count} placement record(s) reference this company.",
        )

    db.delete(company)
    db.commit()


def _table_exists(db: Session, table_name: str) -> bool:
    from sqlalchemy import text
    row = db.execute(
        text("SELECT COUNT(*) FROM information_schema.tables "
             "WHERE table_schema = DATABASE() AND table_name = :t"),
        {"t": table_name},
    ).scalar()
    return bool(row)