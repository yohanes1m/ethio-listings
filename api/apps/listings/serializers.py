from rest_framework import serializers

from apps.media.serializers import ListingMediaSerializer

from .models import EthiopianLocation, Listing, Location


class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = ["region", "zone", "woreda", "neighborhood", "address", "lat", "lng"]


class ListingSerializer(serializers.ModelSerializer):
    location = LocationSerializer(read_only=True)
    media = ListingMediaSerializer(many=True, read_only=True)
    broker_name = serializers.SerializerMethodField()
    broker_phone = serializers.SerializerMethodField()
    broker_whatsapp = serializers.SerializerMethodField()
    broker_telegram = serializers.SerializerMethodField()
    house_details = serializers.SerializerMethodField()
    land_details = serializers.SerializerMethodField()
    car_details = serializers.SerializerMethodField()
    machine_details = serializers.SerializerMethodField()

    class Meta:
        model = Listing
        fields = [
            "id", "category", "listing_type", "status",
            "title", "title_am", "title_om",
            "description", "description_am", "description_om",
            "price", "price_negotiable", "price_unit",
            "is_verified", "is_featured", "view_count",
            "location", "media",
            "broker_name", "broker_phone", "broker_whatsapp", "broker_telegram",
            "house_details", "land_details", "car_details", "machine_details",
            "created_at", "updated_at",
        ]

    def get_broker_name(self, obj):
        u = obj.user
        name = f"{u.first_name} {u.last_name}".strip()
        return name or u.email

    def get_broker_phone(self, obj):
        return getattr(obj.user, "phone", None)

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

    def get_house_details(self, obj):
        try:
            from apps.houses.serializers import HouseDetailsSerializer
            return HouseDetailsSerializer(obj.house_details).data
        except Exception:
            return None

    def get_land_details(self, obj):
        try:
            from apps.lands.serializers import LandDetailsSerializer
            return LandDetailsSerializer(obj.land_details).data
        except Exception:
            return None

    def get_car_details(self, obj):
        try:
            from apps.cars.serializers import CarDetailsSerializer
            return CarDetailsSerializer(obj.car_details).data
        except Exception:
            return None

    def get_machine_details(self, obj):
        try:
            from apps.machines.serializers import MachineDetailsSerializer
            return MachineDetailsSerializer(obj.machine_details).data
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
