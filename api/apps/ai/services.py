import json

from django.conf import settings
from openai import OpenAI


class AIUnavailableError(Exception):
    pass


def generate_listing(basic_fields: dict) -> dict:
    if not settings.OPENAI_API_KEY:
        raise AIUnavailableError("AI generation unavailable — fill fields manually.")

    client = OpenAI(api_key=settings.OPENAI_API_KEY)

    prompt = (
        "You are a professional Ethiopian real estate listing writer. "
        "Generate a listing in JSON with these fields: "
        "title_en, title_am, title_om, description_en, description_am, description_om. "
        "Make Amharic (title_am, description_am) the primary language. "
        "Keep titles under 80 characters. Descriptions 2-4 sentences. "
        f"Property details: {basic_fields}"
    )

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
    )

    return json.loads(response.choices[0].message.content)
