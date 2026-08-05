from rest_framework import serializers

from .models import MachineDetails


class MachineDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = MachineDetails
        fields = ["machine_type", "manufacturer", "year", "condition", "operating_hours"]
