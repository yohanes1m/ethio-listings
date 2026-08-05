import pytest

from apps.listings.models import Listing
from apps.submissions.models import ListingRequest, SubmissionStatus
from .conftest import auth_client
from .factories import AdminFactory, BrokerFactory, ListingRequestFactory, UserFactory

pytestmark = pytest.mark.django_db

SUBMIT_PAYLOAD = {
    "category": "HOUSE",
    "listing_type": "SALE",
    "region": "Addis Ababa",
    "woreda": "Bole",
    "owner_phone": "+251911000000",
    "details": {"title": "3BR apartment", "price": 3500000},
    "photos": [],
}


# ── Submit (POST /api/submissions/) ──────────────────────────────────────────

class TestSubmit:
    def test_authenticated_buyer_can_submit(self, buyer_client):
        r = buyer_client.post("/api/submissions/", SUBMIT_PAYLOAD, format="json")
        assert r.status_code == 201
        assert r.data["status"] == SubmissionStatus.PENDING

    def test_submission_linked_to_requester(self, buyer, buyer_client):
        buyer_client.post("/api/submissions/", SUBMIT_PAYLOAD, format="json")
        assert ListingRequest.objects.filter(owner=buyer).count() == 1

    def test_unauthenticated_cannot_submit(self, api_client):
        r = api_client.post("/api/submissions/", SUBMIT_PAYLOAD, format="json")
        assert r.status_code == 401

    def test_missing_required_field_rejected(self, buyer_client):
        bad = {**SUBMIT_PAYLOAD}
        del bad["region"]
        r = buyer_client.post("/api/submissions/", bad, format="json")
        assert r.status_code == 400


# ── Queue (GET /api/submissions/) ────────────────────────────────────────────

class TestSubmissionQueue:
    def test_broker_sees_all_submissions(self, broker_client, db):
        ListingRequestFactory.create_batch(3)
        r = broker_client.get("/api/submissions/")
        assert r.status_code == 200
        assert len(r.data) == 3

    def test_admin_sees_all_submissions(self, admin_client, db):
        ListingRequestFactory.create_batch(2)
        r = admin_client.get("/api/submissions/")
        assert r.status_code == 200
        assert len(r.data) == 2

    def test_buyer_cannot_see_queue(self, buyer_client):
        r = buyer_client.get("/api/submissions/")
        assert r.status_code == 403

    def test_unauthenticated_cannot_see_queue(self, api_client):
        r = api_client.get("/api/submissions/")
        assert r.status_code == 401

    def test_status_filter_works(self, broker_client, db):
        ListingRequestFactory(status=SubmissionStatus.PENDING)
        ListingRequestFactory(status=SubmissionStatus.APPROVED)
        r = broker_client.get("/api/submissions/?status=PENDING")
        assert r.status_code == 200
        assert all(s["status"] == "PENDING" for s in r.data)


# ── My submissions (GET /api/submissions/mine/) ───────────────────────────────

class TestMySubmissions:
    def test_owner_sees_only_own_submissions(self, buyer, buyer_client, db):
        ListingRequestFactory(owner=buyer)
        ListingRequestFactory()  # belongs to a different user
        r = buyer_client.get("/api/submissions/mine/")
        assert r.status_code == 200
        assert len(r.data) == 1

    def test_unauthenticated_cannot_access(self, api_client):
        r = api_client.get("/api/submissions/mine/")
        assert r.status_code == 401


# ── Detail + patch (GET/PATCH /api/submissions/<id>/) ────────────────────────

class TestSubmissionDetail:
    def test_broker_can_view_detail(self, broker_client, db):
        sub = ListingRequestFactory()
        r = broker_client.get(f"/api/submissions/{sub.id}/")
        assert r.status_code == 200
        assert str(r.data["id"]) == str(sub.id)

    def test_buyer_cannot_view_detail(self, buyer_client, db):
        sub = ListingRequestFactory()
        r = buyer_client.get(f"/api/submissions/{sub.id}/")
        assert r.status_code == 403

    def test_broker_can_update_status(self, broker, broker_client, db):
        sub = ListingRequestFactory()
        r = broker_client.patch(
            f"/api/submissions/{sub.id}/",
            {"status": "CONTACTED", "broker_notes": "Called owner"},
            format="json",
        )
        assert r.status_code == 200
        sub.refresh_from_db()
        assert sub.status == SubmissionStatus.CONTACTED
        assert sub.broker_notes == "Called owner"

    def test_admin_can_delete_submission(self, admin_client, db):
        sub = ListingRequestFactory()
        r = admin_client.delete(f"/api/submissions/{sub.id}/")
        assert r.status_code == 204
        assert not ListingRequest.objects.filter(pk=sub.id).exists()

    def test_broker_cannot_delete_submission(self, broker_client, db):
        sub = ListingRequestFactory()
        r = broker_client.delete(f"/api/submissions/{sub.id}/")
        assert r.status_code == 403


# ── Approve (POST /api/submissions/<id>/approve/) ────────────────────────────

class TestSubmissionApprove:
    def test_approve_creates_listing(self, broker, broker_client, db):
        sub = ListingRequestFactory()
        r = broker_client.post(f"/api/submissions/{sub.id}/approve/")
        assert r.status_code == 201
        assert Listing.objects.count() == 1

    def test_approve_links_submission_to_listing(self, broker_client, db):
        sub = ListingRequestFactory()
        broker_client.post(f"/api/submissions/{sub.id}/approve/")
        sub.refresh_from_db()
        assert sub.listing is not None
        assert sub.status == SubmissionStatus.APPROVED

    def test_approved_listing_has_correct_location(self, broker_client, db):
        sub = ListingRequestFactory(region="Oromia", woreda="Adama")
        broker_client.post(f"/api/submissions/{sub.id}/approve/")
        listing = Listing.objects.first()
        assert listing.location.region == "Oromia"
        assert listing.location.woreda == "Adama"

    def test_buyer_cannot_approve(self, buyer_client, db):
        sub = ListingRequestFactory()
        r = buyer_client.post(f"/api/submissions/{sub.id}/approve/")
        assert r.status_code == 403
