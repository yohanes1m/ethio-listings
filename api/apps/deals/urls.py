from django.urls import path
from . import views

urlpatterns = [
    path("", views.DealListView.as_view(), name="deal-list"),
    path("summary/", views.DealSummaryView.as_view(), name="deal-summary"),
    path("listings/<uuid:listing_id>/close/", views.CloseDealView.as_view(), name="deal-close"),
]
