from django.urls import path

from . import views

urlpatterns = [
    path("classify/", views.classify),
    path("compare/", views.compare),
    path("invite/", views.invite),
    path("position/", views.position),
    path("brief/", views.brief),
    path("agreement/", views.agreement),
    path("ask/", views.ask),
    path("transcribe/", views.transcribe),
]
