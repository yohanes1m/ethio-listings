from rest_framework import serializers

from .models import ListingMedia


class ListingMediaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ListingMedia
        fields = ["id", "url", "media_type", "order", "is_main"]
