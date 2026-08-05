from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .services import AIUnavailableError, generate_listing


class GenerateListingView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            result = generate_listing(request.data)
            return Response(result)
        except AIUnavailableError as e:
            return Response({"detail": str(e)}, status=503)
