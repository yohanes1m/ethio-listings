from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/auth/", include("apps.users.urls")),
    path("api/listings/", include("apps.listings.urls")),
    path("api/houses/", include("apps.houses.urls")),
    path("api/lands/", include("apps.lands.urls")),
    path("api/cars/", include("apps.cars.urls")),
    path("api/machines/", include("apps.machines.urls")),
    path("api/media/", include("apps.media.urls")),
    path("api/favorites/", include("apps.favorites.urls")),
    path("api/submissions/", include("apps.submissions.urls")),
    path("api/deals/", include("apps.deals.urls")),
    path("api/ai/", include("apps.ai.urls")),
    path("api/locations/", include("apps.common.urls")),
]
