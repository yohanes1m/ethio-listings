from django.urls import path
from . import views

urlpatterns = [
    path("upload/", views.SubmissionUploadView.as_view(), name="media-upload"),
    path("listings/<uuid:listing_id>/media/", views.ListingMediaView.as_view(), name="media-list"),
    path("listings/<uuid:listing_id>/media/<int:pk>/", views.ListingMediaDetailView.as_view(), name="media-detail"),
]
