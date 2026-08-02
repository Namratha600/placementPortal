from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.dependencies.auth_dependency import require_roles
from app.schemas.notification import (
    NotificationListOut, UnreadCountOut, BroadcastRequest, BroadcastResult,
    BroadcastHistoryItem, BroadcastAnalytics,
)
from app.services import notification_service

router = APIRouter(prefix="/notifications", tags=["Notifications"])

STUDENT = require_roles("student")
ADMIN = require_roles("admin", "super_admin")


@router.get("", response_model=NotificationListOut)
def list_notifications(db: Session = Depends(get_db), user=Depends(STUDENT)):
    return notification_service.list_notifications(db, user)


@router.get("/unread-count", response_model=UnreadCountOut)
def unread_count(db: Session = Depends(get_db), user=Depends(STUDENT)):
    return notification_service.unread_count(db, user)


@router.post("/{notif_id}/read", status_code=status.HTTP_204_NO_CONTENT)
def mark_read(notif_id: int, db: Session = Depends(get_db), user=Depends(STUDENT)):
    notification_service.mark_read(db, user, notif_id)
    return None


@router.post("/read-all", status_code=status.HTTP_204_NO_CONTENT)
def mark_all_read(db: Session = Depends(get_db), user=Depends(STUDENT)):
    notification_service.mark_all_read(db, user)
    return None


@router.post("/broadcast", response_model=BroadcastResult)
def broadcast(data: BroadcastRequest, db: Session = Depends(get_db), user=Depends(ADMIN)):
    return notification_service.broadcast(db, data, user)


# ---- Admin: history + analytics ----

@router.get("/broadcasts", response_model=List[BroadcastHistoryItem])
def list_broadcasts(db: Session = Depends(get_db), _user=Depends(ADMIN)):
    return notification_service.list_broadcasts(db)


@router.get("/broadcasts/{broadcast_id}", response_model=BroadcastAnalytics)
def broadcast_analytics(broadcast_id: int, db: Session = Depends(get_db), _user=Depends(ADMIN)):
    return notification_service.broadcast_analytics(db, broadcast_id)