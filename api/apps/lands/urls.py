from django.urls import path
from . import views

urlpatterns = [
    path("", views.LandListCreateView.as_view(), name="land-list"),
    path("<uuid:pk>/", views.LandDetailView.as_view(), name="land-detail"),
]
