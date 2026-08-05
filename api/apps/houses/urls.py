from django.urls import path

from . import views

urlpatterns = [
    path("", views.HouseListCreateView.as_view(), name="house-list"),
    path("<uuid:pk>/", views.HouseDetailView.as_view(), name="house-detail"),
]
