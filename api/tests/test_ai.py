import json
from unittest.mock import MagicMock, patch

import pytest

from .conftest import auth_client
from .factories import BrokerFactory, UserFactory

pytestmark = pytest.mark.django_db

AI_RESPONSE = {
    "title_en": "Modern 3-Bedroom Apartment for Sale in Bole",
    "title_am": "ዘመናዊ 3 መኝታ ቤት ለሽያጭ ቦሌ",
    "title_om": "Mana Ciisaa 3 Ol Gurgurtaaf Bole",
    "description_en": "A spacious modern apartment located in the heart of Bole, Addis Ababa. Features 3 bedrooms, 2 bathrooms, and a fully furnished living area.",
    "description_am": "ቦሌ፣ አዲስ አበባ ውስጥ የሚገኝ ሰፊ ዘመናዊ አፓርትመንት። 3 መኝታ ቤቶች፣ 2 መታጠቢያ ቤቶች እና ሙሉ በሙሉ የተዘጋጀ የመኖሪያ ክፍል አለው።",
    "description_om": "Apartimantii bal'aa ammayyaa kan giddu-gala Bole, Finfinnee keessa argamu. Kutaa ciisaa 3, daandii dhiqannaa 2, fi kutaa jireenyaa guutummaatti qophaa'e qaba.",
}


def _mock_openai_client():
    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_response.choices[0].message.content = json.dumps(AI_RESPONSE)
    mock_client.chat.completions.create.return_value = mock_response
    return mock_client


class TestGenerateListing:
    def test_returns_six_multilingual_fields(self, db, settings):
        settings.OPENAI_API_KEY = "test-key"
        broker = BrokerFactory()
        client = auth_client(broker)
        with patch("apps.ai.services.OpenAI", return_value=_mock_openai_client()):
            r = client.post("/api/ai/generate-listing/", {
                "category": "HOUSE",
                "listing_type": "SALE",
                "bedrooms": 3,
                "area_sqm": 120,
                "region": "Addis Ababa",
                "woreda": "Bole",
            }, format="json")
        assert r.status_code == 200
        for field in [
            "title_en", "title_am", "title_om",
            "description_en", "description_am", "description_om",
        ]:
            assert field in r.data

    def test_amharic_fields_are_populated(self, db, settings):
        settings.OPENAI_API_KEY = "test-key"
        broker = BrokerFactory()
        client = auth_client(broker)
        with patch("apps.ai.services.OpenAI", return_value=_mock_openai_client()):
            r = client.post("/api/ai/generate-listing/", {
                "category": "HOUSE",
                "bedrooms": 3,
            }, format="json")
        assert r.status_code == 200
        assert r.data["title_am"] == AI_RESPONSE["title_am"]
        assert r.data["description_am"] == AI_RESPONSE["description_am"]

    def test_works_for_land_category(self, db, settings):
        settings.OPENAI_API_KEY = "test-key"
        broker = BrokerFactory()
        client = auth_client(broker)
        with patch("apps.ai.services.OpenAI", return_value=_mock_openai_client()):
            r = client.post("/api/ai/generate-listing/", {
                "category": "LAND",
                "listing_type": "SALE",
                "total_area": 500,
                "region": "Oromia",
            }, format="json")
        assert r.status_code == 200
        assert "title_am" in r.data

    def test_works_for_car_category(self, db, settings):
        settings.OPENAI_API_KEY = "test-key"
        broker = BrokerFactory()
        client = auth_client(broker)
        with patch("apps.ai.services.OpenAI", return_value=_mock_openai_client()):
            r = client.post("/api/ai/generate-listing/", {
                "category": "CAR",
                "make": "Toyota",
                "model": "Land Cruiser",
                "year": 2020,
            }, format="json")
        assert r.status_code == 200
        assert "title_en" in r.data

    def test_works_for_machine_category(self, db, settings):
        settings.OPENAI_API_KEY = "test-key"
        broker = BrokerFactory()
        client = auth_client(broker)
        with patch("apps.ai.services.OpenAI", return_value=_mock_openai_client()):
            r = client.post("/api/ai/generate-listing/", {
                "category": "MACHINE",
                "machine_type": "Tractor",
                "manufacturer": "John Deere",
            }, format="json")
        assert r.status_code == 200
        assert "description_om" in r.data

    def test_buyer_can_also_generate(self, db, settings):
        settings.OPENAI_API_KEY = "test-key"
        buyer = UserFactory()
        client = auth_client(buyer)
        with patch("apps.ai.services.OpenAI", return_value=_mock_openai_client()):
            r = client.post("/api/ai/generate-listing/", {
                "category": "HOUSE",
            }, format="json")
        assert r.status_code == 200

    def test_unauthenticated_returns_401(self, api_client):
        r = api_client.post("/api/ai/generate-listing/", {
            "category": "HOUSE",
        }, format="json")
        assert r.status_code == 401

    def test_openai_called_with_json_format(self, db, settings):
        settings.OPENAI_API_KEY = "test-key"
        broker = BrokerFactory()
        client = auth_client(broker)
        mock_openai = _mock_openai_client()
        with patch("apps.ai.services.OpenAI", return_value=mock_openai):
            client.post("/api/ai/generate-listing/", {
                "category": "HOUSE",
                "bedrooms": 3,
            }, format="json")
        call_kwargs = mock_openai.chat.completions.create.call_args[1]
        assert call_kwargs["response_format"] == {"type": "json_object"}
        assert call_kwargs["model"] == "gpt-4o-mini"


class TestAIUnavailable:
    def test_missing_key_returns_503(self, db, settings):
        settings.OPENAI_API_KEY = ""
        broker = BrokerFactory()
        client = auth_client(broker)
        r = client.post("/api/ai/generate-listing/", {
            "category": "HOUSE",
        }, format="json")
        assert r.status_code == 503

    def test_503_response_has_detail_message(self, db, settings):
        settings.OPENAI_API_KEY = ""
        broker = BrokerFactory()
        client = auth_client(broker)
        r = client.post("/api/ai/generate-listing/", {
            "category": "HOUSE",
        }, format="json")
        assert "detail" in r.data
        assert r.data["detail"] != ""

    def test_unauthenticated_still_gets_401_not_503(self, api_client, settings):
        settings.OPENAI_API_KEY = ""
        r = api_client.post("/api/ai/generate-listing/", {
            "category": "HOUSE",
        }, format="json")
        assert r.status_code == 401
