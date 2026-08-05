from django.db import transaction

from apps.listings.models import Listing, ListingCategory, Location
from .models import ListingRequest, SubmissionStatus


@transaction.atomic
def approve_submission(submission_id: str, broker) -> Listing:
    submission = ListingRequest.objects.get(pk=submission_id)

    listing = Listing.objects.create(
        user=broker,
        category=submission.category,
        listing_type=submission.listing_type,
        title=submission.details.get("title", f"{submission.category} listing"),
        price=submission.details.get("price"),
    )
    Location.objects.create(
        listing=listing,
        region=submission.region,
        zone=submission.zone or "",
        woreda=submission.woreda or "",
        address=submission.address or "",
    )

    submission.listing = listing
    submission.status = SubmissionStatus.APPROVED
    submission.save()

    return listing
