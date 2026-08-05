import factory
from factory.django import DjangoModelFactory

from apps.listings.models import Listing, ListingCategory, ListingType, Location
from apps.submissions.models import ListingRequest, SubmissionStatus
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


class ListingFactory(DjangoModelFactory):
    class Meta:
        model = Listing

    user = factory.SubFactory(BrokerFactory)
    category = ListingCategory.HOUSE
    listing_type = ListingType.SALE
    title = factory.Sequence(lambda n: f"Listing {n}")


class LocationFactory(DjangoModelFactory):
    class Meta:
        model = Location

    listing = factory.SubFactory(ListingFactory)
    region = "Addis Ababa"
    zone = None
    woreda = "Bole"


class ListingRequestFactory(DjangoModelFactory):
    class Meta:
        model = ListingRequest

    owner = factory.SubFactory(UserFactory)
    category = ListingCategory.HOUSE
    listing_type = ListingType.SALE
    region = "Addis Ababa"
    woreda = "Bole"
    owner_phone = "+251911000000"
    details = factory.LazyFunction(lambda: {"title": "Nice house", "price": 2000000})
    status = SubmissionStatus.PENDING
