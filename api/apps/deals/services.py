from django.db import transaction

from apps.listings.models import Listing, ListingStatus
from .models import Deal


@transaction.atomic
def close_deal(listing_id: str, broker, data: dict) -> Deal:
    listing = Listing.objects.get(pk=listing_id)

    actual_price = data.get("actual_price")
    commission_rate = data.get("commission_rate")
    commission_amount = data.get("commission_amount")

    # Auto-calculate commission_amount if rate + price provided but amount not given
    if actual_price and commission_rate and not commission_amount:
        commission_amount = float(actual_price) * float(commission_rate) / 100

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
