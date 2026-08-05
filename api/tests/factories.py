import factory
from factory.django import DjangoModelFactory

from apps.users.models import Agency, BrokerProfile, User, UserRole


class UserFactory(DjangoModelFactory):
    class Meta:
        model = User

    email = factory.Sequence(lambda n: f"user{n}@example.com")
    first_name = "Test"
    last_name = "User"
    phone = factory.Sequence(lambda n: f"+2519{n:08d}")
    role = UserRole.BUYER
    is_active = True

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        password = kwargs.pop("password", "testpass123")
        user = model_class(**kwargs)
        user.set_password(password)
        user.save()
        return user


class BrokerFactory(UserFactory):
    role = UserRole.BROKER


class AdminFactory(UserFactory):
    role = UserRole.ADMIN
    is_staff = True


class AgencyFactory(DjangoModelFactory):
    class Meta:
        model = Agency

    name = factory.Sequence(lambda n: f"Agency {n}")
    phone = factory.Sequence(lambda n: f"+2519{n:08d}")


class BrokerProfileFactory(DjangoModelFactory):
    class Meta:
        model = BrokerProfile

    user = factory.SubFactory(BrokerFactory)
    telegram_username = factory.Sequence(lambda n: f"broker{n}")
    whatsapp_phone = factory.Sequence(lambda n: f"+2519{n:08d}")
