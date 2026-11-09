import json
from datetime import date

from django.db import transaction
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .models import Event, GameSession, Guess


def serialize_event(event):
    return {
        "eventId": event.id,
        "name": event.event_name,
        "year": str(event.event_year),
        "state": event.state.state_name,
        "era": event.era.era_name,
        "scale": event.scale.scale_name,
        "tag": event.tags.values_list("tag_name", flat=True).first() or "",
        "image": event.image_url,
    }


def get_events():
    return Event.objects.select_related("state", "era", "scale").prefetch_related("tags")


@require_http_methods(["GET"])
def events(request):
    return JsonResponse({"events": [serialize_event(event) for event in get_events()]})


@csrf_exempt
@require_http_methods(["POST"])
def sessions(request):
    catalog = list(get_events())
    if not catalog:
        return JsonResponse({"error": "The event catalog is empty."}, status=503)
    target = catalog[int(date.today().strftime("%Y%m%d")) % len(catalog)]
    session = GameSession.objects.create(played_on=date.today(), target_event=target)
    return JsonResponse({"sessionId": session.id, "target": serialize_event(target)}, status=201)


@csrf_exempt
@require_http_methods(["POST"])
def guesses(request, session_id):
    try:
        payload = json.loads(request.body or "{}")
        guessed_event_id = int(payload["guessedEventId"])
        session = GameSession.objects.select_related("target_event").get(pk=session_id)
        guessed_event = get_events().get(pk=guessed_event_id)
    except (
        KeyError,
        TypeError,
        ValueError,
        GameSession.DoesNotExist,
        Event.DoesNotExist,
        json.JSONDecodeError,
    ):
        return JsonResponse({"error": "A valid session and guessedEventId are required."}, status=400)

    if session.guesses_used >= 15:
        return JsonResponse({"error": "This game has already used all 15 guesses."}, status=400)
    if session.guesses.filter(guessed_event=guessed_event).exists():
        return JsonResponse({"error": "Event has already been guessed."}, status=400)

    target = session.target_event
    with transaction.atomic():
        attempt_number = session.guesses_used + 1
        is_correct = guessed_event.id == target.id
        guess = Guess.objects.create(
            session=session,
            attempt_number=attempt_number,
            guessed_event=guessed_event,
            year_status=_year_status(guessed_event.event_year, target.event_year),
            state_status=_value_status(guessed_event.state_id, target.state_id),
            era_status=_value_status(guessed_event.era_id, target.era_id),
            scale_status=_value_status(guessed_event.scale_id, target.scale_id),
            tag_status=_value_status(
                guessed_event.tags.values_list("id", flat=True).first(),
                target.tags.values_list("id", flat=True).first(),
            ),
        )
        session.guesses_used = attempt_number
        session.solved = is_correct
        session.save(update_fields=["guesses_used", "solved"])

    return JsonResponse(
        {
            "guessId": guess.id,
            "attemptNumber": guess.attempt_number,
            "event": serialize_event(guessed_event),
            "statuses": {
                "year": guess.year_status,
                "state": guess.state_status,
                "era": guess.era_status,
                "scale": guess.scale_status,
                "tag": guess.tag_status,
            },
            "solved": session.solved,
        },
        status=201,
    )


def _year_status(guess_year, target_year):
    if guess_year == target_year:
        return "correct"
    return "close" if abs(guess_year - target_year) <= 10 else "incorrect"


def _value_status(guess_value, target_value):
    return "correct" if guess_value == target_value else "incorrect"
