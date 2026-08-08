from fastapi import APIRouter, Depends, HTTPException, Header

from app.core.config import settings
from app.services.storage import supabase_client
from typing import Any

router = APIRouter(tags=["health"])


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/health/supabase")
def supabase_health() -> dict[str, Any]:
    client = supabase_client()
    if client is None:
        raise HTTPException(status_code=503, detail="Supabase client not configured")
    try:
        # attempt a lightweight storage list call
        bucket = client.storage.from_(settings.supabase_storage_bucket)
        files = bucket.list(limit=1)
        return {"status": "ok", "storage_sample": len(files)}
    except Exception as exc:
        raise HTTPException(status_code=503, detail=str(exc))


@router.post("/admin/test-notify")
def admin_test_notify(
    department_email: str | None = None,
    report_id: str | None = None,
    summary: str | None = None,
    x_internal_token: str | None = Header(None, alias="X-Internal-Token"),
):
    # Protect this endpoint with the internal service token
    if x_internal_token != settings.internal_service_token:
        raise HTTPException(status_code=403, detail="Forbidden")
    from app.services.notify import notify_department_by_email

    notify_department_by_email(department_email, report_id or "test-report", summary or "Test notification")
    return {"status": "notified", "email": department_email}
