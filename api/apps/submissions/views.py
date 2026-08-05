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
        qs = ListingRequest.objects.select_related("owner", "assigned_to")
        if status := request.query_params.get("status"):
            qs = qs.filter(status=status)
        return Response(ListingRequestSerializer(qs, many=True).data)

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
