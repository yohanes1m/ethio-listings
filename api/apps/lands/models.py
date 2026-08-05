from django.db import models


class LandUse(models.TextChoices):
    RESIDENTIAL = "RESIDENTIAL", "Residential"
    COMMERCIAL = "COMMERCIAL", "Commercial"
    AGRICULTURAL = "AGRICULTURAL", "Agricultural"
    MIXED = "MIXED", "Mixed Use"


class AreaUnit(models.TextChoices):
    SQM = "SQM", "Square Metres"
    HECTARE = "HECTARE", "Hectare"


class LandDetails(models.Model):
    listing = models.OneToOneField(
        "listings.Listing", on_delete=models.CASCADE, related_name="land_details"
    )
    total_area = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    area_unit = models.CharField(max_length=10, choices=AreaUnit.choices, default=AreaUnit.SQM)
    land_use = models.CharField(max_length=15, choices=LandUse.choices, default=LandUse.RESIDENTIAL)
    has_title_deed = models.BooleanField(default=False)
    road_access = models.BooleanField(default=False)

    class Meta:
        db_table = "land_details"
