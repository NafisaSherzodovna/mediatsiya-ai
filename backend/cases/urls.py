from django.urls import path

from . import views

urlpatterns = [
    path("cases/", views.case_list),
    path("cases/<uuid:pk>/", views.case_detail),
    path("cases/<uuid:pk>/book/", views.case_book),
    path("invite/<str:token>/", views.invite_detail),
    path("invite/<str:token>/respond/", views.invite_respond),
]
