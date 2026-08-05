import hashlib
import hmac
import urllib.parse
from datetime import timedelta

from django.conf import settings
from django.utils import timezone
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token
from rest_framework_simplejwt.tokens import RefreshToken


def _tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {"access": str(refresh.access_token), "refresh": str(refresh)}


def google_authenticate(id_token: str) -> dict:
    from rest_framework.exceptions import AuthenticationFailed
    from .models import User

    try:
        idinfo = google_id_token.verify_oauth2_token(
            id_token, google_requests.Request(), settings.GOOGLE_CLIENT_ID
        )
    except Exception as exc:
        raise AuthenticationFailed(f"Invalid Google token: {exc}")

    google_id = idinfo["sub"]
    email = idinfo.get("email", "")
    user, _ = User.objects.get_or_create(
        google_id=google_id,
        defaults={
            "email": email,
            "first_name": idinfo.get("given_name", ""),
            "last_name": idinfo.get("family_name", ""),
            "avatar": idinfo.get("picture"),
        },
    )
    return _tokens_for_user(user)


def telegram_authenticate(init_data: str) -> dict:
    from rest_framework.exceptions import AuthenticationFailed
    from .models import User

    if not init_data:
        raise AuthenticationFailed("initData is required.")

    token = settings.TELEGRAM_BOT_TOKEN
    if not token:
        raise AuthenticationFailed("Telegram bot not configured.")

    parsed = dict(urllib.parse.parse_qsl(init_data))
    received_hash = parsed.pop("hash", "")

    data_check_string = "\n".join(
        f"{k}={v}" for k, v in sorted(parsed.items())
    )
    secret_key = hmac.new(b"WebAppData", token.encode(), hashlib.sha256).digest()
    computed = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()

    if not hmac.compare_digest(computed, received_hash):
        raise AuthenticationFailed("Invalid Telegram signature.")

    import json
    tg_user = json.loads(parsed.get("user", "{}"))
    telegram_id = tg_user.get("id")
    if not telegram_id:
        raise AuthenticationFailed("No user in initData.")

    user, _ = User.objects.get_or_create(
        telegram_id=telegram_id,
        defaults={
            "email": f"tg_{telegram_id}@telegram.placeholder",
            "first_name": tg_user.get("first_name", ""),
            "last_name": tg_user.get("last_name", ""),
        },
    )
    return _tokens_for_user(user)


def send_password_reset(email: str) -> None:
    import secrets
    from .models import User, Verification

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return  # silently ignore — don't reveal whether email exists

    token = secrets.token_urlsafe(32)
    Verification.objects.filter(identifier=email).delete()
    Verification.objects.create(
        identifier=email,
        value=token,
        expires_at=timezone.now() + timedelta(hours=1),
    )

    reset_url = f"{settings.FRONTEND_URL}/auth/reset-password?token={token}"
    _send_email(
        to=email,
        subject="Reset your EthioListings password",
        body=f"Click the link below to reset your password:\n\n{reset_url}\n\nThis link expires in 1 hour.",
    )


def reset_password(token: str, new_password: str) -> None:
    from rest_framework.exceptions import ValidationError
    from .models import User, Verification

    try:
        verification = Verification.objects.get(value=token)
    except Verification.DoesNotExist:
        raise ValidationError("Invalid or expired token.")

    if verification.expires_at < timezone.now():
        verification.delete()
        raise ValidationError("Token has expired.")

    try:
        user = User.objects.get(email=verification.identifier)
    except User.DoesNotExist:
        raise ValidationError("User not found.")

    user.set_password(new_password)
    user.save()
    verification.delete()


def _send_email(to: str, subject: str, body: str) -> None:
    if not settings.RESEND_API_KEY:
        return
    import resend
    resend.api_key = settings.RESEND_API_KEY
    resend.Emails.send({
        "from": settings.RESEND_FROM_EMAIL,
        "to": to,
        "subject": subject,
        "text": body,
    })
