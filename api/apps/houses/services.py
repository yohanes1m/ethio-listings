from django.db import transaction

from apps.listings.models import Listing, ListingCategory, Location
from .models import HouseDetails


@transaction.atomic
def create_house_listing(user, data: dict) -> Listing:
    location_data = data.pop("location", {})
    details_data = data.pop("details", {})

    listing = Listing.objects.create(
        user=user,
        category=ListingCategory.HOUSE,
        **{k: v for k, v in data.items() if hasattr(Listing, k)},
    )
    if location_data:
        Location.objects.create(listing=listing, **location_data)
    HouseDetails.objects.create(listing=listing, **details_data)
    return listing


@transaction.atomic
def update_house_listing(user, pk, data: dict) -> Listing:
    from apps.common.permissions import IsOwnerOrAdmin
    from rest_framework.request import Request

    listing = Listing.objects.get(pk=pk, category=ListingCategory.HOUSE)
    if listing.user != user and user.role not in ("BROKER", "ADMIN"):
        from rest_framework.exceptions import PermissionDenied
        raise PermissionDenied()

    location_data = data.pop("location", {})
    details_data = data.pop("details", {})

    for field, value in data.items():
        if hasattr(listing, field):
            setattr(listing, field, value)
    listing.save()

    if location_data:
        Location.objects.filter(listing=listing).update(**location_data)
    if details_data:
        HouseDetails.objects.filter(listing=listing).update(**details_data)

    return listing
