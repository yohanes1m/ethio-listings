from django.urls import path
from . import views

urlpatterns = [
    path("", views.SubmissionListCreateView.as_view(), name="submission-list"),
    path("mine/", views.MySubmissionsView.as_view(), name="submission-mine"),
    path("<uuid:pk>/", views.SubmissionDetailView.as_view(), name="submission-detail"),
    path("<uuid:pk>/approve/", views.SubmissionApproveView.as_view(), name="submission-approve"),
]
