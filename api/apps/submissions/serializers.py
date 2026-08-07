from rest_framework import serializers

from .models import ListingRequest


class ListingRequestSerializer(serializers.ModelSerializer):
    owner_name = serializers.SerializerMethodField()

    class Meta:
        model = ListingRequest
        fields = [
            "id", "category", "listing_type", "details", "photos",
            "region", "zone", "woreda", "address",
            "owner_phone", "owner_whatsapp",
            "status", "owner_message",
            "broker_notes", "assigned_to",
            "listing",
            "owner_name", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "owner_name", "listing", "created_at", "updated_at"]

    def get_owner_name(self, obj):
        return obj.owner.full_name if obj.owner else None
