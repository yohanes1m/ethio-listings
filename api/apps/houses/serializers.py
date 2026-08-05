from rest_framework import serializers

from .models import HouseDetails


class HouseDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = HouseDetails
        fields = ["house_type", "bedrooms", "bathrooms", "area_sqm", "furnished", "parking"]
