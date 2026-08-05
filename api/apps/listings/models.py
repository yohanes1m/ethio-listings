import uuid

from django.db import models


class ListingType(models.TextChoices):
    SALE = "SALE", "For Sale"
    RENT = "RENT", "For Rent"


class ListingStatus(models.TextChoices):
    ACTIVE = "ACTIVE", "Active"
    INACTIVE = "INACTIVE", "Inactive"
    SOLD = "SOLD", "Sold"
    RENTED = "RENTED", "Rented"
    EXPIRED = "EXPIRED", "Expired"


class ListingCategory(models.TextChoices):
    HOUSE = "HOUSE", "House"
    LAND = "LAND", "Land"
    CAR = "CAR", "Car"
    MACHINE = "MACHINE", "Machine"


class Listing(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        "users.User", on_delete=models.CASCADE, related_name="listings"
    )
    category = models.CharField(max_length=10, choices=ListingCategory.choices)
    listing_type = models.CharField(max_length=10, choices=ListingType.choices)
    status = models.CharField(
        max_length=10, choices=ListingStatus.choices, default=ListingStatus.ACTIVE
    )

    # Title + description in 3 languages
    title = models.CharField(max_length=300)
    title_am = models.CharField(max_length=300, null=True, blank=True)
    title_om = models.CharField(max_length=300, null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    description_am = models.TextField(null=True, blank=True)
    description_om = models.TextField(null=True, blank=True)

    # Pricing
    price = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    price_negotiable = models.BooleanField(default=False)
    price_unit = models.CharField(max_length=20, null=True, blank=True)  # per_month | per_year

    # Flags
    is_verified = models.BooleanField(default=False)
    is_featured = models.BooleanField(default=False)
    view_count = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "listings"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.category} | {self.title}"


class Location(models.Model):
    listing = models.OneToOneField(
        Listing, on_delete=models.CASCADE, related_name="location"
    )
    region = models.CharField(max_length=100)
    zone = models.CharField(max_length=100, null=True, blank=True)
    woreda = models.CharField(max_length=100, null=True, blank=True)
    neighborhood = models.CharField(max_length=200, null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    lat = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    lng = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    # PostGIS PointField added in Phase 5 when map search is implemented

    class Meta:
        db_table = "listing_locations"

    def __str__(self):
        return f"{self.region}, {self.zone or ''}"


class EthiopianLocation(models.Model):
    """Pre-loaded fixture: all Ethiopian regions, zones, and woredas."""

    region = models.CharField(max_length=100)
    zone = models.CharField(max_length=100, null=True, blank=True)
    woreda = models.CharField(max_length=100, null=True, blank=True)

    class Meta:
        db_table = "ethiopian_locations"
        ordering = ["region", "zone", "woreda"]

    def __str__(self):
        parts = [self.region]
        if self.zone:
            parts.append(self.zone)
        if self.woreda:
            parts.append(self.woreda)
        return " / ".join(parts)
