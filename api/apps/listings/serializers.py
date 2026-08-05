from rest_framework import serializers

from .models import EthiopianLocation, Listing, Location


class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = ["region", "zone", "woreda", "neighborhood", "address", "lat", "lng"]


class ListingSerializer(serializers.ModelSerializer):
    location = LocationSerializer(read_only=True)
    broker_whatsapp = serializers.SerializerMethodField()
    broker_telegram = serializers.SerializerMethodField()

    class Meta:
        model = Listing
        fields = [
            "id", "category", "listing_type", "status",
            "title", "title_am", "title_om",
            "description", "description_am", "description_om",
            "price", "price_negotiable", "price_unit",
            "is_verified", "is_featured", "view_count",
            "location", "broker_whatsapp", "broker_telegram",
            "created_at", "updated_at",
        ]

    def get_broker_whatsapp(self, obj):
        try:
            return obj.user.broker_profile.whatsapp_phone
        except Exception:
            return None

    def get_broker_telegram(self, obj):
        try:
            return obj.user.broker_profile.telegram_username
        except Exception:
            return None


class ListingMapSerializer(serializers.ModelSerializer):
    lat = serializers.SerializerMethodField()
    lng = serializers.SerializerMethodField()

    class Meta:
        model = Listing
        fields = ["id", "title", "title_am", "price", "category", "lat", "lng"]

    def get_lat(self, obj):
        return str(obj.location.lat) if obj.location else None

    def get_lng(self, obj):
        return str(obj.location.lng) if obj.location else None


class EthiopianLocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = EthiopianLocation
        fields = ["id", "region", "zone", "woreda"]
