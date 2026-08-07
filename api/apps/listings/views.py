from django.core.cache import cache
from django.db.models import Q
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Listing, ListingStatus
from .serializers import ListingSerializer, ListingMapSerializer


def _apply_public_filters(qs, query_params):
    if cat := query_params.get("category"):
        qs = qs.filter(category=cat)
    if lt := query_params.get("listing_type"):
        qs = qs.filter(listing_type=lt)
    if region := query_params.get("region"):
        qs = qs.filter(location__region=region)
    if q := query_params.get("q"):
        qs = qs.filter(Q(title__icontains=q) | Q(title_am__icontains=q))
    if verified := query_params.get("verified"):
        qs = qs.filter(is_verified=verified.lower() == "true")
    if price_min := query_params.get("price_min"):
        qs = qs.filter(price__gte=price_min)
    if price_max := query_params.get("price_max"):
        qs = qs.filter(price__lte=price_max)

    cat = query_params.get("category")
    if cat == "HOUSE":
        if beds := query_params.get("bedrooms_min"):
            qs = qs.filter(house_details__bedrooms__gte=beds)
        if query_params.get("furnished") == "true":
            qs = qs.filter(house_details__furnished=True)
        if query_params.get("parking") == "true":
            qs = qs.filter(house_details__parking=True)
    elif cat == "CAR":
        if make := query_params.get("make"):
            qs = qs.filter(car_details__make__icontains=make)
        if fuel := query_params.get("fuel_type"):
            qs = qs.filter(car_details__fuel_type=fuel)
        if trans := query_params.get("transmission"):
            qs = qs.filter(car_details__transmission=trans)
        if cond := query_params.get("condition"):
            qs = qs.filter(car_details__condition=cond)
        if year_min := query_params.get("year_min"):
            qs = qs.filter(car_details__year__gte=year_min)
        if year_max := query_params.get("year_max"):
            qs = qs.filter(car_details__year__lte=year_max)
    elif cat == "LAND":
        if land_use := query_params.get("land_use"):
            qs = qs.filter(land_details__land_use=land_use)
        if query_params.get("has_title_deed") == "true":
            qs = qs.filter(land_details__has_title_deed=True)
        if query_params.get("road_access") == "true":
            qs = qs.filter(land_details__road_access=True)
    elif cat == "MACHINE":
        if mtype := query_params.get("machine_type"):
            qs = qs.filter(machine_details__machine_type__icontains=mtype)
        if cond := query_params.get("condition"):
            qs = qs.filter(machine_details__condition=cond)
    return qs


class PublicListingListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        qs = Listing.objects.filter(status=ListingStatus.ACTIVE).select_related(
            "location", "user", "user__broker_profile"
        ).prefetch_related(
            "media", "house_details", "car_details", "land_details", "machine_details"
        ).order_by("-created_at")
        qs = _apply_public_filters(qs, request.query_params)
        paginator = PageNumberPagination()
        paginator.page_size = 20
        page = paginator.paginate_queryset(qs, request)
        data = ListingSerializer(page, many=True, context={"request": request}).data
        return paginator.get_paginated_response(data)


class FeaturedListingView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        cached = cache.get("featured_listings")
        if cached is not None:
            return Response(cached)
        qs = Listing.objects.filter(
            status=ListingStatus.ACTIVE, is_featured=True
        ).select_related("location", "user", "user__broker_profile").prefetch_related(
            "media", "house_details", "car_details", "land_details", "machine_details"
        )[:12]
        data = ListingSerializer(qs, many=True, context={"request": request}).data
        cache.set("featured_listings", data, 30)
        return Response(data)


class ListingMapView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        qs = Listing.objects.filter(
            status=ListingStatus.ACTIVE, location__lat__isnull=False
        ).select_related("location")
        qs = _apply_public_filters(qs, request.query_params)
        return Response(ListingMapSerializer(qs[:500], many=True).data)


class MyListingsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = (
            Listing.objects.filter(user=request.user)
            .select_related("location", "user", "user__broker_profile")
            .prefetch_related("media", "house_details", "car_details", "land_details", "machine_details")
            .order_by("-created_at")
        )
        if q := request.query_params.get("q"):
            qs = qs.filter(Q(title__icontains=q) | Q(title_am__icontains=q))
        if cat := request.query_params.get("category"):
            qs = qs.filter(category=cat)
        if lt := request.query_params.get("listing_type"):
            qs = qs.filter(listing_type=lt)
        if status := request.query_params.get("status"):
            qs = qs.filter(status=status)
        paginator = PageNumberPagination()
        paginator.page_size = 20
        page = paginator.paginate_queryset(qs, request)
        return paginator.get_paginated_response(ListingSerializer(page, many=True, context={"request": request}).data)


class AdminListingsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.common.permissions import IsAdmin
        IsAdmin().check_object_permissions(request, None)
        qs = (
            Listing.objects.select_related("location", "user", "user__broker_profile")
            .prefetch_related("media", "house_details", "car_details", "land_details", "machine_details")
            .order_by("-created_at")
        )
        if q := request.query_params.get("q"):
            qs = qs.filter(Q(title__icontains=q) | Q(title_am__icontains=q))
        if cat := request.query_params.get("category"):
            qs = qs.filter(category=cat)
        if lt := request.query_params.get("listing_type"):
            qs = qs.filter(listing_type=lt)
        if status := request.query_params.get("status"):
            qs = qs.filter(status=status)
        if region := request.query_params.get("region"):
            qs = qs.filter(location__region__icontains=region)
        if verified := request.query_params.get("verified"):
            qs = qs.filter(is_verified=verified.lower() == "true")
        if featured := request.query_params.get("featured"):
            qs = qs.filter(is_featured=featured.lower() == "true")
        paginator = PageNumberPagination()
        paginator.page_size = 20
        page = paginator.paginate_queryset(qs, request)
        return paginator.get_paginated_response(ListingSerializer(page, many=True, context={"request": request}).data)


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
        from rest_framework.exceptions import NotFound
        listing = Listing.objects.select_related("location", "user__broker_profile").get(pk=pk)

        # Non-active listings are only visible to the owner or an admin
        if listing.status != ListingStatus.ACTIVE:
            user = request.user
            is_owner = user.is_authenticated and user == listing.user
            is_admin = user.is_authenticated and getattr(user, "role", None) == "ADMIN"
            if not (is_owner or is_admin):
                raise NotFound()

        Listing.objects.filter(pk=pk).update(view_count=listing.view_count + 1)
        return Response(ListingSerializer(listing, context={"request": request}).data)


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

        location_fields = ["region", "zone", "woreda", "address"]
        if any(field in request.data for field in location_fields):
            from apps.listings.models import Location

            loc, _ = Location.objects.get_or_create(listing=listing)
            for f in location_fields:
                if f in request.data:
                    setattr(loc, f, request.data[f])
            loc.save()

        listing.refresh_from_db()
        return Response(ListingSerializer(listing).data)


class CloseListingView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        from apps.common.permissions import IsBrokerOrAdmin
        from apps.deals.services import close_deal

        IsBrokerOrAdmin().check_object_permissions(request, None)
        deal = close_deal(pk, request.user, request.data)
        cache.delete("platform_stats")
        return Response({"status": deal.listing.status})


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
