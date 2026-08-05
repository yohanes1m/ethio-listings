from django.urls import path

from . import views

urlpatterns = [
    path("public/", views.PublicListingListView.as_view(), name="listing-public"),
    path("featured/", views.FeaturedListingView.as_view(), name="listing-featured"),
    path("map/", views.ListingMapView.as_view(), name="listing-map"),
    path("mine/", views.MyListingsView.as_view(), name="listing-mine"),
    path("admin/", views.AdminListingsView.as_view(), name="listing-admin"),
    path("create/", views.CreateListingView.as_view(), name="listing-create"),
    path("dashboard/", views.ListingDashboardView.as_view(), name="listing-dashboard"),
    path("stats/", views.StatsView.as_view(), name="listing-stats"),
    path("<uuid:pk>/", views.ListingDetailView.as_view(), name="listing-detail"),
    path("<uuid:pk>/update/", views.UpdateListingView.as_view(), name="listing-update"),
    path("<uuid:pk>/verify/", views.VerifyListingView.as_view(), name="listing-verify"),
    path("<uuid:pk>/feature/", views.FeatureListingView.as_view(), name="listing-feature"),
    path("<uuid:pk>/close/", views.CloseListingView.as_view(), name="listing-close"),
]
