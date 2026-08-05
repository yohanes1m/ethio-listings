from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.listings.models import Listing
from apps.listings.serializers import ListingSerializer
from .models import Favorite


class FavoriteListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        listings = Listing.objects.filter(favorited_by__user=request.user).select_related("location")
        return Response(ListingSerializer(listings, many=True).data)

    def post(self, request):
        listing_id = request.data.get("listing_id")
        listing = Listing.objects.get(pk=listing_id)
        Favorite.objects.get_or_create(user=request.user, listing=listing)
        return Response({"listing_id": listing_id}, status=201)


class FavoriteDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, listing_id):
        Favorite.objects.filter(user=request.user, listing_id=listing_id).delete()
        return Response(status=204)
