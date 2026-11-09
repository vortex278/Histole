from django.urls import path

from game import views

urlpatterns = [
    path("api/events", views.events),
    path("api/sessions", views.sessions),
    path("api/sessions/<int:session_id>/guesses", views.guesses),
]
