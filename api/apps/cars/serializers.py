from rest_framework import serializers

from .models import CarDetails


class CarDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = CarDetails
        fields = ["make", "model", "year", "mileage_km", "transmission", "fuel_type", "condition", "color"]
