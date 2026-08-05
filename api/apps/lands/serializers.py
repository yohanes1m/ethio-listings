from rest_framework import serializers

from .models import LandDetails


class LandDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = LandDetails
        fields = ["total_area", "area_unit", "land_use", "has_title_deed", "road_access"]
