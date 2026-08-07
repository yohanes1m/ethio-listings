from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated

from .models import User


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        from .serializers import RegisterSerializer
        from rest_framework_simplejwt.tokens import RefreshToken
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response(
            {"access": str(refresh.access_token), "refresh": str(refresh), "id": str(user.id)},
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        from .serializers import LoginSerializer
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.validated_data)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from .serializers import UserSerializer
        return Response(UserSerializer(request.user).data)


class GoogleAuthView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        from .services import google_authenticate
        tokens = google_authenticate(request.data.get("id_token"))
        return Response(tokens)


class TelegramLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        from .services import telegram_authenticate
        tokens = telegram_authenticate(request.data.get("initData"))
        return Response(tokens)


class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        from .services import send_password_reset
        send_password_reset(request.data.get("email"))
        return Response({"detail": "If that email exists, a reset link was sent."})


class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        from .services import reset_password
        reset_password(request.data.get("token"), request.data.get("password"))
        return Response({"detail": "Password reset successfully."})


class UserListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from .serializers import UserSerializer
        from apps.common.permissions import IsAdmin
        IsAdmin().check_object_permissions(request, None)
        users = User.objects.all().order_by("-created_at")
        return Response(UserSerializer(users, many=True).data)


class UserRoleView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        from apps.common.permissions import IsAdmin
        from .serializers import UserSerializer
        IsAdmin().check_object_permissions(request, None)
        user = User.objects.get(pk=pk)
        user.role = request.data["role"]
        user.save()
        return Response(UserSerializer(user).data)


class UserDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        from apps.common.permissions import IsAdmin
        IsAdmin().check_object_permissions(request, None)
        User.objects.filter(pk=pk).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
