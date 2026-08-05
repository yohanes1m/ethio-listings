from django.urls import path
from . import views

urlpatterns = [
    path("", views.CarListCreateView.as_view(), name="car-list"),
    path("<uuid:pk>/", views.CarDetailView.as_view(), name="car-detail"),
]
