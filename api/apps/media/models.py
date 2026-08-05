from django.db import models


class MediaType(models.TextChoices):
    IMAGE = "IMAGE", "Image"
    VIDEO = "VIDEO", "Video"


class ListingMedia(models.Model):
    listing = models.ForeignKey(
        "listings.Listing", on_delete=models.CASCADE, related_name="media"
    )
    url = models.URLField()
    cloudinary_public_id = models.CharField(max_length=255, blank=True)
    media_type = models.CharField(max_length=10, choices=MediaType.choices, default=MediaType.IMAGE)
    order = models.PositiveIntegerField(default=0)
    is_main = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "listing_media"
        ordering = ["order"]

    def __str__(self):
        return f"Media({self.listing_id}, order={self.order})"
