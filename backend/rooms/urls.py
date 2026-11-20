from django.urls import path

from . import views

urlpatterns = [
    path("<uuid:case_id>/", views.room),
    path("<uuid:case_id>/messages/", views.messages),
    path("<uuid:case_id>/meetings/", views.meetings),
    path("<uuid:case_id>/approve/", views.approve),
    path("meetings/<uuid:meeting_id>/", views.meeting_action),
    path("t/<str:token>/", views.t_room),
    path("t/<str:token>/messages/", views.t_messages),
    path("t/<str:token>/meetings/<uuid:meeting_id>/", views.t_meeting_answer),
    path("t/<str:token>/approve/", views.t_approve),
]
