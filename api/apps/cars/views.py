from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.listings.models import Listing, ListingCategory, ListingStatus
from apps.listings.serializers import ListingSerializer


class CarListCreateView(APIView):
    def get_permissions(self):
        return [AllowAny()] if self.request.method == "GET" else [IsAuthenticated()]

    def get(self, request):
        qs = Listing.objects.filter(
            category=ListingCategory.CAR, status=ListingStatus.ACTIVE
        ).select_related("location", "car_details")
        return Response(ListingSerializer(qs, many=True).data)

    def post(self, request):
        from apps.common.permissions import IsBrokerOrAdmin
        from .services import create_car_listing
        IsBrokerOrAdmin().check_object_permissions(request, None)
        listing = create_car_listing(request.user, request.data)
        return Response(ListingSerializer(listing).data, status=201)


class CarDetailView(APIView):
    def get_permissions(self):
        return [AllowAny()] if self.request.method == "GET" else [IsAuthenticated()]

    def get(self, request, pk):
        from rest_framework.exceptions import NotFound
        listing = Listing.objects.select_related("location", "car_details").get(
            pk=pk, category=ListingCategory.CAR
        )
        if listing.status != ListingStatus.ACTIVE:
            user = request.user
            if not (user.is_authenticated and (user == listing.user or getattr(user, "role", None) == "ADMIN")):
                raise NotFound()
        return Response(ListingSerializer(listing).data)

    def patch(self, request, pk):
        from .services import update_car_listing
        return Response(ListingSerializer(update_car_listing(request.user, pk, request.data)).data)

    def delete(self, request, pk):
        listing = Listing.objects.get(pk=pk)
        if listing.user != request.user and request.user.role != "ADMIN":
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied()
        listing.delete()
        return Response(status=204)
