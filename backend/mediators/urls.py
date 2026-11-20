from django.urls import path

from . import views

urlpatterns = [path("mediators/", views.mediator_list)]
