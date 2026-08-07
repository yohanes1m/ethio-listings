import logging

import httpx
from django.conf import settings

logger = logging.getLogger(__name__)

_API = "https://api.telegram.org/bot{token}/{method}"

CATEGORY_EMOJI = {
    "HOUSE": "🏠",
    "LAND": "🌿",
    "CAR": "🚗",
    "MACHINE": "⚙️",
}


def post_listing(listing) -> None:
    token = getattr(settings, "TELEGRAM_BOT_TOKEN", "")
    channel = getattr(settings, "TELEGRAM_CHANNEL_ID", "")
    if not token or not channel:
        return

    emoji = CATEGORY_EMOJI.get(listing.category, "📋")
    listing_type = "For Rent" if listing.listing_type == "RENT" else "For Sale"
    location = getattr(listing, "location", None)
    loc_str = ""
    if location:
        parts = [p for p in (location.region, location.zone, location.woreda) if p]
        loc_str = ", ".join(parts)

    price_str = ""
    if listing.price:
        price_str = f"{listing.price:,.0f} ETB"
        if listing.price_unit:
            price_str += f"/{listing.price_unit}"

    frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:3000")
    url = f"{frontend_url}/listings/{listing.id}"

    caption = (
        f"{emoji} *{listing.title}*\n"
        f"_{listing_type}_\n"
    )
    if loc_str:
        caption += f"📍 {loc_str}\n"
    if price_str:
        caption += f"💰 {price_str}\n"
    caption += f"\n[View listing]({url})"

    main_media = listing.media.filter(is_main=True).first()
    photo_url = main_media.url if main_media else None

    try:
        if photo_url:
            _send(token, "sendPhoto", {
                "chat_id": channel,
                "photo": photo_url,
                "caption": caption,
                "parse_mode": "Markdown",
            })
        else:
            _send(token, "sendMessage", {
                "chat_id": channel,
                "text": caption,
                "parse_mode": "Markdown",
                "disable_web_page_preview": False,
            })
    except Exception:
        logger.exception("Failed to post listing %s to Telegram", listing.id)


def _send(token: str, method: str, payload: dict) -> None:
    url = _API.format(token=token, method=method)
    resp = httpx.post(url, json=payload, timeout=10)
    if resp.status_code != 200:
        logger.warning("Telegram %s returned %s: %s", method, resp.status_code, resp.text)
