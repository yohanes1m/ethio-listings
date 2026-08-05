from django.urls import path
from . import views

urlpatterns = [
    path("regions/", views.RegionListView.as_view(), name="location-regions"),
    path("zones/", views.ZoneListView.as_view(), name="location-zones"),
    path("woredas/", views.WoredasListView.as_view(), name="location-woredas"),
]
