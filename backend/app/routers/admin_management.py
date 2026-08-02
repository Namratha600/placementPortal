from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.models.user import User, RoleEnum
from app.schemas.admin import InviteAdminRequest, AdminListItem, SetPasswordRequest
from app.dependencies.auth_dependency import require_role, CurrentUser
from app.auth.hashing import hash_password
from app.config import settings
from app.services.invitation_service import (
    create_admin_invitation,
    get_effective_status,
    find_valid_invitation,
    accept_invitation,
)
from app.services.email_service import send_admin_invitation_email

router = APIRouter(prefix="/admin", tags=["Admin Management"])


@router.post("/invite", status_code=status.HTTP_201_CREATED)
async def invite_admin(
    payload: InviteAdminRequest,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_role("super_admin")),
):
    """
    Only the Super Admin can invite new admins (enforced by the
    require_role("super_admin") dependency above — this line alone is
    what makes this endpoint Super-Admin-only).
    """
    existing_user = db.query(User).filter(User.email == payload.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    new_admin = create_admin_invitation(db, payload.full_name, payload.email)

    set_password_link = f"{settings.FRONTEND_BASE_URL}/admin/set-password?token={new_admin.invitation_token}"
    await send_admin_invitation_email(payload.email, payload.full_name, set_password_link)

    return {
        "message": f"Invitation sent to {payload.email}.",
        "email": payload.email,
    }


@router.get("/list", response_model=list[AdminListItem])
def list_admins(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_role("super_admin")),
):
    """
    Returns every admin/super_admin account with their current invitation
    status. 'expired' is computed here (via get_effective_status), not
    stored — so a pending invite automatically shows as expired once its
    24-hour window passes, with no background job needed.
    """
    admins = (
        db.query(User)
        .filter(or_(User.role == RoleEnum.admin, User.role == RoleEnum.super_admin))
        .order_by(User.created_at.desc())
        .all()
    )

    return [
        AdminListItem(
            id=admin.id,
            full_name=admin.full_name,
            email=admin.email,
            role=admin.role.value,
            invitation_status=get_effective_status(admin),
        )
        for admin in admins
    ]


@router.post("/set-password", status_code=status.HTTP_200_OK)
def set_password(payload: SetPasswordRequest, db: Session = Depends(get_db)):
    """
    Public endpoint (no auth required) — this is exactly how an invited
    admin is meant to reach the system for the first time: via a token
    only they received by email, not a login.
    """
    user = find_valid_invitation(db, payload.token)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This invitation link is invalid, expired, or has already been used.",
        )

    password_hash = hash_password(payload.password)
    accept_invitation(db, user, password_hash)

    return {"message": "Password set successfully. You can now log in."}