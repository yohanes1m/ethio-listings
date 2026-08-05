from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.listings.models import EthiopianLocation


class RegionListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        regions = (
            EthiopianLocation.objects
            .values_list("region", flat=True)
            .distinct()
            .order_by("region")
        )
        return Response(list(regions))


class ZoneListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        region = request.query_params.get("region")
        qs = EthiopianLocation.objects.filter(zone__isnull=False, woreda__isnull=True)
        if region:
            qs = qs.filter(region=region)
        zones = qs.values_list("zone", flat=True).distinct().order_by("zone")
        return Response(list(zones))


class WoredasListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        zone = request.query_params.get("zone")
        qs = EthiopianLocation.objects.filter(woreda__isnull=False)
        if zone:
            qs = qs.filter(zone=zone)
        woredas = qs.values_list("woreda", flat=True).distinct().order_by("woreda")
        return Response(list(woredas))
