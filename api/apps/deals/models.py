import uuid

from django.db import models


class Deal(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    listing = models.OneToOneField(
        "listings.Listing", on_delete=models.CASCADE, related_name="deal"
    )
    closed_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        related_name="deals_closed",
    )
    co_broker = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="co_brokered_deals",
    )
    # All financial fields are optional — closing a listing is never blocked by missing data
    actual_price = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    commission_rate = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    commission_amount = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    co_broker_split_pct = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    notes = models.TextField(null=True, blank=True)
    closed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "deals"

    def __str__(self):
        return f"Deal({self.listing_id})"
