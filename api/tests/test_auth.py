from datetime import timedelta
from unittest.mock import MagicMock, patch

import pytest
from django.utils import timezone

from apps.users.models import User, UserRole, Verification
from .conftest import auth_client
from .factories import UserFactory, BrokerFactory, AdminFactory

pytestmark = pytest.mark.django_db


# ── Register ──────────────────────────────────────────────────────────────────

class TestRegister:
    def test_creates_buyer_by_default(self, api_client):
        r = api_client.post("/api/auth/register/", {
            "email": "new@example.com",
            "first_name": "Abebe",
            "last_name": "Bekele",
            "password": "strongpass123",
        })
        assert r.status_code == 201
        user = User.objects.get(email="new@example.com")
        assert user.role == UserRole.BUYER

    def test_duplicate_email_rejected(self, api_client, buyer):
        r = api_client.post("/api/auth/register/", {
            "email": buyer.email,
            "first_name": "X",
            "last_name": "Y",
            "password": "strongpass123",
        })
        assert r.status_code == 400

    def test_short_password_rejected(self, api_client):
        r = api_client.post("/api/auth/register/", {
            "email": "pw@example.com",
            "first_name": "A",
            "last_name": "B",
            "password": "short",
        })
        assert r.status_code == 400

    def test_role_field_is_ignored_on_register(self, api_client):
        r = api_client.post("/api/auth/register/", {
            "email": "norole@example.com",
            "first_name": "A",
            "last_name": "B",
            "password": "strongpass123",
            "role": "ADMIN",
        })
        assert r.status_code == 201
        assert User.objects.get(email="norole@example.com").role == UserRole.BUYER


# ── Login ─────────────────────────────────────────────────────────────────────

class TestLogin:
    def test_returns_access_and_refresh_tokens(self, api_client, buyer):
        r = api_client.post("/api/auth/login/", {
            "email": buyer.email,
            "password": "testpass123",
        })
        assert r.status_code == 200
        assert "access" in r.data
        assert "refresh" in r.data
        assert "user" in r.data

    def test_wrong_password_rejected(self, api_client, buyer):
        r = api_client.post("/api/auth/login/", {
            "email": buyer.email,
            "password": "wrongpassword",
        })
        assert r.status_code == 400

    def test_unknown_email_rejected(self, api_client):
        r = api_client.post("/api/auth/login/", {
            "email": "nobody@example.com",
            "password": "anypass",
        })
        assert r.status_code == 400

    def test_inactive_user_rejected(self, api_client, db):
        user = UserFactory(is_active=False)
        r = api_client.post("/api/auth/login/", {
            "email": user.email,
            "password": "testpass123",
        })
        assert r.status_code == 400


# ── Token refresh ─────────────────────────────────────────────────────────────

class TestTokenRefresh:
    def test_valid_refresh_returns_new_access(self, api_client, buyer):
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(buyer)
        r = api_client.post("/api/auth/refresh/", {"refresh": str(refresh)})
        assert r.status_code == 200
        assert "access" in r.data

    def test_invalid_refresh_rejected(self, api_client):
        r = api_client.post("/api/auth/refresh/", {"refresh": "notavalidtoken"})
        assert r.status_code == 401


# ── Me ────────────────────────────────────────────────────────────────────────

class TestMe:
    def test_unauthenticated_returns_401(self, api_client):
        r = api_client.get("/api/auth/me/")
        assert r.status_code == 401

    def test_returns_current_user(self, buyer_client, buyer):
        r = buyer_client.get("/api/auth/me/")
        assert r.status_code == 200
        assert r.data["email"] == buyer.email
        assert r.data["role"] == UserRole.BUYER

    def test_broker_me_shows_broker_role(self, broker_client, broker):
        r = broker_client.get("/api/auth/me/")
        assert r.status_code == 200
        assert r.data["role"] == UserRole.BROKER


# ── Google OAuth ──────────────────────────────────────────────────────────────

class TestGoogleAuth:
    @patch("apps.users.services.google_id_token")
    def test_valid_token_creates_user(self, mock_id_token, api_client):
        mock_id_token.verify_oauth2_token.return_value = {
            "sub": "google_uid_123",
            "email": "googleuser@gmail.com",
            "given_name": "Google",
            "family_name": "User",
            "picture": "https://example.com/pic.jpg",
        }
        r = api_client.post("/api/auth/google/", {"id_token": "fake.google.token"})
        assert r.status_code == 200
        assert "access" in r.data
        assert User.objects.filter(google_id="google_uid_123").exists()

    @patch("apps.users.services.google_id_token")
    def test_existing_google_user_gets_tokens(self, mock_id_token, api_client, db):
        UserFactory(google_id="google_uid_existing", email="existing@gmail.com")
        mock_id_token.verify_oauth2_token.return_value = {
            "sub": "google_uid_existing",
            "email": "existing@gmail.com",
            "given_name": "X",
            "family_name": "Y",
        }
        r = api_client.post("/api/auth/google/", {"id_token": "fake.google.token"})
        assert r.status_code == 200
        assert User.objects.filter(google_id="google_uid_existing").count() == 1

    @patch("apps.users.services.google_id_token")
    def test_invalid_token_returns_401(self, mock_id_token, api_client):
        mock_id_token.verify_oauth2_token.side_effect = ValueError("bad token")
        r = api_client.post("/api/auth/google/", {"id_token": "bad_token"})
        assert r.status_code == 401


# ── Forgot password ───────────────────────────────────────────────────────────

class TestForgotPassword:
    def test_unknown_email_still_returns_200(self, api_client):
        r = api_client.post("/api/auth/forgot-password/", {"email": "nobody@example.com"})
        assert r.status_code == 200

    @patch("apps.users.services._send_email")
    def test_known_email_creates_verification(self, mock_send, api_client, buyer):
        r = api_client.post("/api/auth/forgot-password/", {"email": buyer.email})
        assert r.status_code == 200
        assert Verification.objects.filter(identifier=buyer.email).exists()
        mock_send.assert_called_once()

    @patch("apps.users.services._send_email")
    def test_second_request_replaces_old_token(self, mock_send, api_client, buyer):
        api_client.post("/api/auth/forgot-password/", {"email": buyer.email})
        api_client.post("/api/auth/forgot-password/", {"email": buyer.email})
        assert Verification.objects.filter(identifier=buyer.email).count() == 1


# ── Reset password ────────────────────────────────────────────────────────────

class TestResetPassword:
    def _make_token(self, buyer):
        import secrets
        token = secrets.token_urlsafe(32)
        Verification.objects.create(
            identifier=buyer.email,
            value=token,
            expires_at=timezone.now() + timedelta(hours=1),
        )
        return token

    def test_valid_token_resets_password(self, api_client, buyer):
        token = self._make_token(buyer)
        r = api_client.post("/api/auth/reset-password/", {
            "token": token,
            "password": "newstrongpass456",
        })
        assert r.status_code == 200
        buyer.refresh_from_db()
        assert buyer.check_password("newstrongpass456")

    def test_token_deleted_after_reset(self, api_client, buyer):
        token = self._make_token(buyer)
        api_client.post("/api/auth/reset-password/", {"token": token, "password": "newpass123"})
        assert not Verification.objects.filter(value=token).exists()

    def test_expired_token_rejected(self, api_client, buyer):
        import secrets
        token = secrets.token_urlsafe(32)
        Verification.objects.create(
            identifier=buyer.email,
            value=token,
            expires_at=timezone.now() - timedelta(hours=1),
        )
        r = api_client.post("/api/auth/reset-password/", {"token": token, "password": "newpass123"})
        assert r.status_code == 400

    def test_invalid_token_rejected(self, api_client):
        r = api_client.post("/api/auth/reset-password/", {
            "token": "nonexistenttoken",
            "password": "newpass123",
        })
        assert r.status_code == 400


# ── Admin — user management ───────────────────────────────────────────────────

class TestUserManagement:
    def test_admin_can_list_users(self, admin_client, db):
        UserFactory.create_batch(3)
        r = admin_client.get("/api/auth/users/")
        assert r.status_code == 200
        assert len(r.data) >= 3

    def test_non_admin_cannot_list_users(self, buyer_client):
        r = buyer_client.get("/api/auth/users/")
        assert r.status_code == 403

    def test_unauthenticated_cannot_list_users(self, api_client):
        r = api_client.get("/api/auth/users/")
        assert r.status_code == 401

    def test_admin_can_change_user_role(self, admin_client, buyer):
        r = admin_client.patch(f"/api/auth/users/{buyer.id}/role/", {"role": "BROKER"})
        assert r.status_code == 200
        buyer.refresh_from_db()
        assert buyer.role == UserRole.BROKER

    def test_non_admin_cannot_change_role(self, buyer_client, broker):
        r = buyer_client.patch(f"/api/auth/users/{broker.id}/role/", {"role": "BUYER"})
        assert r.status_code == 403

    def test_admin_can_delete_user(self, admin_client, buyer):
        buyer_id = buyer.id
        r = admin_client.delete(f"/api/auth/users/{buyer_id}/")
        assert r.status_code == 204
        assert not User.objects.filter(pk=buyer_id).exists()
