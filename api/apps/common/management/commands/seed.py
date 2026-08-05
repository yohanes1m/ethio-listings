"""
Management command: python manage.py seed

Creates realistic Ethiopian real estate seed data:
  - 1 admin, 3 brokers, 2 buyers
  - 5 houses (mix of sale/rent), 3 lands, 3 cars, 2 machines
  - Unsplash photo URLs for images (no Cloudinary needed)
  - BrokerProfiles with WhatsApp + Telegram handles
  - 2 featured listings, several verified

Safe to run multiple times — clears previous seed data first.
"""

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.cars.models import CarCondition, CarDetails, FuelType, Transmission
from apps.houses.models import HouseDetails, HouseType
from apps.lands.models import AreaUnit, LandDetails, LandUse
from apps.listings.models import Listing, ListingCategory, ListingStatus, ListingType, Location
from apps.machines.models import MachineCondition, MachineDetails
from apps.media.models import ListingMedia, MediaType
from apps.users.models import Agency, BrokerProfile, User, UserRole

# ---------------------------------------------------------------------------
# Unsplash image URLs — deterministic, no API key needed
# ---------------------------------------------------------------------------

HOUSE_IMAGES = [
    "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80",
    "https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=800&q=80",
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
    "https://images.unsplash.com/photo-1464146072230-91cabc968266?w=800&q=80",
]

LAND_IMAGES = [
    "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80",
    "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?w=800&q=80",
    "https://images.unsplash.com/photo-1614853316476-de00d14cb1fc?w=800&q=80",
]

CAR_IMAGES = [
    "https://images.unsplash.com/photo-1550355291-bbee04a92027?w=800&q=80",
    "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80",
    "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800&q=80",
]

MACHINE_IMAGES = [
    "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80",
    "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&q=80",
]


def _add_images(listing, urls, extra_urls=None):
    all_urls = list(urls)
    if extra_urls:
        all_urls += extra_urls
    for i, url in enumerate(all_urls):
        ListingMedia.objects.create(
            listing=listing,
            url=url,
            media_type=MediaType.IMAGE,
            order=i,
            is_main=(i == 0),
        )


class Command(BaseCommand):
    help = "Seed the database with realistic Ethiopian listing data"

    def handle(self, *args, **options):
        self.stdout.write("Clearing previous seed data...")
        self._clear()

        self.stdout.write("Creating users...")
        admin, brokers, buyers = self._create_users()

        self.stdout.write("Creating houses...")
        self._create_houses(brokers)

        self.stdout.write("Creating lands...")
        self._create_lands(brokers)

        self.stdout.write("Creating cars...")
        self._create_cars(brokers)

        self.stdout.write("Creating machines...")
        self._create_machines(brokers)

        self.stdout.write(self.style.SUCCESS("Done! Seed data created."))
        self.stdout.write("")
        self.stdout.write("Login credentials:")
        self.stdout.write("  Admin:   admin@ethiolistings.com / Admin1234!")
        self.stdout.write("  Broker:  dawit@broker.com / Broker1234!")
        self.stdout.write("  Buyer:   sara@buyer.com   / Buyer1234!")

    @transaction.atomic
    def _clear(self):
        SEED_EMAILS = [
            "admin@ethiolistings.com",
            "dawit@broker.com",
            "meron@broker.com",
            "beki@broker.com",
            "sara@buyer.com",
            "abel@buyer.com",
        ]
        users = User.objects.filter(email__in=SEED_EMAILS)
        # Delete listings owned by seed brokers (cascades to details, media, location)
        Listing.objects.filter(user__in=users).delete()
        users.delete()
        Agency.objects.filter(name="EthioRealty Agency").delete()

    def _create_users(self):
        agency = Agency.objects.create(
            name="EthioRealty Agency",
            phone="+251911000001",
            address="Bole Road, Addis Ababa",
        )

        admin = User.objects.create_superuser(
            email="admin@ethiolistings.com",
            password="Admin1234!",
            first_name="Yohanis",
            last_name="Admin",
        )

        brokers_data = [
            dict(
                email="dawit@broker.com",
                first_name="Dawit",
                last_name="Bekele",
                phone="+251911223344",
                telegram="dawit_broker",
                whatsapp="+251911223344",
            ),
            dict(
                email="meron@broker.com",
                first_name="Meron",
                last_name="Haile",
                phone="+251922334455",
                telegram="meron_realty",
                whatsapp="+251922334455",
            ),
            dict(
                email="beki@broker.com",
                first_name="Beki",
                last_name="Tadesse",
                phone="+251933445566",
                telegram="beki_homes",
                whatsapp="+251933445566",
            ),
        ]

        brokers = []
        for d in brokers_data:
            u = User.objects.create_user(
                email=d["email"],
                password="Broker1234!",
                first_name=d["first_name"],
                last_name=d["last_name"],
                phone=d["phone"],
                role=UserRole.BROKER,
            )
            BrokerProfile.objects.create(
                user=u,
                agency=agency,
                bio=f"Senior broker at EthioRealty. Specializing in Addis Ababa properties.",
                telegram_username=d["telegram"],
                whatsapp_phone=d["whatsapp"],
            )
            brokers.append(u)

        buyers = []
        for email, first, last in [
            ("sara@buyer.com", "Sara", "Girma"),
            ("abel@buyer.com", "Abel", "Worku"),
        ]:
            u = User.objects.create_user(
                email=email,
                password="Buyer1234!",
                first_name=first,
                last_name=last,
                role=UserRole.BUYER,
            )
            buyers.append(u)

        return admin, brokers, buyers

    def _create_houses(self, brokers):
        dawit, meron, beki = brokers

        houses = [
            dict(
                user=dawit,
                title="Luxury 4BR Villa in Bole",
                title_am="ቦሌ ውስጥ ቅንጡ 4 መኝታ ቤት ቪላ",
                title_om="Mana jireenyaa qarooma qaban Bole keessatti",
                description="Stunning 4-bedroom villa in the heart of Bole, Addis Ababa. Features a spacious garden, modern kitchen, and 24/7 security. Perfect for a family looking for comfort and luxury in a prime location.",
                description_am="ቦሌ፣ አዲስ አበባ ውስጥ ያለ ቅንጡ 4 መኝታ ቤት ቪላ። ሰፊ የአትክልት ቦታ፣ ዘመናዊ ኩሽና እና 24/7 ጠባቂ አለው።",
                listing_type=ListingType.SALE,
                price=12_500_000,
                price_negotiable=True,
                is_verified=True,
                is_featured=True,
                region="Addis Ababa",
                zone="Bole",
                woreda="Bole Sub-City",
                lat=8.9975,
                lng=38.7891,
                house_type=HouseType.VILLA,
                bedrooms=4,
                bathrooms=3,
                area_sqm=320,
                furnished=True,
                parking=True,
                images=HOUSE_IMAGES[:3],
            ),
            dict(
                user=meron,
                title="Modern 3BR Apartment — Bole Medhanealem",
                title_am="ቦሌ መድሃኒዓለም — ዘመናዊ 3 መኝታ አፓርትማ",
                title_om="Hoteela 3BR ammayyaa — Bole Medhanealem",
                description="Brand new apartment in Bole Medhanealem area. Open-plan living room, fitted kitchen, two balconies with city views. Underground parking included.",
                description_am="ቦሌ መድሃኒዓለም ዘርፍ ውስጥ አዲስ አፓርትማ። ክፍት የእንግዳ ቤት፣ የተዘጋጀ ኩሽና እና ሁለት ሃሎ ያለው ከተማ ዕይታ።",
                listing_type=ListingType.SALE,
                price=8_200_000,
                price_negotiable=False,
                is_verified=True,
                is_featured=True,
                region="Addis Ababa",
                zone="Bole",
                woreda="Medhanealem",
                lat=9.0054,
                lng=38.7869,
                house_type=HouseType.APARTMENT,
                bedrooms=3,
                bathrooms=2,
                area_sqm=145,
                furnished=False,
                parking=True,
                images=HOUSE_IMAGES[1:4],
            ),
            dict(
                user=beki,
                title="2BR Apartment For Rent — Kazanchis",
                title_am="ካዛንቺስ — 2 መኝታ አፓርትማ ለኪራይ",
                title_om=None,
                description="Well-maintained 2-bedroom apartment in Kazanchis. Walking distance to Friendship and Ambassador hotels. Quiet neighborhood, ideal for professionals.",
                description_am="ካዛንቺስ ውስጥ ጥሩ ሁኔታ ያለው 2 መኝታ አፓርትማ። ለሙያተኞች ተስማሚ ጸጥ ያለ አካባቢ።",
                listing_type=ListingType.RENT,
                price=25_000,
                price_unit="per_month",
                price_negotiable=True,
                is_verified=True,
                is_featured=False,
                region="Addis Ababa",
                zone="Kirkos",
                woreda="Kazanchis",
                lat=9.0168,
                lng=38.7611,
                house_type=HouseType.APARTMENT,
                bedrooms=2,
                bathrooms=1,
                area_sqm=90,
                furnished=True,
                parking=False,
                images=HOUSE_IMAGES[2:4],
            ),
            dict(
                user=dawit,
                title="Studio Apartment — CMC Road",
                title_am="ሲኤምሲ መንገድ — ስቱዲዮ አፓርትማ",
                title_om=None,
                description="Compact studio apartment ideal for a young professional or couple. Newly renovated with modern finishes. On a main road with easy access to transport.",
                description_am="ወጣት ሙያተኞች ወይም ጥንዶች ለሆኑ ተስማሚ ስቱዲዮ አፓርትማ። ዘመናዊ ማጠናቀቂያ ያለው።",
                listing_type=ListingType.RENT,
                price=12_000,
                price_unit="per_month",
                price_negotiable=False,
                is_verified=False,
                is_featured=False,
                region="Addis Ababa",
                zone="Yeka",
                woreda="CMC",
                lat=9.0530,
                lng=38.8046,
                house_type=HouseType.STUDIO,
                bedrooms=0,
                bathrooms=1,
                area_sqm=45,
                furnished=True,
                parking=False,
                images=[HOUSE_IMAGES[4]],
            ),
            dict(
                user=meron,
                title="6BR Townhouse For Sale — Ayat",
                title_am="አያት — 6 መኝታ ቤት ታውን ሀውስ ለሽያጭ",
                title_om="Mana jireenyaa gurgurtaaf — Ayat",
                description="Spacious 6-bedroom townhouse in the Ayat real estate area. Private compound, rooftop terrace, and servant quarters. Great investment opportunity.",
                description_am="አያት ሪል እስቴት ዘርፍ ውስጥ ሰፊ 6 መኝታ ቤት ታውን ሀውስ። የግል ቅጥር ግቢ እና ጣሪያ ላይ ሃሎ።",
                listing_type=ListingType.SALE,
                price=18_000_000,
                price_negotiable=True,
                is_verified=False,
                is_featured=False,
                region="Addis Ababa",
                zone="Yeka",
                woreda="Ayat",
                lat=9.0611,
                lng=38.8387,
                house_type=HouseType.TOWNHOUSE,
                bedrooms=6,
                bathrooms=4,
                area_sqm=480,
                furnished=False,
                parking=True,
                images=HOUSE_IMAGES[:2],
            ),
        ]

        for h in houses:
            listing = Listing.objects.create(
                user=h["user"],
                category=ListingCategory.HOUSE,
                listing_type=h["listing_type"],
                title=h["title"],
                title_am=h.get("title_am"),
                title_om=h.get("title_om"),
                description=h.get("description"),
                description_am=h.get("description_am"),
                price=h.get("price"),
                price_unit=h.get("price_unit"),
                price_negotiable=h.get("price_negotiable", False),
                is_verified=h.get("is_verified", False),
                is_featured=h.get("is_featured", False),
                status=ListingStatus.ACTIVE,
            )
            Location.objects.create(
                listing=listing,
                region=h["region"],
                zone=h.get("zone"),
                woreda=h.get("woreda"),
                lat=h.get("lat"),
                lng=h.get("lng"),
            )
            HouseDetails.objects.create(
                listing=listing,
                house_type=h["house_type"],
                bedrooms=h.get("bedrooms"),
                bathrooms=h.get("bathrooms"),
                area_sqm=h.get("area_sqm"),
                furnished=h.get("furnished", False),
                parking=h.get("parking", False),
            )
            _add_images(listing, h["images"])

    def _create_lands(self, brokers):
        dawit, meron, beki = brokers

        lands = [
            dict(
                user=beki,
                title="600m² Commercial Plot — Lebu",
                title_am="ሌቡ — 600 ካሬ ሜትር የንግድ ቦታ",
                description="Prime commercial land on Lebu main road. Suitable for hotel, office building, or mixed-use development. Has title deed and electricity access.",
                description_am="ሌቡ ዋና መንገድ ላይ ያለ ቀዳሚ የንግድ ቦታ። ለሆቴል፣ ቢሮ ህንፃ ወይም ቅልቅል ልማት ተስማሚ።",
                listing_type=ListingType.SALE,
                price=4_800_000,
                price_negotiable=True,
                is_verified=True,
                is_featured=True,
                region="Addis Ababa",
                zone="Nifas Silk-Lafto",
                woreda="Lebu",
                lat=8.9720,
                lng=38.7543,
                total_area=600,
                area_unit=AreaUnit.SQM,
                land_use=LandUse.COMMERCIAL,
                has_title_deed=True,
                road_access=True,
                images=LAND_IMAGES[:2],
            ),
            dict(
                user=dawit,
                title="2 Hectare Agricultural Land — Debre Zeit Road",
                title_am="ደብረ ዘይት መንገድ — 2 ሄክታር የግብርና ቦታ",
                description="Flat, fertile agricultural land on the Debre Zeit road. Currently used for crop farming. Year-round water access. Suitable for investment or farming.",
                description_am="ደብረ ዘይት መንገድ ላይ ጠፍጣፋ ለም የግብርና ቦታ። ዓመቱን ሙሉ ውሃ ይደርሳል። ለኢንቨስትመንት ወይም ግብርና ተስማሚ።",
                listing_type=ListingType.SALE,
                price=6_200_000,
                price_negotiable=True,
                is_verified=False,
                is_featured=False,
                region="Oromia",
                zone="East Shewa",
                woreda="Dukem",
                lat=8.8552,
                lng=38.8129,
                total_area=2,
                area_unit=AreaUnit.HECTARE,
                land_use=LandUse.AGRICULTURAL,
                has_title_deed=True,
                road_access=True,
                images=[LAND_IMAGES[1]],
            ),
            dict(
                user=meron,
                title="250m² Residential Plot — Gerji",
                title_am="ገርጂ — 250 ካሬ ሜትር የቤት ቦታ",
                description="Corner residential plot in Gerji area. Surrounded by new constructions. Flat terrain, easy building. Title deed available.",
                description_am="ገርጂ ዘርፍ ውስጥ ያለ ማዕዘን የቤት ቦታ። አዲስ ግንባታዎች የተከበበ። ጠፍጣፋ ቦታ ለቤት ግንባታ ተስማሚ።",
                listing_type=ListingType.SALE,
                price=2_100_000,
                price_negotiable=False,
                is_verified=False,
                is_featured=False,
                region="Addis Ababa",
                zone="Bole",
                woreda="Gerji",
                lat=9.0118,
                lng=38.8199,
                total_area=250,
                area_unit=AreaUnit.SQM,
                land_use=LandUse.RESIDENTIAL,
                has_title_deed=True,
                road_access=True,
                images=[LAND_IMAGES[2]],
            ),
        ]

        for l in lands:
            listing = Listing.objects.create(
                user=l["user"],
                category=ListingCategory.LAND,
                listing_type=l["listing_type"],
                title=l["title"],
                title_am=l.get("title_am"),
                description=l.get("description"),
                description_am=l.get("description_am"),
                price=l.get("price"),
                price_negotiable=l.get("price_negotiable", False),
                is_verified=l.get("is_verified", False),
                is_featured=l.get("is_featured", False),
                status=ListingStatus.ACTIVE,
            )
            Location.objects.create(
                listing=listing,
                region=l["region"],
                zone=l.get("zone"),
                woreda=l.get("woreda"),
                lat=l.get("lat"),
                lng=l.get("lng"),
            )
            LandDetails.objects.create(
                listing=listing,
                total_area=l["total_area"],
                area_unit=l["area_unit"],
                land_use=l["land_use"],
                has_title_deed=l.get("has_title_deed", False),
                road_access=l.get("road_access", False),
            )
            _add_images(listing, l["images"])

    def _create_cars(self, brokers):
        dawit, meron, beki = brokers

        cars = [
            dict(
                user=dawit,
                title="Toyota Land Cruiser V8 — 2020",
                title_am="ቶዮታ ላንድ ክሩዘር ቪ8 — 2020",
                description="Well-maintained Land Cruiser V8 with full service history. Single owner, imported from Japan. Low mileage for its year. All original parts.",
                description_am="ሙሉ አገልግሎት ታሪክ ያለው ጥሩ ሁኔታ ያለው ላንድ ክሩዘር ቪ8። ከጃፓን የተመጣ። ዝቅተኛ ኪሎሜትር።",
                listing_type=ListingType.SALE,
                price=5_800_000,
                price_negotiable=True,
                is_verified=True,
                is_featured=True,
                region="Addis Ababa",
                zone="Bole",
                woreda="Bole Sub-City",
                lat=9.0021,
                lng=38.7925,
                make="Toyota",
                model="Land Cruiser V8",
                year=2020,
                mileage_km=58_000,
                transmission=Transmission.AUTOMATIC,
                fuel_type=FuelType.DIESEL,
                condition=CarCondition.EXCELLENT,
                color="White",
                images=CAR_IMAGES[:2],
            ),
            dict(
                user=beki,
                title="Toyota Corolla 2018 — For Sale",
                title_am="ቶዮታ ኮሮላ 2018 — ለሽያጭ",
                description="2018 Toyota Corolla in good condition. Used as a daily driver. New tyres fitted recently. A/C works perfectly. Ideal city car.",
                description_am="ጥሩ ሁኔታ ያለው 2018 ቶዮታ ኮሮላ። ዕለታዊ ምላሹ። አዲስ ጎማ። ኤሲ ሙሉ ሥራ ላይ።",
                listing_type=ListingType.SALE,
                price=1_650_000,
                price_negotiable=True,
                is_verified=False,
                is_featured=False,
                region="Addis Ababa",
                zone="Kirkos",
                woreda="Kazanchis",
                lat=9.0170,
                lng=38.7615,
                make="Toyota",
                model="Corolla",
                year=2018,
                mileage_km=112_000,
                transmission=Transmission.AUTOMATIC,
                fuel_type=FuelType.PETROL,
                condition=CarCondition.GOOD,
                color="Silver",
                images=[CAR_IMAGES[1]],
            ),
            dict(
                user=meron,
                title="Hyundai Tucson 2022 — Low Mileage",
                title_am="ሃዩንዳይ ቱሶን 2022 — ዝቅተኛ ኪሎሜትር",
                description="Nearly new Hyundai Tucson with panoramic roof and full options. Only 22,000km. Original customs cleared. First-hand.",
                description_am="ፓኖራሚክ ጣሪያ እና ሙሉ አማራጮች ያለው ቅርብ ጊዜ ሃዩንዳይ ቱሶን። 22,000 ኪሎሜትር ብቻ።",
                listing_type=ListingType.SALE,
                price=4_200_000,
                price_negotiable=False,
                is_verified=True,
                is_featured=False,
                region="Addis Ababa",
                zone="Bole",
                woreda="Medhanealem",
                lat=9.0051,
                lng=38.7867,
                make="Hyundai",
                model="Tucson",
                year=2022,
                mileage_km=22_000,
                transmission=Transmission.AUTOMATIC,
                fuel_type=FuelType.PETROL,
                condition=CarCondition.EXCELLENT,
                color="Blue",
                images=[CAR_IMAGES[2]],
            ),
        ]

        for c in cars:
            listing = Listing.objects.create(
                user=c["user"],
                category=ListingCategory.CAR,
                listing_type=c["listing_type"],
                title=c["title"],
                title_am=c.get("title_am"),
                description=c.get("description"),
                description_am=c.get("description_am"),
                price=c.get("price"),
                price_negotiable=c.get("price_negotiable", False),
                is_verified=c.get("is_verified", False),
                is_featured=c.get("is_featured", False),
                status=ListingStatus.ACTIVE,
            )
            Location.objects.create(
                listing=listing,
                region=c["region"],
                zone=c.get("zone"),
                woreda=c.get("woreda"),
                lat=c.get("lat"),
                lng=c.get("lng"),
            )
            CarDetails.objects.create(
                listing=listing,
                make=c["make"],
                model=c["model"],
                year=c.get("year"),
                mileage_km=c.get("mileage_km"),
                transmission=c["transmission"],
                fuel_type=c["fuel_type"],
                condition=c["condition"],
                color=c.get("color"),
            )
            _add_images(listing, c["images"])

    def _create_machines(self, brokers):
        dawit, meron, beki = brokers

        machines = [
            dict(
                user=beki,
                title="Komatsu PC200 Excavator — 2019",
                title_am="ኮማትሱ PC200 ቁፋሮ መሳሪያ — 2019",
                description="Komatsu PC200-8M0 hydraulic excavator. Ready to work, recently serviced. Available for immediate sale. Hydraulics and undercarriage in excellent condition.",
                description_am="ኮማትሱ PC200-8M0 ሃይድሮሊክ ቁፋሮ። ለቅጽበታዊ ሽያጭ። ሃይድሮሊክስ እና ስር ሁኔታ ጥሩ ነው።",
                listing_type=ListingType.SALE,
                price=9_500_000,
                price_negotiable=True,
                is_verified=True,
                is_featured=False,
                region="Oromia",
                zone="East Shewa",
                woreda="Dukem",
                lat=8.8549,
                lng=38.8122,
                machine_type="Excavator",
                manufacturer="Komatsu",
                year=2019,
                condition=MachineCondition.USED,
                operating_hours=4_200,
                images=MACHINE_IMAGES[:1],
            ),
            dict(
                user=meron,
                title="100kVA Diesel Generator — New",
                title_am="100kVA ዲዝል ጄኔሬተር — አዲስ",
                description="Brand new 100kVA Perkins diesel generator. Ideal for hotels, hospitals, and industrial use. Comes with ATS panel and 500L fuel tank. Delivery available.",
                description_am="አዲስ 100kVA ፓርኪንስ ዲዝል ጄኔሬተር። ለሆቴሎች፣ ሆስፒታሎች እና ኢንዱስትሪ ተስማሚ። ATS ፓናል ጭምር።",
                listing_type=ListingType.SALE,
                price=1_850_000,
                price_negotiable=False,
                is_verified=False,
                is_featured=False,
                region="Addis Ababa",
                zone="Nifas Silk-Lafto",
                woreda="Lebu",
                lat=8.9718,
                lng=38.7540,
                machine_type="Generator",
                manufacturer="Perkins",
                year=2024,
                condition=MachineCondition.NEW,
                operating_hours=0,
                images=MACHINE_IMAGES[1:],
            ),
        ]

        for m in machines:
            listing = Listing.objects.create(
                user=m["user"],
                category=ListingCategory.MACHINE,
                listing_type=m["listing_type"],
                title=m["title"],
                title_am=m.get("title_am"),
                description=m.get("description"),
                description_am=m.get("description_am"),
                price=m.get("price"),
                price_negotiable=m.get("price_negotiable", False),
                is_verified=m.get("is_verified", False),
                is_featured=m.get("is_featured", False),
                status=ListingStatus.ACTIVE,
            )
            Location.objects.create(
                listing=listing,
                region=m["region"],
                zone=m.get("zone"),
                woreda=m.get("woreda"),
                lat=m.get("lat"),
                lng=m.get("lng"),
            )
            MachineDetails.objects.create(
                listing=listing,
                machine_type=m["machine_type"],
                manufacturer=m.get("manufacturer"),
                year=m.get("year"),
                condition=m["condition"],
                operating_hours=m.get("operating_hours"),
            )
            _add_images(listing, m["images"])
