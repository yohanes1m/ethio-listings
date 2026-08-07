from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.listings.models import Listing, ListingCategory, ListingStatus
from apps.listings.serializers import ListingSerializer


class HouseListCreateView(APIView):
    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated()]

    def get(self, request):
        qs = Listing.objects.filter(
            category=ListingCategory.HOUSE, status=ListingStatus.ACTIVE
        ).select_related("location", "house_details")
        return Response(ListingSerializer(qs, many=True).data)

    def post(self, request):
        from apps.common.permissions import IsBrokerOrAdmin
        from .services import create_house_listing
        IsBrokerOrAdmin().check_object_permissions(request, None)
        listing = create_house_listing(request.user, request.data)
        return Response(ListingSerializer(listing).data, status=201)


class HouseDetailView(APIView):
    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated()]

    def get(self, request, pk):
        listing = Listing.objects.select_related("location", "house_details").get(
            pk=pk, category=ListingCategory.HOUSE
        )
        return Response(ListingSerializer(listing).data)

    def patch(self, request, pk):
        from .services import update_house_listing
        listing = update_house_listing(request.user, pk, request.data)
        return Response(ListingSerializer(listing).data)

    def delete(self, request, pk):
        from apps.common.permissions import IsOwnerOrAdmin
        listing = Listing.objects.get(pk=pk)
        IsOwnerOrAdmin().check_object_permissions(request, listing)
        listing.delete()
        return Response(status=204)
