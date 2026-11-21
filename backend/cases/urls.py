from django.urls import path

from . import views

urlpatterns = [
    path("cases/", views.case_list),
    path("cases/<uuid:pk>/", views.case_detail),
    path("cases/<uuid:pk>/book/", views.case_book),
    path("cases/<uuid:pk>/review/", views.case_review),
    path("cases/<uuid:pk>/pay/", views.case_pay),
    path("cases/<uuid:pk>/drop-mediator/", views.case_drop_mediator),
    path("my-invites/", views.my_invites),
    path("invite/<str:token>/", views.invite_detail),
    path("invite/<str:token>/respond/", views.invite_respond),
]
