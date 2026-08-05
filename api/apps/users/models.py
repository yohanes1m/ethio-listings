import uuid

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class UserRole(models.TextChoices):
    BUYER = "BUYER", "Buyer"
    BROKER = "BROKER", "Broker"
    ADMIN = "ADMIN", "Admin"


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", UserRole.ADMIN)
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    phone = models.CharField(max_length=20, null=True, blank=True)
    role = models.CharField(max_length=10, choices=UserRole.choices, default=UserRole.BUYER)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    # Social auth
    google_id = models.CharField(max_length=255, null=True, unique=True)
    telegram_id = models.BigIntegerField(null=True, unique=True)
    avatar = models.URLField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["first_name", "last_name"]

    class Meta:
        db_table = "users"

    def __str__(self):
        return f"{self.first_name} {self.last_name} <{self.email}>"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"


class Agency(models.Model):
    name = models.CharField(max_length=200)
    phone = models.CharField(max_length=20, null=True, blank=True)
    website = models.CharField(max_length=200, null=True, blank=True)
    logo = models.URLField(null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "agencies"
        verbose_name_plural = "agencies"

    def __str__(self):
        return self.name


class BrokerProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="broker_profile")
    bio = models.TextField(null=True, blank=True)
    license_number = models.CharField(max_length=100, null=True, blank=True)
    agency = models.ForeignKey(
        Agency, on_delete=models.SET_NULL, null=True, blank=True, related_name="brokers"
    )
    telegram_username = models.CharField(max_length=100, null=True, blank=True)
    whatsapp_phone = models.CharField(max_length=20, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "broker_profiles"

    def __str__(self):
        return f"BrokerProfile({self.user.full_name})"


class Verification(models.Model):
    """Password reset / email verification tokens."""

    identifier = models.CharField(max_length=255)
    value = models.CharField(max_length=255)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "verifications"
