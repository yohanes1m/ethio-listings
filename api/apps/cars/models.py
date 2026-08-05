from django.db import models


class FuelType(models.TextChoices):
    PETROL = "PETROL", "Petrol"
    DIESEL = "DIESEL", "Diesel"
    HYBRID = "HYBRID", "Hybrid"
    ELECTRIC = "ELECTRIC", "Electric"


class Transmission(models.TextChoices):
    MANUAL = "MANUAL", "Manual"
    AUTOMATIC = "AUTOMATIC", "Automatic"


class CarCondition(models.TextChoices):
    NEW = "NEW", "New"
    EXCELLENT = "EXCELLENT", "Excellent"
    GOOD = "GOOD", "Good"
    FAIR = "FAIR", "Fair"


class CarDetails(models.Model):
    listing = models.OneToOneField(
        "listings.Listing", on_delete=models.CASCADE, related_name="car_details"
    )
    make = models.CharField(max_length=100)
    model = models.CharField(max_length=100)
    year = models.PositiveSmallIntegerField(null=True, blank=True)
    mileage_km = models.PositiveIntegerField(null=True, blank=True)
    transmission = models.CharField(max_length=10, choices=Transmission.choices)
    fuel_type = models.CharField(max_length=10, choices=FuelType.choices)
    condition = models.CharField(max_length=10, choices=CarCondition.choices)
    color = models.CharField(max_length=50, null=True, blank=True)

    class Meta:
        db_table = "car_details"
