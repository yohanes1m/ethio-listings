from decimal import Decimal
from django.db import transaction

from apps.listings.models import Listing, ListingStatus
from .models import Deal


@transaction.atomic
def close_deal(listing_id: str, broker, data: dict) -> Deal:
    from rest_framework.exceptions import PermissionDenied, ValidationError

    listing = Listing.objects.get(pk=listing_id)

    if listing.user != broker and getattr(broker, "role", None) != "ADMIN":
        raise PermissionDenied("You can only close your own listings.")

    if listing.status in (ListingStatus.SOLD, ListingStatus.RENTED):
        raise ValidationError({"detail": "This listing is already closed."})

    actual_price = data.get("actual_price")
    commission_rate = data.get("commission_rate")
    commission_amount = data.get("commission_amount")

    if actual_price and commission_rate and not commission_amount:
        commission_amount = Decimal(str(actual_price)) * Decimal(str(commission_rate)) / Decimal("100")

    new_status = (
        ListingStatus.RENTED
        if listing.listing_type == "RENT"
        else ListingStatus.SOLD
    )
    listing.status = new_status
    listing.save()

    deal = Deal.objects.create(
        listing=listing,
        closed_by=broker,
        co_broker_id=data.get("co_broker_id"),
        actual_price=actual_price,
        commission_rate=commission_rate,
        commission_amount=commission_amount,
        co_broker_split_pct=data.get("co_broker_split_pct"),
        notes=data.get("notes"),
    )
    return deal
