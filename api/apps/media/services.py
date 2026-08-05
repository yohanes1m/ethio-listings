import os
import shutil
import uuid
from pathlib import Path

from django.conf import settings


def upload_file(file, listing_id: str, category: str) -> dict:
    if settings.USE_CLOUDINARY:
        return _upload_cloudinary(file, listing_id, category)
    return _upload_local(file, listing_id, category)


def delete_file(url_or_path: str, cloudinary_public_id: str = "") -> None:
    if settings.USE_CLOUDINARY and cloudinary_public_id:
        _delete_cloudinary(cloudinary_public_id)
    elif not settings.USE_CLOUDINARY:
        _delete_local(url_or_path)


def _upload_cloudinary(file, listing_id: str, category: str) -> dict:
    import cloudinary.uploader as uploader

    result = uploader.upload(
        file,
        folder=f"uploads/{category}/{listing_id}",
        resource_type="auto",
    )
    return {
        "url": result["secure_url"],
        "cloudinary_public_id": result["public_id"],
    }


def _delete_cloudinary(public_id: str) -> None:
    import cloudinary.uploader as uploader
    uploader.destroy(public_id)


def _upload_local(file, listing_id: str, category: str) -> dict:
    dest_dir = Path(settings.MEDIA_ROOT) / "uploads" / category / listing_id
    dest_dir.mkdir(parents=True, exist_ok=True)

    ext = Path(file.name).suffix if hasattr(file, "name") else ""
    filename = f"{uuid.uuid4().hex}{ext}"
    dest_path = dest_dir / filename

    with open(dest_path, "wb") as f:
        for chunk in file.chunks():
            f.write(chunk)

    relative_url = f"/media/uploads/{category}/{listing_id}/{filename}"
    return {"url": relative_url, "cloudinary_public_id": ""}


def _delete_local(url: str) -> None:
    if not url.startswith("/media/"):
        return
    path = Path(settings.MEDIA_ROOT) / url.removeprefix("/media/").lstrip("/")
    if path.exists():
        path.unlink(missing_ok=True)
