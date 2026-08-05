import io
from unittest.mock import patch, MagicMock

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile

from apps.media.models import ListingMedia
from .factories import BrokerFactory, ListingFactory, ListingMediaFactory

pytestmark = pytest.mark.django_db


def _jpg():
    return SimpleUploadedFile("test.jpg", b"\xff\xd8\xff" + b"\x00" * 100, content_type="image/jpeg")


# ── Upload ────────────────────────────────────────────────────────────────────

class TestMediaUpload:
    def test_local_upload_creates_media_record(self, broker, settings, tmp_path):
        settings.USE_CLOUDINARY = False
        settings.MEDIA_ROOT = str(tmp_path)
        listing = ListingFactory(user=broker)
        from .conftest import auth_client
        client = auth_client(broker)

        r = client.post(
            f"/api/media/listings/{listing.id}/media/",
            {"file": _jpg()},
            format="multipart",
        )
        assert r.status_code == 201
        assert ListingMedia.objects.filter(listing=listing).count() == 1
        assert r.data["url"].startswith("/media/uploads/")

    @patch("apps.media.services._upload_cloudinary")
    def test_cloudinary_upload_used_when_configured(self, mock_upload, broker, settings):
        settings.USE_CLOUDINARY = True
        mock_upload.return_value = {
            "url": "https://res.cloudinary.com/test/image/upload/v1/uploads/house/listing1/abc.jpg",
            "cloudinary_public_id": "uploads/house/listing1/abc",
        }
        listing = ListingFactory(user=broker)
        from .conftest import auth_client
        client = auth_client(broker)

        r = client.post(
            f"/api/media/listings/{listing.id}/media/",
            {"file": _jpg()},
            format="multipart",
        )
        assert r.status_code == 201
        assert r.data["url"].startswith("https://res.cloudinary.com")
        mock_upload.assert_called_once()

    def test_no_file_returns_400(self, broker_client, db):
        listing = ListingFactory()
        r = broker_client.post(
            f"/api/media/listings/{listing.id}/media/",
            {},
            format="multipart",
        )
        assert r.status_code == 400

    def test_unauthenticated_cannot_upload(self, api_client, db):
        listing = ListingFactory()
        r = api_client.post(
            f"/api/media/listings/{listing.id}/media/",
            {"file": _jpg()},
            format="multipart",
        )
        assert r.status_code == 401


# ── Delete ────────────────────────────────────────────────────────────────────

class TestMediaDelete:
    def test_delete_local_media(self, broker, settings, tmp_path):
        settings.USE_CLOUDINARY = False
        settings.MEDIA_ROOT = str(tmp_path)
        listing = ListingFactory(user=broker)
        media = ListingMediaFactory(listing=listing, url="/media/uploads/house/test/img.jpg")
        from .conftest import auth_client
        client = auth_client(broker)

        r = client.delete(f"/api/media/listings/{listing.id}/media/{media.id}/")
        assert r.status_code == 204
        assert not ListingMedia.objects.filter(pk=media.id).exists()

    @patch("apps.media.services._delete_cloudinary")
    def test_delete_cloudinary_media(self, mock_delete, broker, settings):
        settings.USE_CLOUDINARY = True
        listing = ListingFactory(user=broker)
        media = ListingMediaFactory(
            listing=listing,
            url="https://res.cloudinary.com/test/image/upload/v1/abc.jpg",
            cloudinary_public_id="uploads/house/listing1/abc",
        )
        from .conftest import auth_client
        client = auth_client(broker)

        client.delete(f"/api/media/listings/{listing.id}/media/{media.id}/")
        mock_delete.assert_called_once_with("uploads/house/listing1/abc")

    def test_unauthenticated_cannot_delete(self, api_client, db):
        listing = ListingFactory()
        media = ListingMediaFactory(listing=listing)
        r = api_client.delete(f"/api/media/listings/{listing.id}/media/{media.id}/")
        assert r.status_code == 401


# ── Set main image ────────────────────────────────────────────────────────────

class TestMediaPatch:
    def test_set_as_main_image(self, broker_client, db):
        listing = ListingFactory()
        m1 = ListingMediaFactory(listing=listing, is_main=True)
        m2 = ListingMediaFactory(listing=listing, is_main=False)

        r = broker_client.patch(
            f"/api/media/listings/{listing.id}/media/{m2.id}/",
            {"is_main": True},
            format="json",
        )
        assert r.status_code == 200
        m1.refresh_from_db()
        m2.refresh_from_db()
        assert m2.is_main is True
        assert m1.is_main is False

    def test_set_order(self, broker_client, db):
        listing = ListingFactory()
        media = ListingMediaFactory(listing=listing, order=0)

        r = broker_client.patch(
            f"/api/media/listings/{listing.id}/media/{media.id}/",
            {"order": 5},
            format="json",
        )
        assert r.status_code == 200
        media.refresh_from_db()
        assert media.order == 5
