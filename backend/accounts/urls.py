from django.urls import re_path

from . import views

# The web client calls both "login" and "login/".
urlpatterns = [
    re_path(r"^login/?$", views.login),
    re_path(r"^register/?$", views.register),
    re_path(r"^me/?$", views.me),
]
