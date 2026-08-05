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


class AdminListingsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.common.permissions import IsBrokerOrAdmin
        IsBrokerOrAdmin().check_object_permissions(request, None)
        qs = (
            Listing.objects.select_related("location", "user")
            .prefetch_related("media")
            .order_by("-created_at")
        )
        return Response(ListingSerializer(qs, many=True).data)


class CreateListingView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from apps.common.permissions import IsBrokerOrAdmin
        IsBrokerOrAdmin().check_object_permissions(request, None)

        data = request.data
        category = data.get("category", "HOUSE")
        listing_type = data.get("listing_type", "SALE")

        listing = Listing.objects.create(
            user=request.user,
            category=category,
            listing_type=listing_type,
            title=data.get("title", ""),
            title_am=data.get("title_am") or None,
            title_om=data.get("title_om") or None,
            description=data.get("description") or None,
            description_am=data.get("description_am") or None,
            price=data.get("price") or None,
            price_unit=data.get("price_unit") or None,
            price_negotiable=bool(data.get("price_negotiable", False)),
        )

        from apps.listings.models import Location
        Location.objects.create(
            listing=listing,
            region=data.get("region", ""),
            zone=data.get("zone") or None,
            woreda=data.get("woreda") or None,
            address=data.get("address") or None,
        )

        # Create category-specific details
        if category == "HOUSE":
            from apps.houses.models import HouseDetails
            HouseDetails.objects.create(
                listing=listing,
                house_type=data.get("house_type", "APARTMENT"),
                bedrooms=data.get("bedrooms") or None,
                bathrooms=data.get("bathrooms") or None,
                area_sqm=data.get("area_sqm") or None,
                furnished=bool(data.get("furnished", False)),
                parking=bool(data.get("parking", False)),
            )
        elif category == "CAR":
            from apps.cars.models import CarDetails
            CarDetails.objects.create(
                listing=listing,
                make=data.get("make", ""),
                model=data.get("model", ""),
                year=data.get("year") or None,
                mileage_km=data.get("mileage_km") or None,
                transmission=data.get("transmission", "AUTOMATIC"),
                fuel_type=data.get("fuel_type", "PETROL"),
                condition=data.get("condition", "GOOD"),
                color=data.get("color") or None,
            )
        elif category == "LAND":
            from apps.lands.models import LandDetails
            LandDetails.objects.create(
                listing=listing,
                total_area=data.get("total_area") or None,
                area_unit=data.get("area_unit", "SQM"),
                land_use=data.get("land_use", "RESIDENTIAL"),
                has_title_deed=bool(data.get("has_title_deed", False)),
                road_access=bool(data.get("road_access", False)),
            )
        elif category == "MACHINE":
            from apps.machines.models import MachineDetails
            MachineDetails.objects.create(
                listing=listing,
                machine_type=data.get("machine_type", ""),
                manufacturer=data.get("manufacturer") or None,
                year=data.get("year") or None,
                condition=data.get("condition", "USED"),
                operating_hours=data.get("operating_hours") or None,
            )

        return Response(ListingSerializer(listing).data, status=201)


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


class UpdateListingView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        from apps.common.permissions import IsBrokerOrAdmin
        IsBrokerOrAdmin().check_object_permissions(request, None)
        listing = Listing.objects.select_related("location").get(pk=pk)

        if listing.user != request.user and not request.user.is_staff:
            from apps.common.permissions import IsAdmin
            try:
                IsAdmin().check_object_permissions(request, None)
            except Exception:
                return Response({"detail": "Not allowed."}, status=403)

        updatable = ["title", "title_am", "description", "description_am", "price",
                     "price_unit", "price_negotiable", "status"]
        for field in updatable:
            if field in request.data:
                setattr(listing, field, request.data[field])
        listing.save()

        if listing.location and any(f in request.data for f in ["region", "zone", "woreda", "address"]):
            loc = listing.location
            for f in ["region", "zone", "woreda", "address"]:
                if f in request.data:
                    setattr(loc, f, request.data[f])
            loc.save()

        listing.refresh_from_db()
        return Response(ListingSerializer(listing).data)


class CloseListingView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        from apps.common.permissions import IsBrokerOrAdmin
        from apps.deals.models import Deal

        IsBrokerOrAdmin().check_object_permissions(request, None)
        listing = Listing.objects.get(pk=pk)

        new_status = (
            ListingStatus.RENTED
            if listing.listing_type == "RENT"
            else ListingStatus.SOLD
        )
        listing.status = new_status
        listing.save()

        data = request.data
        if any(data.get(f) for f in ["actual_price", "commission_rate", "notes"]):
            actual_price = data.get("actual_price") or None
            commission_rate = data.get("commission_rate") or None
            commission_amount = None
            if actual_price and commission_rate:
                try:
                    commission_amount = float(actual_price) * float(commission_rate) / 100
                except (ValueError, TypeError):
                    pass

            Deal.objects.create(
                listing=listing,
                closed_by=request.user,
                actual_price=actual_price,
                commission_rate=commission_rate,
                commission_amount=commission_amount,
                notes=data.get("notes") or None,
            )

        cache.delete("platform_stats")
        return Response({"status": new_status})


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
