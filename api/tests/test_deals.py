import pytest

from apps.deals.models import Deal
from apps.listings.models import ListingStatus
from .conftest import auth_client
from .factories import BrokerFactory, DealFactory, ListingFactory

pytestmark = pytest.mark.django_db


# ── Close deal ────────────────────────────────────────────────────────────────

class TestCloseDeal:
    def test_sale_listing_marked_sold(self, broker, db):
        listing = ListingFactory(user=broker, listing_type="SALE")
        client = auth_client(broker)
        r = client.post(f"/api/deals/listings/{listing.id}/close/", {}, format="json")
        assert r.status_code == 201
        listing.refresh_from_db()
        assert listing.status == ListingStatus.SOLD

    def test_rental_listing_marked_rented(self, broker, db):
        listing = ListingFactory(user=broker, listing_type="RENT")
        client = auth_client(broker)
        r = client.post(f"/api/deals/listings/{listing.id}/close/", {}, format="json")
        assert r.status_code == 201
        listing.refresh_from_db()
        assert listing.status == ListingStatus.RENTED

    def test_skip_all_fields_still_creates_deal(self, broker, db):
        listing = ListingFactory(user=broker)
        client = auth_client(broker)
        r = client.post(f"/api/deals/listings/{listing.id}/close/", {}, format="json")
        assert r.status_code == 201
        deal = Deal.objects.get(listing=listing)
        assert deal.actual_price is None
        assert deal.commission_amount is None

    def test_commission_auto_calculated(self, broker, db):
        listing = ListingFactory(user=broker)
        client = auth_client(broker)
        r = client.post(f"/api/deals/listings/{listing.id}/close/", {
            "actual_price": "2500000",
            "commission_rate": "3",
        }, format="json")
        assert r.status_code == 201
        deal = Deal.objects.get(listing=listing)
        assert float(deal.commission_amount) == 75000.0

    def test_commission_not_overridden_when_given(self, broker, db):
        listing = ListingFactory(user=broker)
        client = auth_client(broker)
        r = client.post(f"/api/deals/listings/{listing.id}/close/", {
            "actual_price": "2500000",
            "commission_rate": "3",
            "commission_amount": "50000",
        }, format="json")
        assert r.status_code == 201
        deal = Deal.objects.get(listing=listing)
        assert float(deal.commission_amount) == 50000.0

    def test_co_broker_recorded(self, broker, db):
        listing = ListingFactory(user=broker)
        co = BrokerFactory()
        client = auth_client(broker)
        r = client.post(f"/api/deals/listings/{listing.id}/close/", {
            "co_broker_id": str(co.id),
            "co_broker_split_pct": "40",
        }, format="json")
        assert r.status_code == 201
        deal = Deal.objects.get(listing=listing)
        assert deal.co_broker == co
        assert float(deal.co_broker_split_pct) == 40.0

    def test_buyer_cannot_close_deal(self, buyer_client, db):
        listing = ListingFactory()
        r = buyer_client.post(f"/api/deals/listings/{listing.id}/close/", {}, format="json")
        assert r.status_code == 403

    def test_unauthenticated_cannot_close_deal(self, api_client, db):
        listing = ListingFactory()
        r = api_client.post(f"/api/deals/listings/{listing.id}/close/", {}, format="json")
        assert r.status_code == 401


# ── Deal list ─────────────────────────────────────────────────────────────────

class TestDealList:
    def test_broker_sees_only_own_deals(self, broker, db):
        DealFactory(closed_by=broker)
        DealFactory()  # another broker's deal
        client = auth_client(broker)
        r = client.get("/api/deals/")
        assert r.status_code == 200
        assert len(r.data) == 1

    def test_admin_sees_all_deals(self, admin_client, db):
        DealFactory.create_batch(3)
        r = admin_client.get("/api/deals/")
        assert r.status_code == 200
        assert len(r.data) == 3

    def test_buyer_cannot_list_deals(self, buyer_client):
        r = buyer_client.get("/api/deals/")
        assert r.status_code == 403

    def test_unauthenticated_cannot_list_deals(self, api_client):
        r = api_client.get("/api/deals/")
        assert r.status_code == 401


# ── Deal summary ──────────────────────────────────────────────────────────────

class TestDealSummary:
    def test_broker_summary_counts_own_deals(self, broker, db):
        DealFactory(closed_by=broker, commission_amount=100000)
        DealFactory(closed_by=broker, commission_amount=75000)
        DealFactory()  # another broker — should not count
        client = auth_client(broker)
        r = client.get("/api/deals/summary/")
        assert r.status_code == 200
        assert r.data["deals_count"] == 2
        assert float(r.data["total_commission"]) == 175000.0

    def test_admin_summary_counts_all_deals(self, admin_client, db):
        DealFactory.create_batch(3, commission_amount=50000)
        r = admin_client.get("/api/deals/summary/")
        assert r.status_code == 200
        assert r.data["deals_count"] == 3
        assert float(r.data["total_commission"]) == 150000.0

    def test_summary_with_no_deals_returns_zeros(self, broker_client):
        r = broker_client.get("/api/deals/summary/")
        assert r.status_code == 200
        assert r.data["deals_count"] == 0
        assert r.data["total_commission"] == 0

    def test_buyer_cannot_access_summary(self, buyer_client):
        r = buyer_client.get("/api/deals/summary/")
        assert r.status_code == 403
