from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.listings.models import Listing
from .models import ListingMedia, MediaType
from .services import delete_file, upload_file

_VIDEO_TYPES = {"video/mp4", "video/quicktime", "video/x-msvideo", "video/webm"}
_MAX_IMAGE = 10 * 1024 * 1024   # 10 MB
_MAX_VIDEO = 100 * 1024 * 1024  # 100 MB


class ListingMediaView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, listing_id):
        from rest_framework.exceptions import PermissionDenied
        listing = Listing.objects.get(pk=listing_id)
        if listing.user != request.user and getattr(request.user, "role", None) != "ADMIN":
            raise PermissionDenied()
        file = request.FILES.get("file")
        if not file:
            return Response({"detail": "No file provided."}, status=400)

        is_video = file.content_type in _VIDEO_TYPES
        size_limit = _MAX_VIDEO if is_video else _MAX_IMAGE
        if file.size > size_limit:
            label = "100 MB" if is_video else "10 MB"
            return Response({"detail": f"File too large. Maximum is {label}."}, status=400)

        media_type = MediaType.VIDEO if is_video else MediaType.IMAGE
        result = upload_file(file, str(listing_id), listing.category.lower())
        media = ListingMedia.objects.create(
            listing=listing,
            url=result["url"],
            cloudinary_public_id=result["cloudinary_public_id"],
            media_type=media_type,
            order=ListingMedia.objects.filter(listing=listing).count(),
        )
        return Response({"id": media.id, "url": media.url, "media_type": media_type}, status=201)


class ListingMediaDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, listing_id, pk):
        from rest_framework.exceptions import PermissionDenied
        media = ListingMedia.objects.select_related("listing").get(pk=pk, listing_id=listing_id)
        if media.listing.user != request.user and getattr(request.user, "role", None) != "ADMIN":
            raise PermissionDenied()
        delete_file(media.url, media.cloudinary_public_id)
        media.delete()
        return Response(status=204)

    def patch(self, request, listing_id, pk):
        from rest_framework.exceptions import PermissionDenied
        media = ListingMedia.objects.select_related("listing").get(pk=pk, listing_id=listing_id)
        if media.listing.user != request.user and getattr(request.user, "role", None) != "ADMIN":
            raise PermissionDenied()
        if request.data.get("is_main"):
            ListingMedia.objects.filter(listing_id=listing_id).update(is_main=False)
            media.is_main = True
            media.save()
        if "order" in request.data:
            media.order = request.data["order"]
            media.save()
        return Response({"id": media.id, "url": media.url, "is_main": media.is_main})
