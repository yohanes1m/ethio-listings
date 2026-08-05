import pytest

from apps.favorites.models import Favorite
from apps.listings.models import Listing, ListingStatus
from .conftest import auth_client
from .factories import (
    BrokerFactory, CarDetailsFactory, FavoriteFactory, HouseDetailsFactory,
    LandDetailsFactory, ListingFactory, LocationFactory, MachineDetailsFactory, UserFactory,
)

pytestmark = pytest.mark.django_db


# ── Public listing list ───────────────────────────────────────────────────────

class TestPublicListings:
    def test_returns_active_listings(self, api_client, db):
        ListingFactory.create_batch(3)
        r = api_client.get("/api/listings/public/")
        assert r.status_code == 200
        assert len(r.data) == 3

    def test_excludes_inactive_listings(self, api_client, db):
        ListingFactory(status=ListingStatus.ACTIVE)
        ListingFactory(status=ListingStatus.SOLD)
        ListingFactory(status=ListingStatus.INACTIVE)
        r = api_client.get("/api/listings/public/")
        assert len(r.data) == 1

    def test_filter_by_category(self, api_client, db):
        ListingFactory(category="HOUSE")
        ListingFactory(category="CAR")
        r = api_client.get("/api/listings/public/?category=HOUSE")
        assert all(l["category"] == "HOUSE" for l in r.data)

    def test_filter_by_listing_type(self, api_client, db):
        ListingFactory(listing_type="SALE")
        ListingFactory(listing_type="RENT")
        r = api_client.get("/api/listings/public/?listing_type=RENT")
        assert all(l["listing_type"] == "RENT" for l in r.data)

    def test_filter_by_region(self, api_client, db):
        l1 = ListingFactory()
        l2 = ListingFactory()
        LocationFactory(listing=l1, region="Addis Ababa")
        LocationFactory(listing=l2, region="Oromia")
        r = api_client.get("/api/listings/public/?region=Addis+Ababa")
        assert len(r.data) == 1

    def test_filter_by_verified(self, api_client, db):
        ListingFactory(is_verified=True)
        ListingFactory(is_verified=False)
        r = api_client.get("/api/listings/public/?verified=true")
        assert all(l["is_verified"] for l in r.data)

    def test_price_range_filter(self, api_client, db):
        ListingFactory(price=1000000)
        ListingFactory(price=5000000)
        r = api_client.get("/api/listings/public/?price_max=2000000")
        assert len(r.data) == 1

    def test_search_by_title(self, api_client, db):
        ListingFactory(title="Spacious villa in Bole")
        ListingFactory(title="Studio apartment Kazanchis")
        r = api_client.get("/api/listings/public/?q=villa")
        assert len(r.data) == 1


# ── Featured listings ─────────────────────────────────────────────────────────

class TestFeaturedListings:
    def test_returns_only_featured_active(self, api_client, db):
        ListingFactory(is_featured=True, status=ListingStatus.ACTIVE)
        ListingFactory(is_featured=True, status=ListingStatus.SOLD)
        ListingFactory(is_featured=False, status=ListingStatus.ACTIVE)
        r = api_client.get("/api/listings/featured/")
        assert r.status_code == 200
        assert len(r.data) == 1


# ── Map pins ──────────────────────────────────────────────────────────────────

class TestMapListings:
    def test_returns_listings_with_coordinates(self, api_client, db):
        l1 = ListingFactory()
        l2 = ListingFactory()
        LocationFactory(listing=l1, lat="9.0300", lng="38.7400")
        LocationFactory(listing=l2, lat=None, lng=None)
        r = api_client.get("/api/listings/map/")
        assert r.status_code == 200
        assert len(r.data) == 1
        assert r.data[0]["lat"] is not None

    def test_map_filter_by_category(self, api_client, db):
        l1 = ListingFactory(category="HOUSE")
        l2 = ListingFactory(category="CAR")
        LocationFactory(listing=l1, lat="9.03", lng="38.74")
        LocationFactory(listing=l2, lat="9.04", lng="38.75")
        r = api_client.get("/api/listings/map/?category=HOUSE")
        assert len(r.data) == 1


# ── My listings ───────────────────────────────────────────────────────────────

class TestMyListings:
    def test_returns_own_listings_only(self, broker, broker_client, db):
        ListingFactory(user=broker)
        ListingFactory()  # another broker's listing
        r = broker_client.get("/api/listings/mine/")
        assert r.status_code == 200
        assert len(r.data) == 1

    def test_unauthenticated_cannot_access(self, api_client):
        r = api_client.get("/api/listings/mine/")
        assert r.status_code == 401


# ── Listing detail ────────────────────────────────────────────────────────────

class TestListingDetail:
    def test_returns_listing_data(self, api_client, db):
        listing = ListingFactory(title="Test Listing")
        r = api_client.get(f"/api/listings/{listing.id}/")
        assert r.status_code == 200
        assert r.data["title"] == "Test Listing"

    def test_view_count_increments(self, api_client, db):
        listing = ListingFactory()
        api_client.get(f"/api/listings/{listing.id}/")
        listing.refresh_from_db()
        assert listing.view_count == 1

    def test_includes_house_details(self, api_client, db):
        details = HouseDetailsFactory()
        r = api_client.get(f"/api/listings/{details.listing_id}/")
        assert r.status_code == 200
        assert r.data["house_details"] is not None
        assert r.data["house_details"]["bedrooms"] == 3


# ── Admin verify / feature ────────────────────────────────────────────────────

class TestAdminActions:
    def test_admin_can_verify_listing(self, admin_client, db):
        listing = ListingFactory(is_verified=False)
        r = admin_client.patch(f"/api/listings/{listing.id}/verify/")
        assert r.status_code == 200
        listing.refresh_from_db()
        assert listing.is_verified is True

    def test_admin_verify_toggles(self, admin_client, db):
        listing = ListingFactory(is_verified=True)
        admin_client.patch(f"/api/listings/{listing.id}/verify/")
        listing.refresh_from_db()
        assert listing.is_verified is False

    def test_non_admin_cannot_verify(self, broker_client, db):
        listing = ListingFactory()
        r = broker_client.patch(f"/api/listings/{listing.id}/verify/")
        assert r.status_code == 403

    def test_admin_can_feature_listing(self, admin_client, db):
        listing = ListingFactory(is_featured=False)
        r = admin_client.patch(f"/api/listings/{listing.id}/feature/")
        assert r.status_code == 200
        listing.refresh_from_db()
        assert listing.is_featured is True


# ── Per-category CRUD — houses ────────────────────────────────────────────────

class TestHouseCRUD:
    def test_list_houses_public(self, api_client, db):
        HouseDetailsFactory()
        r = api_client.get("/api/houses/")
        assert r.status_code == 200
        assert len(r.data) == 1

    def test_create_house_listing(self, broker_client):
        payload = {
            "title": "3BR Apartment",
            "listing_type": "SALE",
            "price": "3500000.00",
            "location": {"region": "Addis Ababa", "woreda": "Bole"},
            "details": {"house_type": "APARTMENT", "bedrooms": 3, "bathrooms": 2},
        }
        r = broker_client.post("/api/houses/", payload, format="json")
        assert r.status_code == 201
        assert Listing.objects.filter(category="HOUSE").count() == 1

    def test_unauthenticated_cannot_create(self, api_client):
        r = api_client.post("/api/houses/", {}, format="json")
        assert r.status_code == 401

    def test_owner_can_update_house(self, broker, db):
        listing = ListingFactory(user=broker, category="HOUSE")
        client = auth_client(broker)
        r = client.patch(f"/api/houses/{listing.id}/", {"title": "Updated"}, format="json")
        assert r.status_code == 200

    def test_non_owner_cannot_update_house(self, broker_client, db):
        other_broker = BrokerFactory()
        listing = ListingFactory(user=other_broker, category="HOUSE")
        r = broker_client.patch(f"/api/houses/{listing.id}/", {"title": "X"}, format="json")
        assert r.status_code == 403

    def test_owner_can_delete_house(self, broker, db):
        listing = ListingFactory(user=broker, category="HOUSE")
        client = auth_client(broker)
        r = client.delete(f"/api/houses/{listing.id}/")
        assert r.status_code == 204

    def test_non_owner_cannot_delete_house(self, broker_client, db):
        listing = ListingFactory(category="HOUSE")
        r = broker_client.delete(f"/api/houses/{listing.id}/")
        assert r.status_code == 403


# ── Per-category — cars ───────────────────────────────────────────────────────

class TestCarCRUD:
    def test_list_cars_public(self, api_client, db):
        CarDetailsFactory()
        r = api_client.get("/api/cars/")
        assert r.status_code == 200
        assert len(r.data) == 1

    def test_create_car_listing(self, broker_client):
        payload = {
            "title": "Toyota Land Cruiser",
            "listing_type": "SALE",
            "price": "4500000.00",
            "location": {"region": "Addis Ababa"},
            "details": {
                "make": "Toyota", "model": "Land Cruiser",
                "year": 2020, "transmission": "AUTOMATIC",
                "fuel_type": "DIESEL", "condition": "GOOD",
            },
        }
        r = broker_client.post("/api/cars/", payload, format="json")
        assert r.status_code == 201


# ── Favorites ─────────────────────────────────────────────────────────────────

class TestFavorites:
    def test_add_favorite(self, buyer, buyer_client, db):
        listing = ListingFactory()
        r = buyer_client.post("/api/favorites/", {"listing_id": str(listing.id)}, format="json")
        assert r.status_code == 201
        assert Favorite.objects.filter(user=buyer, listing=listing).exists()

    def test_idempotent_add(self, buyer, buyer_client, db):
        listing = ListingFactory()
        buyer_client.post("/api/favorites/", {"listing_id": str(listing.id)}, format="json")
        buyer_client.post("/api/favorites/", {"listing_id": str(listing.id)}, format="json")
        assert Favorite.objects.filter(user=buyer).count() == 1

    def test_list_favorites(self, buyer, buyer_client, db):
        FavoriteFactory(user=buyer)
        FavoriteFactory(user=buyer)
        r = buyer_client.get("/api/favorites/")
        assert r.status_code == 200
        assert len(r.data) == 2

    def test_remove_favorite(self, buyer, buyer_client, db):
        fav = FavoriteFactory(user=buyer)
        r = buyer_client.delete(f"/api/favorites/{fav.listing_id}/")
        assert r.status_code == 204
        assert not Favorite.objects.filter(user=buyer, listing=fav.listing).exists()

    def test_unauthenticated_cannot_favorite(self, api_client, db):
        listing = ListingFactory()
        r = api_client.post("/api/favorites/", {"listing_id": str(listing.id)}, format="json")
        assert r.status_code == 401


# ── Location endpoints ────────────────────────────────────────────────────────

class TestLocationEndpoints:
    def _seed(self, db):
        from apps.listings.models import EthiopianLocation
        EthiopianLocation.objects.create(region="Addis Ababa", zone=None, woreda="Bole")
        EthiopianLocation.objects.create(region="Oromia", zone="East Shewa", woreda=None)
        EthiopianLocation.objects.create(region="Oromia", zone="East Shewa", woreda="Adama")

    def test_regions_list(self, api_client, db):
        self._seed(db)
        r = api_client.get("/api/locations/regions/")
        assert r.status_code == 200
        assert "Addis Ababa" in r.data
        assert "Oromia" in r.data

    def test_zones_filtered_by_region(self, api_client, db):
        self._seed(db)
        r = api_client.get("/api/locations/zones/?region=Oromia")
        assert r.status_code == 200
        assert "East Shewa" in r.data

    def test_woredas_filtered_by_zone(self, api_client, db):
        self._seed(db)
        r = api_client.get("/api/locations/woredas/?zone=East+Shewa")
        assert r.status_code == 200
        assert "Adama" in r.data


# ── Stats endpoint ────────────────────────────────────────────────────────────

class TestStats:
    def test_returns_platform_stats(self, api_client, db):
        ListingFactory(status=ListingStatus.ACTIVE)
        r = api_client.get("/api/listings/stats/")
        assert r.status_code == 200
        assert "active_listings" in r.data
        assert "brokers" in r.data
        assert "regions_covered" in r.data
        assert "deals_closed" in r.data
        assert r.data["active_listings"] == 1
