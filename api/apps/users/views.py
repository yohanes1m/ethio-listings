from django.db.models import Q
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

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
        qs = User.objects.all().order_by("-created_at")
        if q := request.query_params.get("q"):
            qs = qs.filter(
                Q(email__icontains=q) | Q(first_name__icontains=q) | Q(last_name__icontains=q)
            )
        if role := request.query_params.get("role"):
            qs = qs.filter(role=role)
        paginator = PageNumberPagination()
        paginator.page_size = 20
        page = paginator.paginate_queryset(qs, request)
        return paginator.get_paginated_response(UserSerializer(page, many=True).data)


class UserRoleView(APIView):
    permission_classes = [IsAuthenticated]

    VALID_ROLES = {"BUYER", "BROKER", "ADMIN"}

    def patch(self, request, pk):
        from apps.common.permissions import IsAdmin
        from rest_framework.exceptions import ValidationError, PermissionDenied
        from .serializers import UserSerializer
        IsAdmin().check_object_permissions(request, None)

        new_role = request.data.get("role")
        if new_role not in self.VALID_ROLES:
            raise ValidationError({"role": f"Must be one of: {', '.join(sorted(self.VALID_ROLES))}"})

        if str(pk) == str(request.user.pk):
            raise PermissionDenied("You cannot change your own role.")

        user = User.objects.get(pk=pk)

        # Prevent removing the last admin
        if user.role == "ADMIN" and new_role != "ADMIN":
            admin_count = User.objects.filter(role="ADMIN", is_active=True).count()
            if admin_count <= 1:
                raise ValidationError({"detail": "Cannot demote the last active admin."})

        user.role = new_role
        user.save()
        return Response(UserSerializer(user).data)


class UserSuspendView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        from apps.common.permissions import IsAdmin
        from rest_framework.exceptions import ValidationError, PermissionDenied
        from .serializers import UserSerializer
        IsAdmin().check_object_permissions(request, None)

        if str(pk) == str(request.user.pk):
            raise PermissionDenied("You cannot suspend your own account.")

        user = User.objects.get(pk=pk)
        suspending = not user.is_active  # toggling: True = reactivating, False = suspending

        # Prevent suspending the last active admin
        if user.is_active and user.role == "ADMIN":
            admin_count = User.objects.filter(role="ADMIN", is_active=True).count()
            if admin_count <= 1:
                raise ValidationError({"detail": "Cannot suspend the last active admin."})

        user.is_active = not user.is_active
        user.save()
        return Response(UserSerializer(user).data)


class UserDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        from apps.common.permissions import IsAdmin
        from rest_framework.exceptions import PermissionDenied, ValidationError
        IsAdmin().check_object_permissions(request, None)

        if str(pk) == str(request.user.pk):
            raise PermissionDenied("You cannot delete your own account.")

        user = User.objects.get(pk=pk)
        if user.role == "ADMIN":
            admin_count = User.objects.filter(role="ADMIN", is_active=True).count()
            if admin_count <= 1:
                raise ValidationError({"detail": "Cannot delete the last active admin."})

        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
