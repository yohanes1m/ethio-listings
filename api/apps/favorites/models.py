from django.db import models


class Favorite(models.Model):
    user = models.ForeignKey("users.User", on_delete=models.CASCADE, related_name="favorites")
    listing = models.ForeignKey(
        "listings.Listing", on_delete=models.CASCADE, related_name="favorited_by"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "favorites"
        unique_together = ("user", "listing")
