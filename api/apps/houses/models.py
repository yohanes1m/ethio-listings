from django.db import models


class HouseType(models.TextChoices):
    APARTMENT = "APARTMENT", "Apartment"
    VILLA = "VILLA", "Villa"
    TOWNHOUSE = "TOWNHOUSE", "Townhouse"
    STUDIO = "STUDIO", "Studio"
    OTHER = "OTHER", "Other"


class HouseDetails(models.Model):
    listing = models.OneToOneField(
        "listings.Listing", on_delete=models.CASCADE, related_name="house_details"
    )
    house_type = models.CharField(max_length=20, choices=HouseType.choices, default=HouseType.APARTMENT)
    bedrooms = models.PositiveSmallIntegerField(null=True, blank=True)
    bathrooms = models.PositiveSmallIntegerField(null=True, blank=True)
    area_sqm = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    furnished = models.BooleanField(default=False)
    parking = models.BooleanField(default=False)

    class Meta:
        db_table = "house_details"

    def __str__(self):
        return f"HouseDetails({self.listing_id})"
