from typing import Optional
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.student import Student
from app.models.placement_record import PlacementRecord
from app.models.company import Company


def get_placement_status(db: Session, register_number: str) -> dict:
    rn = register_number.strip()

    records = (
        db.query(PlacementRecord)
        .filter(func.lower(PlacementRecord.roll_number) == rn.lower())
        .order_by(PlacementRecord.package.desc())
        .all()
    )

    if not records:
        return {"is_placed": False, "total_offers": 0,
                "highest_package": None, "placements": []}

    # company id -> name
    cids = {r.company_id for r in records if r.company_id}
    cmap = {}
    if cids:
        for cid, cname in db.query(Company.id, Company.name).filter(Company.id.in_(cids)).all():
            cmap[cid] = cname

    placements = []
    highest = None
    for r in records:
        pkg = float(r.package) if r.package is not None else None
        if pkg is not None and (highest is None or pkg > highest):
            highest = pkg
        placements.append({
            "company": cmap.get(r.company_id, str(r.company_id)),
            "role": r.role,
            "package": pkg,
            "placement_date": r.placement_date.isoformat() if r.placement_date else None,
        })

    return {
        "is_placed": True,
        "total_offers": len(records),
        "highest_package": highest,
        "placements": placements,
    }