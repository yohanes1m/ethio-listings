from django.db import models


class MachineCondition(models.TextChoices):
    NEW = "NEW", "New"
    USED = "USED", "Used"
    RECONDITIONED = "RECONDITIONED", "Reconditioned"


class MachineDetails(models.Model):
    listing = models.OneToOneField(
        "listings.Listing", on_delete=models.CASCADE, related_name="machine_details"
    )
    machine_type = models.CharField(max_length=100)
    manufacturer = models.CharField(max_length=100, null=True, blank=True)
    year = models.PositiveSmallIntegerField(null=True, blank=True)
    condition = models.CharField(max_length=15, choices=MachineCondition.choices)
    operating_hours = models.PositiveIntegerField(null=True, blank=True)

    class Meta:
        db_table = "machine_details"
