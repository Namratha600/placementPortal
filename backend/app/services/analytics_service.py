"""
Company analytics, computed live from placement_records.

Every value here is an AGGREGATE (count / max / avg / group-by). No function
in this module returns an individual placement record, which is what makes the
analytics endpoint safe to expose to students.

All aggregates ignore NULLs the way SQL naturally does:
  - MAX/AVG(package) skip rows with no package
  - COUNT(*) counts every hire regardless
"""
from typing import Optional

from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.company import Company
from app.models.placement_record import PlacementRecord


def get_company_analytics(db: Session, company_id: int) -> dict:
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    base = db.query(PlacementRecord).filter(
        PlacementRecord.company_id == company_id
    )

    # --- headline cards: total hires, highest & average package ---
    totals = (
        db.query(
            func.count(PlacementRecord.id),
            func.max(PlacementRecord.package),
            func.avg(PlacementRecord.package),
        )
        .filter(PlacementRecord.company_id == company_id)
        .one()
    )
    total_hires = int(totals[0] or 0)
    highest_package = float(totals[1]) if totals[1] is not None else None
    average_package = round(float(totals[2]), 2) if totals[2] is not None else None

    # --- year-wise (bar chart) ---
    year_rows = (
        db.query(PlacementRecord.graduation_year, func.count(PlacementRecord.id))
        .filter(PlacementRecord.company_id == company_id)
        .group_by(PlacementRecord.graduation_year)
        .order_by(PlacementRecord.graduation_year.asc())
        .all()
    )
    year_wise = [{"year": y, "count": int(c)} for (y, c) in year_rows]

    # --- branch-wise (pie chart) ---
    branch_rows = (
        db.query(PlacementRecord.branch, func.count(PlacementRecord.id))
        .filter(PlacementRecord.company_id == company_id)
        .group_by(PlacementRecord.branch)
        .order_by(func.count(PlacementRecord.id).desc())
        .all()
    )
    branch_wise = [{"branch": b, "count": int(c)} for (b, c) in branch_rows]

    # --- roles hired (list) ---
    role_rows = (
        db.query(PlacementRecord.role, func.count(PlacementRecord.id))
        .filter(PlacementRecord.company_id == company_id)
        .group_by(PlacementRecord.role)
        .order_by(func.count(PlacementRecord.id).desc())
        .all()
    )
    roles = [{"role": r, "count": int(c)} for (r, c) in role_rows]

    return {
        "company": {
            "id": company.id,
            "name": company.name,
            "description": company.description,
            "website": company.website,
            "logo_url": company.logo_url,
        },
        "total_hires": total_hires,
        "highest_package": highest_package,
        "average_package": average_package,
        "year_wise": year_wise,
        "branch_wise": branch_wise,
        "roles": roles,
    }