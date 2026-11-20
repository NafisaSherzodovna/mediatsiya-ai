from django.urls import path

from . import views

urlpatterns = [path("reset/", views.reset)]
