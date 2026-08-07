from celery import shared_task


@shared_task(bind=True, max_retries=3, default_retry_delay=30)
def notify_telegram_new_listing(self, listing_id: str) -> None:
    from apps.listings.models import Listing
    from apps.common.services.telegram import post_listing

    try:
        listing = (
            Listing.objects
            .select_related("location")
            .prefetch_related("media")
            .get(pk=listing_id)
        )
        post_listing(listing)
    except Listing.DoesNotExist:
        return
    except Exception as exc:
        raise self.retry(exc=exc)
