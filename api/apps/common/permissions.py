from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            raise PermissionDenied()
        if request.user.role != "ADMIN":
            raise PermissionDenied("Admin access required.")
        return True

    def check_object_permissions(self, request, obj):
        self.has_permission(request, None)


class IsBrokerOrAdmin(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            raise PermissionDenied()
        if request.user.role not in ("BROKER", "ADMIN"):
            raise PermissionDenied("Broker or admin access required.")
        return True

    def check_object_permissions(self, request, obj):
        self.has_permission(request, None)


class IsOwnerOrAdmin(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.role == "ADMIN":
            return True
        return obj.user == request.user

    def check_object_permissions(self, request, obj):
        if not self.has_object_permission(request, None, obj):
            raise PermissionDenied("You do not own this listing.")
