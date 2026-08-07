from django.db.models import Q
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import ListingRequest, SubmissionStatus
from .serializers import ListingRequestSerializer


class SubmissionListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.common.permissions import IsBrokerOrAdmin
        IsBrokerOrAdmin().check_object_permissions(request, None)
        qs = ListingRequest.objects.select_related("owner", "assigned_to").order_by("-created_at")
        if status := request.query_params.get("status"):
            qs = qs.filter(status=status)
        if q := request.query_params.get("q"):
            qs = qs.filter(
                Q(region__icontains=q)
                | Q(owner__email__icontains=q)
                | Q(owner__first_name__icontains=q)
            )
        if cat := request.query_params.get("category"):
            qs = qs.filter(category=cat)
        if lt := request.query_params.get("listing_type"):
            qs = qs.filter(listing_type=lt)
        if region := request.query_params.get("region"):
            qs = qs.filter(region__icontains=region)
        paginator = PageNumberPagination()
        paginator.page_size = 20
        page = paginator.paginate_queryset(qs, request)
        return paginator.get_paginated_response(ListingRequestSerializer(page, many=True).data)

    def post(self, request):
        serializer = ListingRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(owner=request.user)
        return Response(serializer.data, status=201)


class MySubmissionsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = ListingRequest.objects.filter(owner=request.user)
        return Response(ListingRequestSerializer(qs, many=True).data)


class SubmissionDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        from apps.common.permissions import IsBrokerOrAdmin
        IsBrokerOrAdmin().check_object_permissions(request, None)
        submission = ListingRequest.objects.get(pk=pk)
        return Response(ListingRequestSerializer(submission).data)

    def patch(self, request, pk):
        from apps.common.permissions import IsBrokerOrAdmin
        IsBrokerOrAdmin().check_object_permissions(request, None)
        submission = ListingRequest.objects.get(pk=pk)
        serializer = ListingRequestSerializer(submission, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, pk):
        from apps.common.permissions import IsAdmin
        IsAdmin().check_object_permissions(request, None)
        ListingRequest.objects.filter(pk=pk).delete()
        return Response(status=204)


class SubmissionApproveView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        from apps.common.permissions import IsBrokerOrAdmin
        IsBrokerOrAdmin().check_object_permissions(request, None)
        from .services import approve_submission
        listing = approve_submission(pk, request.user)
        from apps.listings.serializers import ListingSerializer
        return Response(ListingSerializer(listing).data, status=201)
