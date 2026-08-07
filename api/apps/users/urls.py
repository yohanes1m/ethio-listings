from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from . import views

urlpatterns = [
    path("register/", views.RegisterView.as_view(), name="auth-register"),
    path("login/", views.LoginView.as_view(), name="auth-login"),
    path("refresh/", TokenRefreshView.as_view(), name="auth-refresh"),
    path("me/", views.MeView.as_view(), name="auth-me"),
    path("google/", views.GoogleAuthView.as_view(), name="auth-google"),
    path("telegram-login/", views.TelegramLoginView.as_view(), name="auth-telegram"),
    path("forgot-password/", views.ForgotPasswordView.as_view(), name="auth-forgot"),
    path("reset-password/", views.ResetPasswordView.as_view(), name="auth-reset"),
    path("users/", views.UserListView.as_view(), name="user-list"),
    path("users/<uuid:pk>/role/", views.UserRoleView.as_view(), name="user-role"),
    path("users/<uuid:pk>/suspend/", views.UserSuspendView.as_view(), name="user-suspend"),
    path("users/<uuid:pk>/", views.UserDeleteView.as_view(), name="user-delete"),
]
