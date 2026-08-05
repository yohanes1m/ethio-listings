from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.listings.models import Listing, ListingCategory, ListingStatus
from apps.listings.serializers import ListingSerializer


class LandListCreateView(APIView):
    def get_permissions(self):
        return [AllowAny()] if self.request.method == "GET" else [IsAuthenticated()]

    def get(self, request):
        qs = Listing.objects.filter(
            category=ListingCategory.LAND, status=ListingStatus.ACTIVE
        ).select_related("location", "land_details")
        return Response(ListingSerializer(qs, many=True).data)

    def post(self, request):
        from .services import create_land_listing
        listing = create_land_listing(request.user, request.data)
        return Response(ListingSerializer(listing).data, status=201)


class LandDetailView(APIView):
    def get_permissions(self):
        return [AllowAny()] if self.request.method == "GET" else [IsAuthenticated()]

    def get(self, request, pk):
        listing = Listing.objects.select_related("location", "land_details").get(
            pk=pk, category=ListingCategory.LAND
        )
        return Response(ListingSerializer(listing).data)

    def patch(self, request, pk):
        from .services import update_land_listing
        listing = update_land_listing(request.user, pk, request.data)
        return Response(ListingSerializer(listing).data)

    def delete(self, request, pk):
        listing = Listing.objects.get(pk=pk)
        if listing.user != request.user and request.user.role != "ADMIN":
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied()
        listing.delete()
        return Response(status=204)
