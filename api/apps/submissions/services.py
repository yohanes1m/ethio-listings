from django.db import transaction

from apps.listings.models import Listing, ListingCategory, ListingStatus, Location
from .models import ListingRequest, SubmissionStatus


@transaction.atomic
def approve_submission(submission_id: str, broker) -> Listing:
    submission = ListingRequest.objects.get(pk=submission_id)
    details = submission.details or {}

    listing = Listing.objects.create(
        user=broker,
        category=submission.category,
        listing_type=submission.listing_type,
        title=details.get("title", f"{submission.category.capitalize()} listing"),
        title_am=details.get("title_am") or None,
        description=details.get("description") or None,
        description_am=details.get("description_am") or None,
        price=details.get("price") or None,
        price_unit=details.get("price_unit") or None,
        price_negotiable=bool(details.get("price_negotiable", False)),
        status=ListingStatus.ACTIVE,
    )

    Location.objects.create(
        listing=listing,
        region=submission.region or "",
        zone=submission.zone or "",
        woreda=submission.woreda or "",
        address=submission.address or "",
    )

    _create_category_details(listing, submission.category, details)

    submission.listing = listing
    submission.status = SubmissionStatus.APPROVED
    submission.save()

    return listing


def _create_category_details(listing: Listing, category: str, details: dict) -> None:
    if category == ListingCategory.HOUSE:
        from apps.houses.models import HouseDetails
        HouseDetails.objects.create(
            listing=listing,
            house_type=details.get("house_type", "APARTMENT"),
            bedrooms=details.get("bedrooms") or None,
            bathrooms=details.get("bathrooms") or None,
            area_sqm=details.get("area_sqm") or None,
            furnished=bool(details.get("furnished", False)),
            parking=bool(details.get("parking", False)),
        )
    elif category == ListingCategory.CAR:
        from apps.cars.models import CarDetails
        CarDetails.objects.create(
            listing=listing,
            make=details.get("make", ""),
            model=details.get("model", ""),
            year=details.get("year") or None,
            mileage_km=details.get("mileage_km") or None,
            transmission=details.get("transmission", "AUTOMATIC"),
            fuel_type=details.get("fuel_type", "PETROL"),
            condition=details.get("condition", "GOOD"),
            color=details.get("color") or None,
        )
    elif category == ListingCategory.LAND:
        from apps.lands.models import LandDetails
        LandDetails.objects.create(
            listing=listing,
            total_area=details.get("total_area") or 0,
            area_unit=details.get("area_unit", "SQM"),
            land_use=details.get("land_use", "RESIDENTIAL"),
            has_title_deed=bool(details.get("has_title_deed", False)),
            road_access=bool(details.get("road_access", False)),
        )
    elif category == ListingCategory.MACHINE:
        from apps.machines.models import MachineDetails
        MachineDetails.objects.create(
            listing=listing,
            machine_type=details.get("machine_type", ""),
            manufacturer=details.get("manufacturer") or None,
            year=details.get("year") or None,
            condition=details.get("condition", "USED"),
            operating_hours=details.get("operating_hours") or None,
        )
