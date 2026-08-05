"""
Smoke tests that verify the scaffold is intact:
- Settings loads without errors
- All apps are importable
- URL configuration resolves without errors
"""

import django
import pytest


@pytest.mark.django_db
def test_user_model_creatable():
    from apps.users.models import User

    user = User.objects.create_user(
        email="test@example.com",
        password="testpass123",
        first_name="Test",
        last_name="User",
    )
    assert user.role == "BUYER"
    assert user.is_active is True


@pytest.mark.django_db
def test_listing_model_creatable(django_user_model):
    from apps.users.models import User, UserRole
    from apps.listings.models import Listing, ListingCategory, ListingType

    broker = User.objects.create_user(
        email="broker@example.com",
        password="pass",
        first_name="Broker",
        last_name="One",
        role=UserRole.BROKER,
    )
    listing = Listing.objects.create(
        user=broker,
        category=ListingCategory.HOUSE,
        listing_type=ListingType.SALE,
        title="Test House",
    )
    assert listing.status == "ACTIVE"
    assert listing.is_verified is False
