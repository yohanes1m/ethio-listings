import uuid

from django.db import models


class SubmissionStatus(models.TextChoices):
    PENDING = "PENDING", "Pending"
    CONTACTED = "CONTACTED", "Contacted"
    APPROVED = "APPROVED", "Approved"
    REJECTED = "REJECTED", "Rejected"


class ListingRequest(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey("users.User", on_delete=models.CASCADE, related_name="submissions")
    assigned_to = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_submissions",
    )
    listing = models.OneToOneField(
        "listings.Listing",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="source_request",
    )

    # Listing intent
    category = models.CharField(max_length=10)
    listing_type = models.CharField(max_length=10)

    # Flexible details (varies per category)
    details = models.JSONField(default=dict)
    photos = models.JSONField(default=list)

    # Location
    region = models.CharField(max_length=100)
    zone = models.CharField(max_length=100, null=True, blank=True)
    woreda = models.CharField(max_length=100, null=True, blank=True)
    address = models.TextField(null=True, blank=True)

    # Owner contact
    owner_phone = models.CharField(max_length=20)
    owner_whatsapp = models.CharField(max_length=20, null=True, blank=True)

    # Status
    status = models.CharField(
        max_length=10, choices=SubmissionStatus.choices, default=SubmissionStatus.PENDING
    )
    broker_notes = models.TextField(null=True, blank=True)
    owner_message = models.TextField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "listing_requests"
        ordering = ["-created_at"]

    def __str__(self):
        return f"ListingRequest({self.category}, {self.status})"
