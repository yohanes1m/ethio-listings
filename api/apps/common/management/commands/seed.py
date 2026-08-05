"""
Management command: python manage.py seed

Creates realistic Ethiopian real estate seed data:
  - 1 admin, 5 brokers, 5 buyers
  - 8 houses, 5 lands, 6 cars, 4 machines (23 listings total)
  - Listings across Addis Ababa, Oromia, Amhara, SNNP, Dire Dawa
  - ACTIVE, SOLD, RENTED, INACTIVE status listings
  - Submissions in PENDING, CONTACTED, APPROVED states
  - Unsplash photo URLs for images (no Cloudinary needed)

Safe to run multiple times — clears previous seed data first.
"""

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.cars.models import CarCondition, CarDetails, FuelType, Transmission
from apps.deals.models import Deal
from apps.houses.models import HouseDetails, HouseType
from apps.lands.models import AreaUnit, LandDetails, LandUse
from apps.listings.models import Listing, ListingCategory, ListingStatus, ListingType, Location
from apps.machines.models import MachineCondition, MachineDetails
from apps.media.models import ListingMedia, MediaType
from apps.submissions.models import ListingRequest, SubmissionStatus
from apps.users.models import Agency, BrokerProfile, User, UserRole

SEED_EMAILS = [
    "admin@ethiolistings.com",
    "dawit@broker.com",
    "meron@broker.com",
    "beki@broker.com",
    "tigist@broker.com",
    "habtamu@broker.com",
    "sara@buyer.com",
    "abel@buyer.com",
    "helen@buyer.com",
    "solomon@buyer.com",
    "john@buyer.com",
]

# ---------------------------------------------------------------------------
# Unsplash image URLs — deterministic, no API key needed
# ---------------------------------------------------------------------------

HOUSE_IMAGES = [
    "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80",
    "https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=800&q=80",
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
    "https://images.unsplash.com/photo-1464146072230-91cabc968266?w=800&q=80",
    "https://images.unsplash.com/photo-1513584684374-8bab748fbf90?w=800&q=80",
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
    "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80",
]

LAND_IMAGES = [
    "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80",
    "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?w=800&q=80",
    "https://images.unsplash.com/photo-1614853316476-de00d14cb1fc?w=800&q=80",
    "https://images.unsplash.com/photo-1416331108676-a22ccb276e35?w=800&q=80",
    "https://images.unsplash.com/photo-1560749003-f4b1e17e2dfd?w=800&q=80",
]

CAR_IMAGES = [
    "https://images.unsplash.com/photo-1550355291-bbee04a92027?w=800&q=80",
    "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80",
    "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800&q=80",
    "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80",
    "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&q=80",
    "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&q=80",
]

MACHINE_IMAGES = [
    "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80",
    "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&q=80",
    "https://images.unsplash.com/photo-1565891741441-64926e441838?w=800&q=80",
    "https://images.unsplash.com/photo-1602081957921-9137a5d6eaee?w=800&q=80",
]


def _add_images(listing, urls):
    for i, url in enumerate(urls):
        ListingMedia.objects.create(
            listing=listing,
            url=url,
            media_type=MediaType.IMAGE,
            order=i,
            is_main=(i == 0),
        )


def _make_listing(user, category, data):
    listing = Listing.objects.create(
        user=user,
        category=category,
        listing_type=data["listing_type"],
        title=data["title"],
        title_am=data.get("title_am"),
        title_om=data.get("title_om"),
        description=data.get("description"),
        description_am=data.get("description_am"),
        price=data.get("price"),
        price_unit=data.get("price_unit"),
        price_negotiable=data.get("price_negotiable", False),
        is_verified=data.get("is_verified", False),
        is_featured=data.get("is_featured", False),
        status=data.get("status", ListingStatus.ACTIVE),
    )
    Location.objects.create(
        listing=listing,
        region=data["region"],
        zone=data.get("zone"),
        woreda=data.get("woreda"),
        lat=data.get("lat"),
        lng=data.get("lng"),
    )
    _add_images(listing, data["images"])
    return listing


class Command(BaseCommand):
    help = "Seed the database with realistic Ethiopian listing data"

    def handle(self, *args, **options):
        self.stdout.write("Clearing previous seed data...")
        self._clear()

        self.stdout.write("Creating users...")
        admin, brokers, buyers = self._create_users()

        self.stdout.write("Creating houses...")
        houses = self._create_houses(brokers)

        self.stdout.write("Creating lands...")
        lands = self._create_lands(brokers)

        self.stdout.write("Creating cars...")
        cars = self._create_cars(brokers)

        self.stdout.write("Creating machines...")
        machines = self._create_machines(brokers)

        self.stdout.write("Creating submissions...")
        self._create_submissions(buyers, brokers)

        self.stdout.write("Creating deals for closed listings...")
        self._create_deals(brokers)

        total = len(houses) + len(lands) + len(cars) + len(machines)
        self.stdout.write(self.style.SUCCESS(f"\nDone! Created {total} listings.\n"))
        self.stdout.write("─" * 50)
        self.stdout.write("Login credentials:")
        self.stdout.write("")
        self.stdout.write("  ADMIN")
        self.stdout.write("    admin@ethiolistings.com / Admin1234!")
        self.stdout.write("")
        self.stdout.write("  BROKERS")
        self.stdout.write("    dawit@broker.com    / Broker1234!")
        self.stdout.write("    meron@broker.com    / Broker1234!")
        self.stdout.write("    beki@broker.com     / Broker1234!")
        self.stdout.write("    tigist@broker.com   / Broker1234!")
        self.stdout.write("    habtamu@broker.com  / Broker1234!")
        self.stdout.write("")
        self.stdout.write("  BUYERS")
        self.stdout.write("    sara@buyer.com      / Buyer1234!")
        self.stdout.write("    abel@buyer.com      / Buyer1234!")
        self.stdout.write("    helen@buyer.com     / Buyer1234!")
        self.stdout.write("    solomon@buyer.com   / Buyer1234!")
        self.stdout.write("    john@buyer.com      / Buyer1234!")
        self.stdout.write("─" * 50)

    @transaction.atomic
    def _clear(self):
        users = User.objects.filter(email__in=SEED_EMAILS)
        Listing.objects.filter(user__in=users).delete()
        ListingRequest.objects.filter(owner__in=users).delete()
        users.delete()
        Agency.objects.filter(name__in=["EthioRealty Agency", "Addis Property Hub"]).delete()

    def _create_users(self):
        agency1 = Agency.objects.create(
            name="EthioRealty Agency",
            phone="+251911000001",
            address="Bole Road, Addis Ababa",
        )
        agency2 = Agency.objects.create(
            name="Addis Property Hub",
            phone="+251922000002",
            address="Meskel Square, Addis Ababa",
        )

        admin = User.objects.create_superuser(
            email="admin@ethiolistings.com",
            password="Admin1234!",
            first_name="Yohanis",
            last_name="Admin",
        )

        brokers_data = [
            dict(email="dawit@broker.com", first_name="Dawit", last_name="Bekele",
                 phone="+251911223344", telegram="dawit_broker", whatsapp="+251911223344",
                 agency=agency1, bio="Senior broker at EthioRealty. 8 years experience in Addis Ababa real estate."),
            dict(email="meron@broker.com", first_name="Meron", last_name="Haile",
                 phone="+251922334455", telegram="meron_realty", whatsapp="+251922334455",
                 agency=agency1, bio="Specialist in residential properties and luxury villas across Bole and CMC."),
            dict(email="beki@broker.com", first_name="Beki", last_name="Tadesse",
                 phone="+251933445566", telegram="beki_homes", whatsapp="+251933445566",
                 agency=agency2, bio="Expert in commercial properties and land deals in Addis Ababa and Oromia."),
            dict(email="tigist@broker.com", first_name="Tigist", last_name="Alemu",
                 phone="+251944556677", telegram="tigist_property", whatsapp="+251944556677",
                 agency=agency2, bio="Focused on vehicle sales and import. Cars, SUVs, and commercial vehicles."),
            dict(email="habtamu@broker.com", first_name="Habtamu", last_name="Girma",
                 phone="+251955667788", telegram="habtamu_listings", whatsapp="+251955667788",
                 agency=agency1, bio="Regional broker covering Hawassa, Bahir Dar, and Mekele listings."),
        ]

        brokers = []
        for d in brokers_data:
            u = User.objects.create_user(
                email=d["email"], password="Broker1234!",
                first_name=d["first_name"], last_name=d["last_name"],
                phone=d["phone"], role=UserRole.BROKER,
            )
            BrokerProfile.objects.create(
                user=u, agency=d["agency"], bio=d["bio"],
                telegram_username=d["telegram"], whatsapp_phone=d["whatsapp"],
            )
            brokers.append(u)

        buyers = []
        for email, first, last, phone in [
            ("sara@buyer.com", "Sara", "Girma", "+251911000101"),
            ("abel@buyer.com", "Abel", "Worku", "+251922000102"),
            ("helen@buyer.com", "Helen", "Teklu", "+251933000103"),
            ("solomon@buyer.com", "Solomon", "Mekonnen", "+251944000104"),
            ("john@buyer.com", "John", "Yohannes", "+251955000105"),
        ]:
            u = User.objects.create_user(
                email=email, password="Buyer1234!",
                first_name=first, last_name=last,
                phone=phone, role=UserRole.BUYER,
            )
            buyers.append(u)

        return admin, brokers, buyers

    def _create_houses(self, brokers):
        dawit, meron, beki, tigist, habtamu = brokers

        houses_data = [
            # Addis — active, verified, featured
            dict(user=dawit, listing_type=ListingType.SALE,
                 title="Luxury 4BR Villa in Bole", title_am="ቦሌ ውስጥ ቅንጡ 4 መኝታ ቤት ቪላ",
                 title_om="Mana jireenyaa qarooma qaban Bole keessatti",
                 description="Stunning 4-bedroom villa in the heart of Bole, Addis Ababa. Features spacious garden, modern kitchen, and 24/7 security. Perfect for a family looking for comfort and luxury.",
                 description_am="ቦሌ፣ አዲስ አበባ ውስጥ ያለ ቅንጡ 4 መኝታ ቤት ቪላ። ሰፊ የአትክልት ቦታ፣ ዘመናዊ ኩሽና እና 24/7 ጠባቂ አለው።",
                 price=12_500_000, price_negotiable=True,
                 is_verified=True, is_featured=True,
                 region="Addis Ababa", zone="Bole", woreda="Bole Sub-City",
                 lat=8.9975, lng=38.7891,
                 house_type=HouseType.VILLA, bedrooms=4, bathrooms=3, area_sqm=320,
                 furnished=True, parking=True, images=HOUSE_IMAGES[:3]),
            # Addis — active, verified, featured
            dict(user=meron, listing_type=ListingType.SALE,
                 title="Modern 3BR Apartment — Bole Medhanealem", title_am="ቦሌ መድሃኒዓለም — ዘመናዊ 3 መኝታ አፓርትማ",
                 description="Brand new apartment in Bole Medhanealem. Open-plan living, fitted kitchen, two balconies with city views. Underground parking.",
                 description_am="ቦሌ መድሃኒዓለም ውስጥ አዲስ አፓርትማ። ክፍት የእንግዳ ቤት፣ የተዘጋጀ ኩሽና እና ሁለት ሃሎ ከተማ ዕይታ።",
                 price=8_200_000, price_negotiable=False,
                 is_verified=True, is_featured=True,
                 region="Addis Ababa", zone="Bole", woreda="Medhanealem",
                 lat=9.0054, lng=38.7869,
                 house_type=HouseType.APARTMENT, bedrooms=3, bathrooms=2, area_sqm=145,
                 furnished=False, parking=True, images=HOUSE_IMAGES[1:4]),
            # Addis — rental, active
            dict(user=beki, listing_type=ListingType.RENT,
                 title="2BR Apartment For Rent — Kazanchis", title_am="ካዛንቺስ — 2 መኝታ አፓርትማ ለኪራይ",
                 description="Well-maintained 2BR apartment in Kazanchis. Walking distance to Friendship and Ambassador hotels. Quiet neighborhood, ideal for professionals.",
                 description_am="ካዛንቺስ ውስጥ ጥሩ ሁኔታ ያለው 2 መኝታ አፓርትማ። ለሙያተኞች ጸጥ ያለ አካባቢ።",
                 price=25_000, price_unit="per_month", price_negotiable=True,
                 is_verified=True, is_featured=False,
                 region="Addis Ababa", zone="Kirkos", woreda="Kazanchis",
                 lat=9.0168, lng=38.7611,
                 house_type=HouseType.APARTMENT, bedrooms=2, bathrooms=1, area_sqm=90,
                 furnished=True, parking=False, images=HOUSE_IMAGES[2:4]),
            # Addis — studio rental
            dict(user=dawit, listing_type=ListingType.RENT,
                 title="Studio Apartment — CMC Road", title_am="ሲኤምሲ መንገድ — ስቱዲዮ አፓርትማ",
                 description="Compact studio ideal for a young professional or couple. Newly renovated with modern finishes. On a main road with easy access to transport.",
                 description_am="ወጣት ሙያተኞች ለሆኑ ተስማሚ ስቱዲዮ አፓርትማ። ዘመናዊ ማጠናቀቂያ ያለው።",
                 price=12_000, price_unit="per_month",
                 is_verified=False, is_featured=False,
                 region="Addis Ababa", zone="Yeka", woreda="CMC",
                 lat=9.0530, lng=38.8046,
                 house_type=HouseType.STUDIO, bedrooms=0, bathrooms=1, area_sqm=45,
                 furnished=True, parking=False, images=[HOUSE_IMAGES[4]]),
            # Addis — townhouse, active
            dict(user=meron, listing_type=ListingType.SALE,
                 title="6BR Townhouse For Sale — Ayat", title_am="አያት — 6 መኝታ ቤት ታውን ሀውስ ለሽያጭ",
                 description="Spacious 6-bedroom townhouse in Ayat real estate area. Private compound, rooftop terrace, and servant quarters. Great investment opportunity.",
                 description_am="አያት ሪል እስቴት ዘርፍ ውስጥ ሰፊ 6 መኝታ ቤት ታውን ሀውስ። የግል ቅጥር ግቢ እና ጣሪያ ላይ ሃሎ።",
                 price=18_000_000, price_negotiable=True,
                 is_verified=False, is_featured=False,
                 region="Addis Ababa", zone="Yeka", woreda="Ayat",
                 lat=9.0611, lng=38.8387,
                 house_type=HouseType.TOWNHOUSE, bedrooms=6, bathrooms=4, area_sqm=480,
                 furnished=False, parking=True, images=HOUSE_IMAGES[:2]),
            # Hawassa — villa, active
            dict(user=habtamu, listing_type=ListingType.SALE,
                 title="Lake-View Villa For Sale — Hawassa", title_am="ሐዋሳ — ሐይቅ ዕይታ ቪላ ለሽያጭ",
                 description="Beautiful 3-bedroom villa with panoramic Lake Hawassa view. Terraced garden, tiled floors, and large veranda. 5 minutes from Hawassa town center.",
                 description_am="ሐዋሳ ሐይቅ ፓኖራሚክ ዕይታ ያለው ቆንጆ 3 መኝታ ቤት ቪላ። 5 ደቂቃ ከሐዋሳ ከተማ ማዕከል።",
                 price=4_200_000, price_negotiable=True,
                 is_verified=True, is_featured=False,
                 region="SNNP", zone="Sidama", woreda="Hawassa",
                 lat=7.0621, lng=38.4775,
                 house_type=HouseType.VILLA, bedrooms=3, bathrooms=2, area_sqm=200,
                 furnished=False, parking=True, images=HOUSE_IMAGES[5:7]),
            # Bahir Dar — apartment, rental
            dict(user=habtamu, listing_type=ListingType.RENT,
                 title="3BR Apartment for Rent — Bahir Dar", title_am="ባህር ዳር — 3 መኝታ አፓርትማ ለኪራይ",
                 description="Spacious furnished apartment near Bahir Dar University. Ideal for expats and academics. Includes DSTV, generator backup, and secure parking.",
                 description_am="ባህር ዳር ዩኒቨርሲቲ አቅራቢያ ሰፊ ያለ ያዋቀ አፓርትማ። ለባዕዳዊ ዜጎች እና አካዳሚያዊ ምሁራን ተስማሚ።",
                 price=18_000, price_unit="per_month",
                 is_verified=False, is_featured=False,
                 region="Amhara", zone="Bahir Dar", woreda="Bahir Dar Zuria",
                 lat=11.5931, lng=37.3917,
                 house_type=HouseType.APARTMENT, bedrooms=3, bathrooms=2, area_sqm=130,
                 furnished=True, parking=True, images=HOUSE_IMAGES[6:]),
            # Addis — SOLD listing (historic)
            dict(user=tigist, listing_type=ListingType.SALE,
                 title="2BR Apartment — Gerji (SOLD)", title_am="ገርጂ — 2 መኝታ አፓርትማ (ተሸጠ)",
                 description="Sold apartment in Gerji area. This listing is closed.",
                 price=3_500_000,
                 is_verified=True, is_featured=False,
                 status=ListingStatus.SOLD,
                 region="Addis Ababa", zone="Bole", woreda="Gerji",
                 lat=9.0118, lng=38.8199,
                 house_type=HouseType.APARTMENT, bedrooms=2, bathrooms=1, area_sqm=95,
                 furnished=False, parking=False, images=[HOUSE_IMAGES[3]]),
        ]

        results = []
        for h in houses_data:
            listing = _make_listing(h["user"], ListingCategory.HOUSE, h)
            HouseDetails.objects.create(
                listing=listing,
                house_type=h["house_type"],
                bedrooms=h.get("bedrooms"),
                bathrooms=h.get("bathrooms"),
                area_sqm=h.get("area_sqm"),
                furnished=h.get("furnished", False),
                parking=h.get("parking", False),
            )
            results.append(listing)
        return results

    def _create_lands(self, brokers):
        dawit, meron, beki, tigist, habtamu = brokers

        lands_data = [
            dict(user=beki, listing_type=ListingType.SALE,
                 title="600m² Commercial Plot — Lebu", title_am="ሌቡ — 600 ካሬ ሜትር የንግድ ቦታ",
                 description="Prime commercial land on Lebu main road. Suitable for hotel, office building, or mixed-use development. Title deed and electricity access.",
                 description_am="ሌቡ ዋና መንገድ ላይ ያለ ቀዳሚ የንግድ ቦታ። ለሆቴል፣ ቢሮ ህንፃ ወይም ቅልቅል ልማት ተስማሚ።",
                 price=4_800_000, price_negotiable=True,
                 is_verified=True, is_featured=True,
                 region="Addis Ababa", zone="Nifas Silk-Lafto", woreda="Lebu",
                 lat=8.9720, lng=38.7543,
                 total_area=600, area_unit=AreaUnit.SQM,
                 land_use=LandUse.COMMERCIAL, has_title_deed=True, road_access=True,
                 images=LAND_IMAGES[:2]),
            dict(user=dawit, listing_type=ListingType.SALE,
                 title="2 Hectare Agricultural Land — Debre Zeit Road", title_am="ደብረ ዘይት መንገድ — 2 ሄክታር የግብርና ቦታ",
                 description="Flat, fertile agricultural land on the Debre Zeit road. Year-round water access. Suitable for investment or farming.",
                 description_am="ደብረ ዘይት መንገድ ላይ ጠፍጣፋ ለም የግብርና ቦታ። ዓመቱን ሙሉ ውሃ ይደርሳል።",
                 price=6_200_000, price_negotiable=True,
                 is_verified=False, is_featured=False,
                 region="Oromia", zone="East Shewa", woreda="Dukem",
                 lat=8.8552, lng=38.8129,
                 total_area=2, area_unit=AreaUnit.HECTARE,
                 land_use=LandUse.AGRICULTURAL, has_title_deed=True, road_access=True,
                 images=[LAND_IMAGES[1]]),
            dict(user=meron, listing_type=ListingType.SALE,
                 title="250m² Residential Plot — Gerji", title_am="ገርጂ — 250 ካሬ ሜትር የቤት ቦታ",
                 description="Corner residential plot in Gerji area. Surrounded by new constructions. Flat terrain, easy building. Title deed available.",
                 description_am="ገርጂ ዘርፍ ውስጥ ያለ ማዕዘን የቤት ቦታ። አዲስ ግንባታዎች የተከበበ። ጠፍጣፋ ቦታ።",
                 price=2_100_000, price_negotiable=False,
                 is_verified=False, is_featured=False,
                 region="Addis Ababa", zone="Bole", woreda="Gerji",
                 lat=9.0118, lng=38.8199,
                 total_area=250, area_unit=AreaUnit.SQM,
                 land_use=LandUse.RESIDENTIAL, has_title_deed=True, road_access=True,
                 images=[LAND_IMAGES[2]]),
            dict(user=habtamu, listing_type=ListingType.SALE,
                 title="5 Hectare Mixed-Use Land — Hawassa Outskirts", title_am="ሐዋሳ ዳርቻ — 5 ሄክታር ቅልቅል ቦታ",
                 description="Large mixed-use land just outside Hawassa city. Excellent highway frontage. Ideal for industrial park, warehouse, or tourism investment.",
                 description_am="ሐዋሳ ከተማ ዳርቻ ያለ ትልቅ ቅልቅል ቦታ። ዋና መንገድ ፊት ለፊት። ለኢንዱስትሪ ወይም ቱሪዝም ኢንቨስትመንት ተስማሚ።",
                 price=8_500_000, price_negotiable=True,
                 is_verified=True, is_featured=False,
                 region="SNNP", zone="Sidama", woreda="Hawassa Zuria",
                 lat=7.0480, lng=38.4700,
                 total_area=5, area_unit=AreaUnit.HECTARE,
                 land_use=LandUse.MIXED, has_title_deed=True, road_access=True,
                 images=[LAND_IMAGES[3]]),
            dict(user=tigist, listing_type=ListingType.SALE,
                 title="1,200m² Residential Plot — Megenagna", title_am="መገናኛ — 1,200 ካሬ ሜትር የቤት ቦታ",
                 description="Large residential plot in Megenagna roundabout area. Well-connected location, great for apartment block or commercial development.",
                 description_am="መገናኛ ክብ መሄጃ አካባቢ ትልቅ የቤት ቦታ። ለአፓርትማ ህንፃ ወይም ንግድ ሕንፃ ተስማሚ።",
                 price=14_000_000, price_negotiable=True,
                 is_verified=True, is_featured=True,
                 region="Addis Ababa", zone="Bole", woreda="Megenagna",
                 lat=9.0270, lng=38.7938,
                 total_area=1200, area_unit=AreaUnit.SQM,
                 land_use=LandUse.RESIDENTIAL, has_title_deed=True, road_access=True,
                 images=LAND_IMAGES[4:]),
        ]

        results = []
        for l in lands_data:
            listing = _make_listing(l["user"], ListingCategory.LAND, l)
            LandDetails.objects.create(
                listing=listing,
                total_area=l["total_area"],
                area_unit=l["area_unit"],
                land_use=l["land_use"],
                has_title_deed=l.get("has_title_deed", False),
                road_access=l.get("road_access", False),
            )
            results.append(listing)
        return results

    def _create_cars(self, brokers):
        dawit, meron, beki, tigist, habtamu = brokers

        cars_data = [
            dict(user=tigist, listing_type=ListingType.SALE,
                 title="Toyota Land Cruiser V8 — 2020", title_am="ቶዮታ ላንድ ክሩዘር ቪ8 — 2020",
                 description="Well-maintained Land Cruiser V8 with full service history. Single owner, imported from Japan. Low mileage. All original parts.",
                 description_am="ሙሉ አገልግሎት ታሪክ ያለው ጥሩ ሁኔታ ያለው ላንድ ክሩዘር ቪ8። ከጃፓን የተመጣ። ዝቅተኛ ኪሎሜትር።",
                 price=5_800_000, price_negotiable=True,
                 is_verified=True, is_featured=True,
                 region="Addis Ababa", zone="Bole", woreda="Bole Sub-City",
                 lat=9.0021, lng=38.7925,
                 make="Toyota", model="Land Cruiser V8", year=2020,
                 mileage_km=58_000, transmission=Transmission.AUTOMATIC,
                 fuel_type=FuelType.DIESEL, condition=CarCondition.EXCELLENT, color="White",
                 images=CAR_IMAGES[:2]),
            dict(user=beki, listing_type=ListingType.SALE,
                 title="Toyota Corolla 2018 — For Sale", title_am="ቶዮታ ኮሮላ 2018 — ለሽያጭ",
                 description="2018 Toyota Corolla in good condition. New tyres. A/C works perfectly. Ideal city car.",
                 description_am="ጥሩ ሁኔታ ያለው 2018 ቶዮታ ኮሮላ። አዲስ ጎማ። ኤሲ ሙሉ ሥራ ላይ።",
                 price=1_650_000, price_negotiable=True,
                 is_verified=False, is_featured=False,
                 region="Addis Ababa", zone="Kirkos", woreda="Kazanchis",
                 lat=9.0170, lng=38.7615,
                 make="Toyota", model="Corolla", year=2018,
                 mileage_km=112_000, transmission=Transmission.AUTOMATIC,
                 fuel_type=FuelType.PETROL, condition=CarCondition.GOOD, color="Silver",
                 images=[CAR_IMAGES[1]]),
            dict(user=meron, listing_type=ListingType.SALE,
                 title="Hyundai Tucson 2022 — Low Mileage", title_am="ሃዩንዳይ ቱሶን 2022 — ዝቅተኛ ኪሎሜትር",
                 description="Nearly new Hyundai Tucson with panoramic roof and full options. Only 22,000km. Original customs cleared.",
                 description_am="ፓኖራሚክ ጣሪያ እና ሙሉ አማራጮች ያለው ቅርብ ጊዜ ሃዩንዳይ ቱሶን። 22,000 ኪሎሜትር ብቻ።",
                 price=4_200_000, price_negotiable=False,
                 is_verified=True, is_featured=False,
                 region="Addis Ababa", zone="Bole", woreda="Medhanealem",
                 lat=9.0051, lng=38.7867,
                 make="Hyundai", model="Tucson", year=2022,
                 mileage_km=22_000, transmission=Transmission.AUTOMATIC,
                 fuel_type=FuelType.PETROL, condition=CarCondition.EXCELLENT, color="Blue",
                 images=[CAR_IMAGES[2]]),
            dict(user=tigist, listing_type=ListingType.SALE,
                 title="Isuzu NPR Truck 2019 — Cargo", title_am="ኢሱዙ NPR ጭነት መኪና 2019",
                 description="Isuzu NPR 3.5t cargo truck. Used for goods transport. Engine recently overhauled. Ready for immediate use. All papers in order.",
                 description_am="ኢሱዙ NPR 3.5 ቶን ጭነት መኪና። ሞተር ቅርብ ጊዜ ተስተካክሏል። ሁሉ ሰነዶች ተሟልተዋል።",
                 price=2_100_000, price_negotiable=True,
                 is_verified=True, is_featured=False,
                 region="Addis Ababa", zone="Nifas Silk-Lafto", woreda="Lebu",
                 lat=8.9718, lng=38.7540,
                 make="Isuzu", model="NPR", year=2019,
                 mileage_km=175_000, transmission=Transmission.MANUAL,
                 fuel_type=FuelType.DIESEL, condition=CarCondition.GOOD, color="White",
                 images=[CAR_IMAGES[3]]),
            dict(user=dawit, listing_type=ListingType.SALE,
                 title="BMW 3 Series 2021 — Sport Package", title_am="BMW 3 ሶስት ሄጃ 2021 — ስፖርት ፓኬጅ",
                 description="BMW 330i sport package, fully imported and customs cleared. Sunroof, sport rims, heads-up display. Only 30,000km.",
                 description_am="BMW 330i ስፖርት ፓኬጅ። ሙሉ ወጪ ቀረጥ ሳይቀር ገብቷል። ፀሐይ ሸፈን፣ ስፖርት ሪም።",
                 price=6_500_000, price_negotiable=False,
                 is_verified=True, is_featured=True,
                 region="Addis Ababa", zone="Bole", woreda="Bole Sub-City",
                 lat=9.0025, lng=38.7930,
                 make="BMW", model="330i", year=2021,
                 mileage_km=30_000, transmission=Transmission.AUTOMATIC,
                 fuel_type=FuelType.PETROL, condition=CarCondition.EXCELLENT, color="Black",
                 images=[CAR_IMAGES[4]]),
            # RENTED car (for status testing)
            dict(user=tigist, listing_type=ListingType.RENT,
                 title="Toyota Hiace Minibus — For Rent", title_am="ቶዮታ ሃያስ ሚኒባስ — ለኪራይ",
                 description="14-seat Toyota Hiace for daily or weekly rental. Available for company transport, events, or airport transfers.",
                 description_am="ለኩባንያ ትራንስፖርት ወይም ዝግጅቶች 14 መቀመጫ ቶዮታ ሃያስ ለዕለት ወይም ሳምንት ኪራይ።",
                 price=3_500, price_unit="per_month",
                 is_verified=False, is_featured=False,
                 status=ListingStatus.RENTED,
                 region="Addis Ababa", zone="Bole", woreda="Bole Sub-City",
                 lat=9.0010, lng=38.7900,
                 make="Toyota", model="Hiace", year=2017,
                 mileage_km=210_000, transmission=Transmission.MANUAL,
                 fuel_type=FuelType.DIESEL, condition=CarCondition.GOOD, color="White",
                 images=[CAR_IMAGES[5]]),
        ]

        results = []
        for c in cars_data:
            listing = _make_listing(c["user"], ListingCategory.CAR, c)
            CarDetails.objects.create(
                listing=listing,
                make=c["make"], model=c["model"], year=c.get("year"),
                mileage_km=c.get("mileage_km"),
                transmission=c["transmission"], fuel_type=c["fuel_type"],
                condition=c["condition"], color=c.get("color"),
            )
            results.append(listing)
        return results

    def _create_machines(self, brokers):
        dawit, meron, beki, tigist, habtamu = brokers

        machines_data = [
            dict(user=beki, listing_type=ListingType.SALE,
                 title="Komatsu PC200 Excavator — 2019", title_am="ኮማትሱ PC200 ቁፋሮ መሳሪያ — 2019",
                 description="Komatsu PC200-8M0 hydraulic excavator. Ready to work, recently serviced. Hydraulics and undercarriage in excellent condition.",
                 description_am="ኮማትሱ PC200-8M0 ሃይድሮሊክ ቁፋሮ። ሃይድሮሊክስ እና ስር ሁኔታ ጥሩ ነው።",
                 price=9_500_000, price_negotiable=True,
                 is_verified=True, is_featured=False,
                 region="Oromia", zone="East Shewa", woreda="Dukem",
                 lat=8.8549, lng=38.8122,
                 machine_type="Excavator", manufacturer="Komatsu", year=2019,
                 condition=MachineCondition.USED, operating_hours=4_200,
                 images=MACHINE_IMAGES[:1]),
            dict(user=meron, listing_type=ListingType.SALE,
                 title="100kVA Diesel Generator — New", title_am="100kVA ዲዝል ጄኔሬተር — አዲስ",
                 description="Brand new 100kVA Perkins diesel generator. Ideal for hotels, hospitals, and industrial use. Comes with ATS panel and 500L fuel tank.",
                 description_am="አዲስ 100kVA ፓርኪንስ ዲዝል ጄኔሬተር። ለሆቴሎች፣ ሆስፒታሎች ተስማሚ።",
                 price=1_850_000, price_negotiable=False,
                 is_verified=False, is_featured=False,
                 region="Addis Ababa", zone="Nifas Silk-Lafto", woreda="Lebu",
                 lat=8.9718, lng=38.7540,
                 machine_type="Generator", manufacturer="Perkins", year=2024,
                 condition=MachineCondition.NEW, operating_hours=0,
                 images=MACHINE_IMAGES[1:2]),
            dict(user=habtamu, listing_type=ListingType.SALE,
                 title="CAT D6 Bulldozer — 2017", title_am="CAT D6 ቡልዶዘር — 2017",
                 description="Caterpillar D6 bulldozer with blade and ripper. Used in road construction. Well maintained, all hydraulics functional. Ready to work.",
                 description_am="ካተርፒላር D6 ቡልዶዘር። መንገድ ግንባታ ላይ ያገለገለ። ሁሉ ሃይድሮሊክ ሥራ ላይ ነው።",
                 price=12_000_000, price_negotiable=True,
                 is_verified=True, is_featured=True,
                 region="Amhara", zone="North Shewa", woreda="Debre Sina",
                 lat=9.8540, lng=39.7600,
                 machine_type="Bulldozer", manufacturer="Caterpillar", year=2017,
                 condition=MachineCondition.USED, operating_hours=8_500,
                 images=[MACHINE_IMAGES[2]]),
            dict(user=dawit, listing_type=ListingType.RENT,
                 title="Concrete Mixer 500L — For Rent", title_am="500 ሊትር ኮንክሪት ሚክሰር — ለኪራይ",
                 description="500L concrete mixer available for daily or weekly hire. Ideal for small to medium construction projects in Addis Ababa and surroundings.",
                 description_am="ለዕለት ወይም ሳምንት ኪራይ 500 ሊትር ኮንክሪት ሚክሰር። ለትናንሽ ወይም መካከለኛ ግንባታ ፕሮጀክቶች።",
                 price=2_500, price_unit="per_month",
                 is_verified=False, is_featured=False,
                 region="Addis Ababa", zone="Akaki Kality", woreda="Akaki",
                 lat=8.9230, lng=38.7930,
                 machine_type="Concrete Mixer", manufacturer="ALTRAD", year=2020,
                 condition=MachineCondition.USED, operating_hours=600,
                 images=[MACHINE_IMAGES[3]]),
        ]

        results = []
        for m in machines_data:
            listing = _make_listing(m["user"], ListingCategory.MACHINE, m)
            MachineDetails.objects.create(
                listing=listing,
                machine_type=m["machine_type"],
                manufacturer=m.get("manufacturer"),
                year=m.get("year"),
                condition=m["condition"],
                operating_hours=m.get("operating_hours"),
            )
            results.append(listing)
        return results

    def _create_submissions(self, buyers, brokers):
        dawit = brokers[0]
        sara, abel, helen, solomon, john = buyers

        submissions = [
            dict(owner=sara, assigned_to=dawit, status=SubmissionStatus.PENDING,
                 category="HOUSE", listing_type="RENT",
                 details={"bedrooms": 2, "area": 90, "furnished": True},
                 region="Addis Ababa", zone="Bole", woreda="Bole Sub-City",
                 owner_phone="+251911000101", owner_whatsapp="+251911000101",
                 photos=["https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&q=60"]),
            dict(owner=abel, assigned_to=dawit, status=SubmissionStatus.CONTACTED,
                 category="LAND", listing_type="SALE",
                 details={"total_area": 300, "land_use": "RESIDENTIAL"},
                 region="Addis Ababa", zone="Yeka", woreda="CMC",
                 owner_phone="+251922000102", owner_whatsapp="+251922000102",
                 photos=[],
                 broker_notes="Called Abel on 2026-08-01. Site visit scheduled for next week."),
            dict(owner=helen, assigned_to=None, status=SubmissionStatus.PENDING,
                 category="CAR", listing_type="SALE",
                 details={"make": "Toyota", "model": "Fortuner", "year": 2021},
                 region="Addis Ababa", zone="Kirkos", woreda="Kazanchis",
                 owner_phone="+251933000103",
                 photos=["https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&q=60"]),
            dict(owner=solomon, assigned_to=None, status=SubmissionStatus.PENDING,
                 category="HOUSE", listing_type="SALE",
                 details={"bedrooms": 4, "area": 250, "house_type": "VILLA"},
                 region="Addis Ababa", zone="Bole", woreda="Gerji",
                 owner_phone="+251944000104", owner_whatsapp="+251944000104",
                 photos=["https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400&q=60",
                         "https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=400&q=60"]),
        ]

        for s in submissions:
            ListingRequest.objects.create(
                owner=s["owner"],
                assigned_to=s.get("assigned_to"),
                category=s["category"],
                listing_type=s["listing_type"],
                details=s.get("details", {}),
                photos=s.get("photos", []),
                region=s["region"],
                zone=s.get("zone"),
                woreda=s.get("woreda"),
                owner_phone=s["owner_phone"],
                owner_whatsapp=s.get("owner_whatsapp"),
                status=s["status"],
                broker_notes=s.get("broker_notes"),
            )

    def _create_deals(self, brokers):
        dawit, meron, beki, tigist, habtamu = brokers

        # Find the SOLD listings and create deals
        sold = Listing.objects.filter(status=ListingStatus.SOLD, user__in=brokers).first()
        if sold:
            Deal.objects.get_or_create(
                listing=sold,
                defaults=dict(
                    closed_by=sold.user,
                    actual_price=sold.price,
                    commission_rate=3,
                    commission_amount=float(sold.price or 0) * 3 / 100,
                    notes="Smooth transaction. Buyer paid cash.",
                ),
            )

        rented = Listing.objects.filter(status=ListingStatus.RENTED, user__in=brokers).first()
        if rented:
            Deal.objects.get_or_create(
                listing=rented,
                defaults=dict(
                    closed_by=rented.user,
                    actual_price=rented.price,
                    commission_rate=5,
                    commission_amount=float(rented.price or 0) * 5 / 100,
                    notes="1-year lease. Commission paid by landlord.",
                ),
            )
