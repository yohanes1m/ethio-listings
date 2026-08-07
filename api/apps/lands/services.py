from django.db import transaction

from apps.listings.models import Listing, ListingCategory, Location
from .models import LandDetails

_LISTING_CREATE_FIELDS = frozenset({
    "listing_type", "title", "title_am", "title_om",
    "description", "description_am", "description_om",
    "price", "price_unit", "price_negotiable",
})
_LISTING_UPDATE_FIELDS = _LISTING_CREATE_FIELDS | {"status"}


@transaction.atomic
def create_land_listing(user, data: dict) -> Listing:
    location_data = data.pop("location", {})
    details_data = data.pop("details", {})
    listing = Listing.objects.create(
        user=user,
        category=ListingCategory.LAND,
        **{k: v for k, v in data.items() if k in _LISTING_CREATE_FIELDS},
    )
    if location_data:
        Location.objects.create(listing=listing, **location_data)
    LandDetails.objects.create(listing=listing, **details_data)
    return listing


@transaction.atomic
def update_land_listing(user, pk, data: dict) -> Listing:
    listing = Listing.objects.get(pk=pk, category=ListingCategory.LAND)
    if listing.user != user and user.role != "ADMIN":
        from rest_framework.exceptions import PermissionDenied
        raise PermissionDenied()
    location_data = data.pop("location", {})
    details_data = data.pop("details", {})
    for field, value in data.items():
        if field in _LISTING_UPDATE_FIELDS:
            setattr(listing, field, value)
    listing.save()
    if location_data:
        Location.objects.filter(listing=listing).update(**location_data)
    if details_data:
        LandDetails.objects.filter(listing=listing).update(**details_data)
    return listing
