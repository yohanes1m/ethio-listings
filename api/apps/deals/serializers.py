from rest_framework import serializers

from .models import Deal


class DealSerializer(serializers.ModelSerializer):
    listing_title = serializers.SerializerMethodField()
    closed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Deal
        fields = [
            "id", "listing", "listing_title",
            "closed_by", "closed_by_name",
            "co_broker", "co_broker_split_pct",
            "actual_price", "commission_rate", "commission_amount",
            "notes", "closed_at",
        ]
        read_only_fields = ["id", "closed_at"]

    def get_listing_title(self, obj):
        return obj.listing.title if obj.listing else None

    def get_closed_by_name(self, obj):
        return obj.closed_by.full_name if obj.closed_by else None
