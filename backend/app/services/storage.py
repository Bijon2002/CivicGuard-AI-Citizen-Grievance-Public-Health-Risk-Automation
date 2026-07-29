from pathlib import Path
from uuid import uuid4

from fastapi import UploadFile

from app.core.config import settings

try:
    from supabase import create_client
except Exception:  # pragma: no cover
    create_client = None


def storage_root() -> Path:
    root = Path(settings.storage_root)
    root.mkdir(parents=True, exist_ok=True)
    (root / "photos").mkdir(parents=True, exist_ok=True)
    return root


def supabase_client():
    if not settings.supabase_url or not settings.supabase_service_role_key or create_client is None:
        return None
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


async def save_photo(upload: UploadFile, report_id: str | None = None) -> str:
    client = supabase_client()
    suffix = Path(upload.filename or "photo.jpg").suffix or ".jpg"
    filename = f"{report_id or uuid4()}{suffix}"
    if client is not None:
        bucket = client.storage.from_(settings.supabase_storage_bucket)
        payload = await upload.read()
        bucket.upload(filename, payload, file_options={"content-type": upload.content_type or "image/jpeg", "upsert": "true"})
        public_url = bucket.get_public_url(filename)
        return public_url

    root = storage_root() / "photos"
    destination = root / filename
    content = await upload.read()
    destination.write_bytes(content)
    return f"/media/photos/{filename}"


def delete_photo(photo_url: str) -> None:
    if not photo_url.startswith("/media/photos/"):
        return
    path = storage_root() / photo_url.replace("/media/", "")
    if path.exists():
        path.unlink()
