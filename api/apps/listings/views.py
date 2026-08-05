from django.core.cache import cache
from django.db.models import Q
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Listing, ListingStatus
from .serializers import ListingSerializer, ListingMapSerializer


class PublicListingListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        qs = Listing.objects.filter(status=ListingStatus.ACTIVE).select_related(
            "location", "user"
        ).prefetch_related("media")
        if cat := request.query_params.get("category"):
            qs = qs.filter(category=cat)
        if lt := request.query_params.get("listing_type"):
            qs = qs.filter(listing_type=lt)
        if region := request.query_params.get("region"):
            qs = qs.filter(location__region=region)
        if q := request.query_params.get("q"):
            qs = qs.filter(Q(title__icontains=q) | Q(title_am__icontains=q))
        if verified := request.query_params.get("verified"):
            qs = qs.filter(is_verified=verified.lower() == "true")
        if price_min := request.query_params.get("price_min"):
            qs = qs.filter(price__gte=price_min)
        if price_max := request.query_params.get("price_max"):
            qs = qs.filter(price__lte=price_max)
        total = qs.count()
        data = ListingSerializer(qs[:100], many=True).data
        return Response({"count": total, "results": data})


class FeaturedListingView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        cached = cache.get("featured_listings")
        if cached is not None:
            return Response(cached)
        qs = Listing.objects.filter(
            status=ListingStatus.ACTIVE, is_featured=True
        ).select_related("location").prefetch_related("media")[:12]
        data = ListingSerializer(qs, many=True).data
        cache.set("featured_listings", data, 30)
        return Response(data)


class ListingMapView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        qs = Listing.objects.filter(
            status=ListingStatus.ACTIVE, location__lat__isnull=False
        ).select_related("location")
        if cat := request.query_params.get("category"):
            qs = qs.filter(category=cat)
        return Response(ListingMapSerializer(qs[:500], many=True).data)


class MyListingsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Listing.objects.filter(user=request.user).select_related("location").prefetch_related("media")
        return Response(ListingSerializer(qs, many=True).data)


class ListingDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        listing = Listing.objects.select_related("location", "user__broker_profile").get(pk=pk)
        Listing.objects.filter(pk=pk).update(view_count=listing.view_count + 1)
        return Response(ListingSerializer(listing).data)


class ListingDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.common.permissions import IsAdmin
        IsAdmin().check_object_permissions(request, None)
        qs = Listing.objects.select_related("location", "user").order_by("-created_at")
        return Response(ListingSerializer(qs, many=True).data)


class VerifyListingView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        from apps.common.permissions import IsAdmin
        IsAdmin().check_object_permissions(request, None)
        listing = Listing.objects.get(pk=pk)
        listing.is_verified = not listing.is_verified
        listing.save()
        return Response({"is_verified": listing.is_verified})


class FeatureListingView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        from apps.common.permissions import IsAdmin
        IsAdmin().check_object_permissions(request, None)
        listing = Listing.objects.get(pk=pk)
        listing.is_featured = not listing.is_featured
        listing.save()
        cache.delete("featured_listings")
        return Response({"is_featured": listing.is_featured})


class StatsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        cached = cache.get("platform_stats")
        if cached is not None:
            return Response(cached)

        from apps.users.models import User, UserRole
        from apps.deals.models import Deal

        stats = {
            "active_listings": Listing.objects.filter(status=ListingStatus.ACTIVE).count(),
            "brokers": User.objects.filter(role=UserRole.BROKER).count(),
            "regions_covered": (
                Listing.objects.filter(status=ListingStatus.ACTIVE)
                .values("location__region")
                .distinct()
                .count()
            ),
            "deals_closed": Deal.objects.count(),
        }
        cache.set("platform_stats", stats, 300)
        return Response(stats)
