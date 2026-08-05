from django.urls import path
from . import views

urlpatterns = [
    path("", views.FavoriteListView.as_view(), name="favorite-list"),
    path("<uuid:listing_id>/", views.FavoriteDetailView.as_view(), name="favorite-detail"),
]
