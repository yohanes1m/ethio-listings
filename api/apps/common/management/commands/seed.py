"""
Management command: python manage.py seed

Generates ~400 listings across all categories with all possible state/data combinations:
  - 1 admin, 5 brokers, 5 buyers, 2 agencies
  - ~100 houses, ~100 lands, ~100 cars, ~100 machines
  - All statuses: ACTIVE, INACTIVE, SOLD, RENTED, EXPIRED
  - Mix of SALE / RENT listing types
  - Verified/unverified, featured/unfeatured
  - Price negotiable/not
  - Various Ethiopian cities: Addis Ababa, Hawassa, Bahir Dar, Dire Dawa,
    Mekele, Jimma, Adama, Gondar, Dessie, Jijiga
  - Submissions in all states; deals for closed listings

Safe to re-run — clears seed data by email list first.
"""

import itertools
import random

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

# ── Image pools ──────────────────────────────────────────────────────────────
HOUSE_IMGS = [
    "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80",
    "https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=800&q=80",
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
    "https://images.unsplash.com/photo-1464146072230-91cabc968266?w=800&q=80",
    "https://images.unsplash.com/photo-1513584684374-8bab748fbf90?w=800&q=80",
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
    "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80",
    "https://images.unsplash.com/photo-1449844908441-8829872d2607?w=800&q=80",
    "https://images.unsplash.com/photo-1416331108676-a22ccb276e35?w=800&q=80",
]
LAND_IMGS = [
    "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80",
    "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?w=800&q=80",
    "https://images.unsplash.com/photo-1614853316476-de00d14cb1fc?w=800&q=80",
    "https://images.unsplash.com/photo-1416331108676-a22ccb276e35?w=800&q=80",
    "https://images.unsplash.com/photo-1560749003-f4b1e17e2dfd?w=800&q=80",
    "https://images.unsplash.com/photo-1527576539890-dfa815648363?w=800&q=80",
]
CAR_IMGS = [
    "https://images.unsplash.com/photo-1550355291-bbee04a92027?w=800&q=80",
    "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80",
    "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800&q=80",
    "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80",
    "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&q=80",
    "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&q=80",
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
    "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=80",
]
MACHINE_IMGS = [
    "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80",
    "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&q=80",
    "https://images.unsplash.com/photo-1565891741441-64926e441838?w=800&q=80",
    "https://images.unsplash.com/photo-1602081957921-9137a5d6eaee?w=800&q=80",
    "https://images.unsplash.com/photo-1607400201515-c2c41c07d307?w=800&q=80",
]

# ── Location data ─────────────────────────────────────────────────────────────
LOCATIONS = [
    # (region, zone, woreda, lat, lng)
    ("Addis Ababa", "Bole", "Bole Sub-City", 8.9975, 38.7891),
    ("Addis Ababa", "Bole", "Medhanealem", 9.0054, 38.7869),
    ("Addis Ababa", "Bole", "Gerji", 9.0118, 38.8199),
    ("Addis Ababa", "Bole", "Megenagna", 9.0270, 38.7938),
    ("Addis Ababa", "Kirkos", "Kazanchis", 9.0168, 38.7611),
    ("Addis Ababa", "Kirkos", "Bole Bulbula", 9.0042, 38.7730),
    ("Addis Ababa", "Yeka", "CMC", 9.0530, 38.8046),
    ("Addis Ababa", "Yeka", "Ayat", 9.0611, 38.8387),
    ("Addis Ababa", "Yeka", "Summit", 9.0710, 38.8200),
    ("Addis Ababa", "Nifas Silk-Lafto", "Lebu", 8.9720, 38.7543),
    ("Addis Ababa", "Nifas Silk-Lafto", "Mekanissa", 9.0020, 38.7340),
    ("Addis Ababa", "Akaki Kality", "Akaki", 8.9230, 38.7930),
    ("Addis Ababa", "Kolfe Keranio", "Kolfe", 9.0160, 38.7230),
    ("Addis Ababa", "Gulele", "Piassa", 9.0337, 38.7535),
    ("Addis Ababa", "Lideta", "Mexico", 9.0165, 38.7470),
    ("Oromia", "East Shewa", "Dukem", 8.8552, 38.8129),
    ("Oromia", "East Shewa", "Adama", 8.5400, 39.2700),
    ("Oromia", "West Hararghe", "Chiro", 9.0700, 40.8700),
    ("Oromia", "Jimma", "Jimma", 7.6780, 36.8340),
    ("Oromia", "West Shewa", "Ambo", 8.9900, 37.8600),
    ("Amhara", "Bahir Dar", "Bahir Dar Zuria", 11.5931, 37.3917),
    ("Amhara", "North Gondar", "Gondar", 12.6090, 37.4680),
    ("Amhara", "South Wollo", "Dessie", 11.1300, 39.6400),
    ("SNNP", "Sidama", "Hawassa", 7.0621, 38.4775),
    ("SNNP", "Sidama", "Hawassa Zuria", 7.0480, 38.4700),
    ("SNNP", "Gedeo", "Yirgacheffe", 6.1800, 38.2100),
    ("Tigray", "Central Tigray", "Mekele", 13.4900, 39.4700),
    ("Tigray", "Southern Tigray", "Adwa", 14.1700, 38.9000),
    ("Somali", "Jijiga", "Jijiga", 9.3500, 42.7900),
    ("Dire Dawa", "Dire Dawa", "Dire Dawa", 9.6000, 41.8600),
]

# ── Status/flag combinations ─────────────────────────────────────────────────
# (status, listing_type, is_verified, is_featured, price_negotiable)
COMBOS = list(itertools.product(
    [ListingStatus.ACTIVE, ListingStatus.ACTIVE, ListingStatus.ACTIVE,
     ListingStatus.INACTIVE, ListingStatus.SOLD, ListingStatus.RENTED, ListingStatus.EXPIRED],
    [ListingType.SALE, ListingType.RENT],
    [True, False],   # is_verified
    [True, False],   # is_featured
    [True, False],   # price_negotiable
))

# ── House specs ───────────────────────────────────────────────────────────────
HOUSE_SPECS = [
    (HouseType.VILLA, 4, 3, 320, True, True, 12_500_000, None),
    (HouseType.APARTMENT, 3, 2, 145, False, True, 8_200_000, None),
    (HouseType.APARTMENT, 2, 1, 90, True, False, 25_000, "per_month"),
    (HouseType.STUDIO, 0, 1, 45, True, False, 12_000, "per_month"),
    (HouseType.TOWNHOUSE, 6, 4, 480, False, True, 18_000_000, None),
    (HouseType.VILLA, 3, 2, 200, False, True, 4_200_000, None),
    (HouseType.APARTMENT, 3, 2, 130, True, True, 18_000, "per_month"),
    (HouseType.APARTMENT, 2, 1, 95, False, False, 3_500_000, None),
    (HouseType.VILLA, 5, 4, 400, True, True, 22_000_000, None),
    (HouseType.APARTMENT, 1, 1, 60, True, False, 8_500, "per_month"),
    (HouseType.TOWNHOUSE, 4, 3, 280, False, True, 9_800_000, None),
    (HouseType.STUDIO, 0, 1, 35, True, False, 7_000, "per_month"),
    (HouseType.APARTMENT, 3, 2, 110, False, False, 6_500_000, None),
    (HouseType.VILLA, 4, 3, 350, True, True, 15_000_000, None),
    (HouseType.APARTMENT, 2, 2, 100, True, False, 20_000, "per_month"),
    (HouseType.TOWNHOUSE, 3, 3, 250, False, False, 7_200_000, None),
    (HouseType.VILLA, 6, 5, 600, True, True, 35_000_000, None),
    (HouseType.APARTMENT, 4, 3, 175, False, True, 11_500_000, None),
    (HouseType.STUDIO, 0, 1, 50, True, False, 10_000, "per_month"),
    (HouseType.APARTMENT, 2, 1, 80, False, False, 5_000_000, None),
]

HOUSE_TITLES = [
    ("Luxury {bed}BR Villa in {zone}", "ቅንጡ {bed} መኝታ ቤት ቪላ — {zone}"),
    ("Modern {bed}BR Apartment — {zone}", "ዘመናዊ {bed} መኝታ አፓርትማ — {zone}"),
    ("{bed}BR Apartment For {ltype} — {zone}", "{zone} — {bed} መኝታ አፓርትማ ለ{ltype_am}"),
    ("Studio Apartment — {zone}", "{zone} — ስቱዲዮ አፓርትማ"),
    ("{bed}BR Townhouse For Sale — {zone}", "{zone} — {bed} መኝታ ቤት ታውን ሀውስ"),
    ("Spacious {bed}BR Home in {zone}", "{zone} ሰፊ {bed} መኝታ ቤት"),
    ("Furnished {bed}BR Flat — {zone}", "ያዋቀረ {bed} መኝታ አፓርትማ — {zone}"),
    ("Newly Built {bed}BR — {zone}", "አዲስ ግንባታ {bed} መኝታ — {zone}"),
]

# ── Land specs ────────────────────────────────────────────────────────────────
LAND_SPECS = [
    (600, AreaUnit.SQM, LandUse.COMMERCIAL, True, True, 4_800_000),
    (2, AreaUnit.HECTARE, LandUse.AGRICULTURAL, True, True, 6_200_000),
    (250, AreaUnit.SQM, LandUse.RESIDENTIAL, True, True, 2_100_000),
    (5, AreaUnit.HECTARE, LandUse.MIXED, True, True, 8_500_000),
    (1200, AreaUnit.SQM, LandUse.RESIDENTIAL, True, True, 14_000_000),
    (300, AreaUnit.SQM, LandUse.COMMERCIAL, True, True, 3_600_000),
    (1, AreaUnit.HECTARE, LandUse.AGRICULTURAL, False, True, 2_500_000),
    (800, AreaUnit.SQM, LandUse.MIXED, True, False, 7_800_000),
    (400, AreaUnit.SQM, LandUse.RESIDENTIAL, True, True, 4_200_000),
    (3, AreaUnit.HECTARE, LandUse.AGRICULTURAL, True, True, 9_000_000),
    (150, AreaUnit.SQM, LandUse.RESIDENTIAL, True, True, 1_200_000),
    (2000, AreaUnit.SQM, LandUse.COMMERCIAL, True, True, 28_000_000),
    (500, AreaUnit.SQM, LandUse.MIXED, False, True, 5_500_000),
    (0.5, AreaUnit.HECTARE, LandUse.AGRICULTURAL, True, True, 1_100_000),
    (750, AreaUnit.SQM, LandUse.RESIDENTIAL, True, True, 6_300_000),
]

LAND_TITLES = [
    ("{area}{unit} Commercial Plot — {zone}", "{zone} — {area}{unit} የንግድ ቦታ"),
    ("{area}{unit} Agricultural Land — {zone}", "{zone} — {area}{unit} የግብርና ቦታ"),
    ("{area}{unit} Residential Plot — {zone}", "{zone} — {area}{unit} የቤት ቦታ"),
    ("{area}{unit} Mixed-Use Land — {zone}", "{zone} — {area}{unit} ቅልቅል ቦታ"),
]

# ── Car specs ─────────────────────────────────────────────────────────────────
CAR_SPECS = [
    ("Toyota", "Land Cruiser V8", 2020, 58_000, Transmission.AUTOMATIC, FuelType.DIESEL, CarCondition.EXCELLENT, "White", 5_800_000, None),
    ("Toyota", "Corolla", 2018, 112_000, Transmission.AUTOMATIC, FuelType.PETROL, CarCondition.GOOD, "Silver", 1_650_000, None),
    ("Hyundai", "Tucson", 2022, 22_000, Transmission.AUTOMATIC, FuelType.PETROL, CarCondition.EXCELLENT, "Blue", 4_200_000, None),
    ("Isuzu", "NPR", 2019, 175_000, Transmission.MANUAL, FuelType.DIESEL, CarCondition.GOOD, "White", 2_100_000, None),
    ("BMW", "330i", 2021, 30_000, Transmission.AUTOMATIC, FuelType.PETROL, CarCondition.EXCELLENT, "Black", 6_500_000, None),
    ("Toyota", "Hiace", 2017, 210_000, Transmission.MANUAL, FuelType.DIESEL, CarCondition.GOOD, "White", 3_500, "per_month"),
    ("Nissan", "X-Trail", 2019, 88_000, Transmission.AUTOMATIC, FuelType.PETROL, CarCondition.GOOD, "Gray", 3_200_000, None),
    ("Toyota", "Land Cruiser Prado", 2018, 95_000, Transmission.AUTOMATIC, FuelType.DIESEL, CarCondition.EXCELLENT, "Pearl", 4_800_000, None),
    ("Mitsubishi", "Pajero", 2015, 140_000, Transmission.AUTOMATIC, FuelType.DIESEL, CarCondition.GOOD, "Silver", 2_800_000, None),
    ("Toyota", "Hilux", 2021, 45_000, Transmission.MANUAL, FuelType.DIESEL, CarCondition.EXCELLENT, "White", 3_900_000, None),
    ("Isuzu", "D-Max", 2020, 62_000, Transmission.MANUAL, FuelType.DIESEL, CarCondition.EXCELLENT, "Blue", 3_100_000, None),
    ("Hyundai", "Sonata", 2019, 78_000, Transmission.AUTOMATIC, FuelType.PETROL, CarCondition.GOOD, "Black", 1_950_000, None),
    ("Toyota", "Fortuner", 2022, 18_000, Transmission.AUTOMATIC, FuelType.DIESEL, CarCondition.EXCELLENT, "White", 5_200_000, None),
    ("Mercedes-Benz", "C200", 2020, 42_000, Transmission.AUTOMATIC, FuelType.PETROL, CarCondition.EXCELLENT, "Silver", 7_800_000, None),
    ("Volkswagen", "Polo", 2018, 95_000, Transmission.MANUAL, FuelType.PETROL, CarCondition.GOOD, "Red", 1_200_000, None),
    ("Suzuki", "Vitara", 2021, 35_000, Transmission.AUTOMATIC, FuelType.PETROL, CarCondition.EXCELLENT, "Orange", 2_600_000, None),
    ("Honda", "CR-V", 2019, 72_000, Transmission.AUTOMATIC, FuelType.PETROL, CarCondition.GOOD, "Gray", 3_500_000, None),
    ("Kia", "Sportage", 2020, 55_000, Transmission.AUTOMATIC, FuelType.PETROL, CarCondition.EXCELLENT, "Red", 3_300_000, None),
    ("Toyota", "Camry", 2017, 130_000, Transmission.AUTOMATIC, FuelType.PETROL, CarCondition.FAIR, "Champagne", 1_100_000, None),
    ("Ford", "Ranger", 2021, 48_000, Transmission.AUTOMATIC, FuelType.DIESEL, CarCondition.EXCELLENT, "White", 3_700_000, None),
]

# ── Machine specs ─────────────────────────────────────────────────────────────
MACHINE_SPECS = [
    ("Excavator", "Komatsu", "PC200", 2019, MachineCondition.USED, 4_200, 9_500_000, None),
    ("Generator", "Perkins", "100kVA", 2024, MachineCondition.NEW, 0, 1_850_000, None),
    ("Bulldozer", "Caterpillar", "D6", 2017, MachineCondition.USED, 8_500, 12_000_000, None),
    ("Concrete Mixer", "ALTRAD", "500L", 2020, MachineCondition.USED, 600, 2_500, "per_month"),
    ("Crane", "Liebherr", "LTM 1050", 2016, MachineCondition.USED, 12_000, 18_000_000, None),
    ("Forklift", "Toyota", "8FBN25", 2021, MachineCondition.RECONDITIONED, 1_500, 2_800_000, None),
    ("Grader", "Caterpillar", "140K", 2018, MachineCondition.USED, 7_200, 9_000_000, None),
    ("Loader", "Volvo", "L90H", 2020, MachineCondition.RECONDITIONED, 3_000, 11_500_000, None),
    ("Generator", "Cummins", "250kVA", 2022, MachineCondition.NEW, 0, 4_200_000, None),
    ("Compactor", "Bomag", "BW213", 2019, MachineCondition.USED, 5_500, 6_800_000, None),
    ("Backhoe Loader", "JCB", "3CX", 2020, MachineCondition.RECONDITIONED, 2_800, 7_500_000, None),
    ("Water Tanker", "Isuzu", "5000L", 2018, MachineCondition.RECONDITIONED, 95_000, 1_500, "per_month"),
    ("Drilling Rig", "Atlas Copco", "ROC D7", 2015, MachineCondition.USED, 20_000, 22_000_000, None),
    ("Concrete Pump", "Putzmeister", "M52-5", 2021, MachineCondition.NEW, 0, 8_500_000, None),
    ("Generator", "Kirloskar", "62.5kVA", 2023, MachineCondition.NEW, 0, 980_000, None),
]


def _imgs(pool, n=2):
    return [pool[i % len(pool)] for i in range(n)]


def _add_images(listing, urls):
    for i, url in enumerate(urls):
        ListingMedia.objects.create(
            listing=listing, url=url,
            media_type=MediaType.IMAGE, order=i, is_main=(i == 0),
        )


class Command(BaseCommand):
    help = "Seed ~400 listings with all status/type/flag combinations"

    def handle(self, *args, **options):
        self.stdout.write("Clearing previous seed data...")
        self._clear()

        self.stdout.write("Creating users...")
        admin, brokers, buyers = self._create_users()

        rng = random.Random(42)  # deterministic

        self.stdout.write("Creating houses (~100)...")
        houses = self._create_houses(brokers, rng)

        self.stdout.write("Creating lands (~100)...")
        lands = self._create_lands(brokers, rng)

        self.stdout.write("Creating cars (~100)...")
        cars = self._create_cars(brokers, rng)

        self.stdout.write("Creating machines (~100)...")
        machines = self._create_machines(brokers, rng)

        self.stdout.write("Creating submissions...")
        self._create_submissions(buyers, brokers, rng)

        self.stdout.write("Creating deals for closed listings...")
        self._create_deals(brokers)

        total = len(houses) + len(lands) + len(cars) + len(machines)
        self.stdout.write(self.style.SUCCESS(f"\nDone! Created {total} listings.\n"))
        self.stdout.write("─" * 55)
        self.stdout.write("  ADMIN    admin@ethiolistings.com / Admin1234!")
        self.stdout.write("  BROKERS  dawit / meron / beki / tigist / habtamu @broker.com / Broker1234!")
        self.stdout.write("  BUYERS   sara / abel / helen / solomon / john @buyer.com / Buyer1234!")
        self.stdout.write("─" * 55)

    @transaction.atomic
    def _clear(self):
        users = User.objects.filter(email__in=SEED_EMAILS)
        Listing.objects.filter(user__in=users).delete()
        ListingRequest.objects.filter(owner__in=users).delete()
        users.delete()
        Agency.objects.filter(name__in=["EthioRealty Agency", "Addis Property Hub"]).delete()

    def _create_users(self):
        agency1 = Agency.objects.create(
            name="EthioRealty Agency", phone="+251911000001", address="Bole Road, Addis Ababa"
        )
        agency2 = Agency.objects.create(
            name="Addis Property Hub", phone="+251922000002", address="Meskel Square, Addis Ababa"
        )

        admin = User.objects.create_superuser(
            email="admin@ethiolistings.com", password="Admin1234!",
            first_name="Yohanis", last_name="Admin",
        )

        brokers = []
        for i, (first, last, phone, tg, wa, agency) in enumerate([
            ("Dawit", "Bekele", "+251911223344", "dawit_broker", "+251911223344", agency1),
            ("Meron", "Haile", "+251922334455", "meron_realty", "+251922334455", agency1),
            ("Beki", "Tadesse", "+251933445566", "beki_homes", "+251933445566", agency2),
            ("Tigist", "Alemu", "+251944556677", "tigist_property", "+251944556677", agency2),
            ("Habtamu", "Girma", "+251955667788", "habtamu_listings", "+251955667788", agency1),
        ]):
            email = f"{first.lower()}@broker.com"
            u = User.objects.create_user(
                email=email, password="Broker1234!",
                first_name=first, last_name=last, phone=phone, role=UserRole.BROKER,
            )
            BrokerProfile.objects.create(
                user=u, agency=agency, bio=f"Senior broker — {first} {last}",
                telegram_username=tg, whatsapp_phone=wa,
            )
            brokers.append(u)

        buyers = []
        for first, last, phone in [
            ("Sara", "Girma", "+251911000101"),
            ("Abel", "Worku", "+251922000102"),
            ("Helen", "Teklu", "+251933000103"),
            ("Solomon", "Mekonnen", "+251944000104"),
            ("John", "Yohannes", "+251955000105"),
        ]:
            u = User.objects.create_user(
                email=f"{first.lower()}@buyer.com", password="Buyer1234!",
                first_name=first, last_name=last, phone=phone, role=UserRole.BUYER,
            )
            buyers.append(u)

        return admin, brokers, buyers

    def _pick_status(self, rng, ltype):
        """Pick a realistic status distribution."""
        weights = {
            ListingStatus.ACTIVE: 60,
            ListingStatus.INACTIVE: 10,
            ListingStatus.SOLD: 12 if ltype == ListingType.SALE else 3,
            ListingStatus.RENTED: 3 if ltype == ListingType.SALE else 12,
            ListingStatus.EXPIRED: 8,
        }
        statuses = list(weights.keys())
        w = [weights[s] for s in statuses]
        return rng.choices(statuses, weights=w, k=1)[0]

    def _create_houses(self, brokers, rng):
        results = []
        n = 100
        brokers_cycle = itertools.cycle(brokers)
        locs_cycle = itertools.cycle(LOCATIONS)
        imgs_cycle = itertools.cycle(range(len(HOUSE_IMGS)))
        specs_cycle = itertools.cycle(HOUSE_SPECS)

        for i in range(n):
            user = next(brokers_cycle)
            loc = next(locs_cycle)
            img_idx = next(imgs_cycle)
            spec = next(specs_cycle)
            house_type, beds, baths, area, furnished, parking, base_price, base_unit = spec

            ltype = ListingType.RENT if base_unit else ListingType.SALE
            price = base_price
            price_unit = base_unit
            if ltype == ListingType.SALE and rng.random() < 0.2:
                ltype = ListingType.RENT
                price = rng.choice([8_000, 12_000, 18_000, 25_000, 35_000, 45_000])
                price_unit = rng.choice(["per_month", "per_year"])
            elif ltype == ListingType.RENT and rng.random() < 0.1:
                ltype = ListingType.SALE
                price = rng.choice([3_000_000, 5_000_000, 8_000_000, 12_000_000])
                price_unit = None

            status = self._pick_status(rng, ltype)
            region, zone, woreda, lat, lng = loc

            bed_str = str(beds) if beds else "Studio"
            ltype_am = "ሽያጭ" if ltype == ListingType.SALE else "ኪራይ"
            title_tmpl = rng.choice(HOUSE_TITLES)
            title = (title_tmpl[0]
                     .replace("{bed}", bed_str)
                     .replace("{zone}", zone)
                     .replace("{ltype}", "Sale" if ltype == ListingType.SALE else "Rent"))
            title_am = (title_tmpl[1]
                        .replace("{bed}", bed_str)
                        .replace("{zone}", zone)
                        .replace("{ltype_am}", ltype_am))

            listing = Listing.objects.create(
                user=user, category=ListingCategory.HOUSE,
                listing_type=ltype, title=title, title_am=title_am,
                price=price, price_unit=price_unit,
                price_negotiable=rng.random() < 0.4,
                is_verified=rng.random() < 0.5,
                is_featured=rng.random() < 0.15,
                status=status,
            )
            Location.objects.create(
                listing=listing, region=region, zone=zone, woreda=woreda,
                lat=lat + rng.uniform(-0.01, 0.01),
                lng=lng + rng.uniform(-0.01, 0.01),
            )
            HouseDetails.objects.create(
                listing=listing, house_type=house_type,
                bedrooms=beds, bathrooms=baths, area_sqm=area,
                furnished=furnished, parking=parking,
            )
            n_imgs = rng.randint(1, 3)
            urls = [HOUSE_IMGS[(img_idx + j) % len(HOUSE_IMGS)] for j in range(n_imgs)]
            _add_images(listing, urls)
            results.append(listing)

        return results

    def _create_lands(self, brokers, rng):
        results = []
        n = 100
        brokers_cycle = itertools.cycle(brokers)
        locs_cycle = itertools.cycle(LOCATIONS[5:])  # bias toward non-Addis
        specs_cycle = itertools.cycle(LAND_SPECS)

        for i in range(n):
            user = next(brokers_cycle)
            loc = next(locs_cycle)
            spec = next(specs_cycle)
            total_area, area_unit, land_use, has_deed, road_access, base_price = spec

            ltype = ListingType.SALE
            price = int(base_price * rng.uniform(0.8, 1.3))

            status = self._pick_status(rng, ltype)
            region, zone, woreda, lat, lng = loc

            area_str = f"{int(total_area) if total_area >= 1 else total_area}"
            unit_str = "m²" if area_unit == AreaUnit.SQM else "ha"
            title_tmpl = rng.choice(LAND_TITLES)
            title = (title_tmpl[0]
                     .replace("{area}", area_str)
                     .replace("{unit}", unit_str)
                     .replace("{zone}", zone))
            title_am = (title_tmpl[1]
                        .replace("{area}", area_str)
                        .replace("{unit}", unit_str)
                        .replace("{zone}", zone))

            listing = Listing.objects.create(
                user=user, category=ListingCategory.LAND,
                listing_type=ltype, title=title, title_am=title_am,
                price=price, price_unit=None,
                price_negotiable=rng.random() < 0.5,
                is_verified=rng.random() < 0.4,
                is_featured=rng.random() < 0.1,
                status=status,
            )
            Location.objects.create(
                listing=listing, region=region, zone=zone, woreda=woreda,
                lat=lat + rng.uniform(-0.02, 0.02),
                lng=lng + rng.uniform(-0.02, 0.02),
            )
            LandDetails.objects.create(
                listing=listing, total_area=total_area, area_unit=area_unit,
                land_use=land_use,
                has_title_deed=rng.random() < 0.7 if not has_deed else True,
                road_access=rng.random() < 0.7 if not road_access else True,
            )
            _add_images(listing, _imgs(LAND_IMGS, rng.randint(1, 2)))
            results.append(listing)

        return results

    def _create_cars(self, brokers, rng):
        results = []
        n = 100
        brokers_cycle = itertools.cycle(brokers)
        locs_cycle = itertools.cycle(LOCATIONS[:15])  # Addis Ababa biased
        specs_cycle = itertools.cycle(CAR_SPECS)

        for i in range(n):
            user = next(brokers_cycle)
            loc = next(locs_cycle)
            spec = next(specs_cycle)
            make, model, year, mileage, trans, fuel, cond, color, base_price, base_unit = spec

            ltype = ListingType.RENT if base_unit else ListingType.SALE
            price = int(base_price * rng.uniform(0.85, 1.2)) if not base_unit else base_price
            price_unit = base_unit

            status = self._pick_status(rng, ltype)
            region, zone, woreda, lat, lng = loc

            title_en = f"{make} {model} {year}"
            title_am = f"{make} {model} {year}"
            if ltype == ListingType.SALE:
                title_en += " — For Sale"
                title_am += " — ለሽያጭ"
            else:
                title_en += " — For Rent"
                title_am += " — ለኪራይ"

            listing = Listing.objects.create(
                user=user, category=ListingCategory.CAR,
                listing_type=ltype, title=title_en, title_am=title_am,
                price=price, price_unit=price_unit,
                price_negotiable=rng.random() < 0.45,
                is_verified=rng.random() < 0.45,
                is_featured=rng.random() < 0.12,
                status=status,
            )
            Location.objects.create(
                listing=listing, region=region, zone=zone, woreda=woreda,
                lat=lat + rng.uniform(-0.005, 0.005),
                lng=lng + rng.uniform(-0.005, 0.005),
            )
            CarDetails.objects.create(
                listing=listing, make=make, model=model, year=year,
                mileage_km=mileage + rng.randint(-5_000, 15_000),
                transmission=trans, fuel_type=fuel, condition=cond, color=color,
            )
            _add_images(listing, _imgs(CAR_IMGS, rng.randint(1, 3)))
            results.append(listing)

        return results

    def _create_machines(self, brokers, rng):
        results = []
        n = 100
        brokers_cycle = itertools.cycle(brokers)
        locs_cycle = itertools.cycle(LOCATIONS)
        specs_cycle = itertools.cycle(MACHINE_SPECS)

        for i in range(n):
            user = next(brokers_cycle)
            loc = next(locs_cycle)
            spec = next(specs_cycle)
            mtype, manufacturer, model, year, cond, hours, base_price, base_unit = spec

            ltype = ListingType.RENT if base_unit else ListingType.SALE
            price = int(base_price * rng.uniform(0.8, 1.25)) if not base_unit else base_price
            price_unit = base_unit

            status = self._pick_status(rng, ltype)
            region, zone, woreda, lat, lng = loc

            title_en = f"{manufacturer} {mtype} {model} — {year}"
            title_am = f"{manufacturer} {mtype} {year}"
            if ltype == ListingType.SALE:
                title_am += " — ለሽያጭ"
            else:
                title_am += " — ለኪራይ"

            listing = Listing.objects.create(
                user=user, category=ListingCategory.MACHINE,
                listing_type=ltype, title=title_en, title_am=title_am,
                price=price, price_unit=price_unit,
                price_negotiable=rng.random() < 0.35,
                is_verified=rng.random() < 0.4,
                is_featured=rng.random() < 0.1,
                status=status,
            )
            Location.objects.create(
                listing=listing, region=region, zone=zone, woreda=woreda,
                lat=lat + rng.uniform(-0.05, 0.05),
                lng=lng + rng.uniform(-0.05, 0.05),
            )
            MachineDetails.objects.create(
                listing=listing, machine_type=mtype, manufacturer=manufacturer,
                year=year, condition=cond,
                operating_hours=max(0, hours + rng.randint(-200, 500)),
            )
            _add_images(listing, _imgs(MACHINE_IMGS, rng.randint(1, 2)))
            results.append(listing)

        return results

    def _create_submissions(self, buyers, brokers, rng):
        dawit = brokers[0]
        beki = brokers[2]

        statuses = [
            SubmissionStatus.PENDING,
            SubmissionStatus.PENDING,
            SubmissionStatus.CONTACTED,
            SubmissionStatus.CONTACTED,
            SubmissionStatus.APPROVED,
            SubmissionStatus.REJECTED,
        ]
        categories = ["HOUSE", "HOUSE", "LAND", "CAR", "MACHINE", "HOUSE"]
        ltypes = ["SALE", "RENT", "SALE", "SALE", "SALE", "RENT"]
        assignees = [dawit, None, dawit, beki, dawit, None]

        for idx, (buyer, status, cat, lt, assigned) in enumerate(
            zip(itertools.cycle(buyers), statuses, categories, ltypes, assignees)
        ):
            loc = LOCATIONS[idx % len(LOCATIONS)]
            ListingRequest.objects.create(
                owner=buyer, assigned_to=assigned,
                category=cat, listing_type=lt,
                details={"note": f"Submission {idx+1}"},
                photos=[],
                region=loc[0], zone=loc[1], woreda=loc[2],
                owner_phone=buyer.phone or "+251900000000",
                status=status,
                broker_notes="Contacted by phone." if status == SubmissionStatus.CONTACTED else None,
            )

    def _create_deals(self, brokers):
        closed_statuses = [ListingStatus.SOLD, ListingStatus.RENTED]
        for status in closed_statuses:
            for listing in Listing.objects.filter(status=status, user__in=brokers)[:15]:
                if not hasattr(listing, "deal"):
                    try:
                        commission_rate = 3 if status == ListingStatus.SOLD else 5
                        actual = float(listing.price or 0)
                        Deal.objects.create(
                            listing=listing,
                            closed_by=listing.user,
                            actual_price=actual if actual > 0 else None,
                            commission_rate=commission_rate if actual > 0 else None,
                            commission_amount=(actual * commission_rate / 100) if actual > 0 else None,
                            notes="Seeded deal.",
                        )
                    except Exception:
                        pass
