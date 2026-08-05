from django.urls import path
from . import views

urlpatterns = [
    path("generate-listing/", views.GenerateListingView.as_view(), name="ai-generate"),
]
