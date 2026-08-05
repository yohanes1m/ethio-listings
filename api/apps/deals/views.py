from django.db.models import Sum
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Deal
from .serializers import DealSerializer


class CloseDealView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, listing_id):
        from apps.common.permissions import IsBrokerOrAdmin
        IsBrokerOrAdmin().check_object_permissions(request, None)
        from .services import close_deal
        deal = close_deal(listing_id, request.user, request.data)
        return Response(DealSerializer(deal).data, status=201)


class DealListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.common.permissions import IsBrokerOrAdmin
        IsBrokerOrAdmin().check_object_permissions(request, None)
        if request.user.role == "ADMIN":
            qs = Deal.objects.select_related("listing", "closed_by", "co_broker")
        else:
            qs = Deal.objects.filter(closed_by=request.user).select_related("listing")
        return Response(DealSerializer(qs, many=True).data)


class DealSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.common.permissions import IsBrokerOrAdmin
        IsBrokerOrAdmin().check_object_permissions(request, None)
        from django.utils import timezone
        from datetime import timedelta

        if request.user.role == "ADMIN":
            qs = Deal.objects.all()
        else:
            qs = Deal.objects.filter(closed_by=request.user)

        month_start = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        this_month = qs.filter(closed_at__gte=month_start)

        return Response({
            "deals_count": qs.count(),
            "total_commission": qs.aggregate(t=Sum("commission_amount"))["t"] or 0,
            "this_month_deals": this_month.count(),
            "this_month_commission": this_month.aggregate(t=Sum("commission_amount"))["t"] or 0,
        })
