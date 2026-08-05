import pytest
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from .factories import AdminFactory, BrokerFactory, UserFactory


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def buyer(db):
    return UserFactory()


@pytest.fixture
def broker(db):
    return BrokerFactory()


@pytest.fixture
def admin(db):
    return AdminFactory()


def auth_client(user):
    client = APIClient()
    refresh = RefreshToken.for_user(user)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")
    return client


@pytest.fixture
def buyer_client(buyer):
    return auth_client(buyer)


@pytest.fixture
def broker_client(broker):
    return auth_client(broker)


@pytest.fixture
def admin_client(admin):
    return auth_client(admin)
