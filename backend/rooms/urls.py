from django.urls import path

from . import views

urlpatterns = [
    path("<uuid:case_id>/", views.room),
    path("<uuid:case_id>/messages/", views.messages),
    path("<uuid:case_id>/meetings/", views.meetings),
    path("<uuid:case_id>/approve/", views.approve),
    path("<uuid:case_id>/terminate/", views.terminate_view),
    path("<uuid:case_id>/refuse/", views.refuse_view),
    path("<uuid:case_id>/extend/", views.extend_view),
    path("meetings/<uuid:meeting_id>/", views.meeting_action),
    path("t/<str:token>/", views.t_room),
    path("t/<str:token>/messages/", views.t_messages),
    path("t/<str:token>/meetings/<uuid:meeting_id>/", views.t_meeting_answer),
    path("t/<str:token>/approve/", views.t_approve),
    path("t/<str:token>/pay/", views.t_pay),
    path("t/<str:token>/mediator/", views.t_mediator),
    path("t/<str:token>/drop-mediator/", views.t_drop_mediator),
    path("t/<str:token>/terminate/", views.t_terminate),
    path("t/<str:token>/extend/", views.t_extend),
]
