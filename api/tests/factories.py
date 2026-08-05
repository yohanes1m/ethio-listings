import factory
from factory.django import DjangoModelFactory

from apps.cars.models import CarDetails, CarCondition, FuelType, Transmission
from apps.deals.models import Deal
from apps.favorites.models import Favorite
from apps.houses.models import HouseDetails, HouseType
from apps.lands.models import LandDetails, LandUse
from apps.listings.models import Listing, ListingCategory, ListingStatus, ListingType, Location
from apps.machines.models import MachineDetails, MachineCondition
from apps.media.models import ListingMedia
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


class HouseDetailsFactory(DjangoModelFactory):
    class Meta:
        model = HouseDetails

    listing = factory.SubFactory(ListingFactory, category=ListingCategory.HOUSE)
    house_type = HouseType.APARTMENT
    bedrooms = 3
    bathrooms = 2
    area_sqm = 120
    furnished = False
    parking = True


class LandDetailsFactory(DjangoModelFactory):
    class Meta:
        model = LandDetails

    listing = factory.SubFactory(ListingFactory, category=ListingCategory.LAND)
    total_area = 500
    area_unit = "SQM"
    land_use = LandUse.RESIDENTIAL
    has_title_deed = True
    road_access = True


class CarDetailsFactory(DjangoModelFactory):
    class Meta:
        model = CarDetails

    listing = factory.SubFactory(ListingFactory, category=ListingCategory.CAR)
    make = "Toyota"
    model = "Land Cruiser"
    year = 2020
    mileage_km = 45000
    transmission = Transmission.AUTOMATIC
    fuel_type = FuelType.DIESEL
    condition = CarCondition.GOOD
    color = "White"


class MachineDetailsFactory(DjangoModelFactory):
    class Meta:
        model = MachineDetails

    listing = factory.SubFactory(ListingFactory, category=ListingCategory.MACHINE)
    machine_type = "Tractor"
    manufacturer = "John Deere"
    year = 2019
    condition = MachineCondition.USED
    operating_hours = 1200


class ListingMediaFactory(DjangoModelFactory):
    class Meta:
        model = ListingMedia

    listing = factory.SubFactory(ListingFactory)
    url = factory.Sequence(lambda n: f"https://example.com/img{n}.jpg")
    cloudinary_public_id = factory.Sequence(lambda n: f"uploads/house/listing{n}")
    order = factory.Sequence(lambda n: n)
    is_main = False


class FavoriteFactory(DjangoModelFactory):
    class Meta:
        model = Favorite

    user = factory.SubFactory(UserFactory)
    listing = factory.SubFactory(ListingFactory)


class ClosedListingFactory(DjangoModelFactory):
    class Meta:
        model = Listing

    user = factory.SubFactory(BrokerFactory)
    category = ListingCategory.HOUSE
    listing_type = ListingType.SALE
    title = factory.Sequence(lambda n: f"Closed Listing {n}")
    status = ListingStatus.SOLD


class DealFactory(DjangoModelFactory):
    class Meta:
        model = Deal

    listing = factory.SubFactory(ClosedListingFactory)
    closed_by = factory.SubFactory(BrokerFactory)
    actual_price = 3500000
    commission_rate = 3
    commission_amount = 105000
