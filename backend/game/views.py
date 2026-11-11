import json
from datetime import date

from django.db import transaction
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .models import Era, Event, GameSession, Guess, Scale


STATE_BORDERS = {
    "Alabama": {"Florida", "Georgia", "Mississippi", "Tennessee"},
    "Arkansas": {"Louisiana", "Mississippi", "Missouri", "Oklahoma", "Tennessee", "Texas"},
    "California": {"Arizona", "Nevada", "Oregon"},
    "Colorado": {"Arizona", "Kansas", "Nebraska", "New Mexico", "Oklahoma", "Utah", "Wyoming"},
    "Connecticut": {"Massachusetts", "New York", "Rhode Island"},
    "Delaware": {"Maryland", "New Jersey", "Pennsylvania"},
    "Florida": {"Alabama", "Georgia"},
    "Georgia": {"Alabama", "Florida", "North Carolina", "South Carolina", "Tennessee"},
    "Illinois": {"Iowa", "Indiana", "Kentucky", "Missouri", "Wisconsin"},
    "Indiana": {"Illinois", "Kentucky", "Michigan", "Ohio"},
    "Iowa": {"Illinois", "Minnesota", "Missouri", "Nebraska", "South Dakota", "Wisconsin"},
    "Kansas": {"Colorado", "Missouri", "Nebraska", "Oklahoma"},
    "Kentucky": {"Illinois", "Indiana", "Missouri", "Ohio", "Tennessee", "Virginia", "West Virginia"},
    "Louisiana": {"Arkansas", "Mississippi", "Texas"},
    "Maine": {"New Hampshire"},
    "Maryland": {"Delaware", "Pennsylvania", "Virginia", "West Virginia"},
    "Massachusetts": {"Connecticut", "New Hampshire", "New York", "Rhode Island", "Vermont"},
    "Michigan": {"Indiana", "Ohio", "Wisconsin"},
    "Minnesota": {"Iowa", "Michigan", "North Dakota", "South Dakota", "Wisconsin"},
    "Mississippi": {"Alabama", "Arkansas", "Louisiana", "Tennessee"},
    "Missouri": {"Arkansas", "Illinois", "Iowa", "Kansas", "Kentucky", "Nebraska", "Oklahoma", "Tennessee"},
    "Montana": {"Idaho", "North Dakota", "South Dakota", "Wyoming"},
    "Nebraska": {"Colorado", "Iowa", "Kansas", "Missouri", "South Dakota", "Wyoming"},
    "Nevada": {"Arizona", "California", "Idaho", "Oregon", "Utah"},
    "New Hampshire": {"Maine", "Massachusetts", "Vermont"},
    "New Jersey": {"Delaware", "New York", "Pennsylvania"},
    "New Mexico": {"Arizona", "Colorado", "Oklahoma", "Texas", "Utah"},
    "New York": {"Connecticut", "Massachusetts", "New Jersey", "Pennsylvania", "Vermont"},
    "North Carolina": {"Georgia", "South Carolina", "Tennessee", "Virginia"},
    "North Dakota": {"Minnesota", "Montana", "South Dakota"},
    "Ohio": {"Indiana", "Kentucky", "Michigan", "Pennsylvania", "West Virginia"},
    "Oklahoma": {"Arkansas", "Colorado", "Kansas", "Missouri", "New Mexico", "Texas"},
    "Oregon": {"California", "Idaho", "Nevada", "Washington"},
    "Pennsylvania": {"Delaware", "Maryland", "New Jersey", "New York", "Ohio", "West Virginia"},
    "Rhode Island": {"Connecticut", "Massachusetts"},
    "South Carolina": {"Georgia", "North Carolina"},
    "South Dakota": {"Iowa", "Minnesota", "Montana", "Nebraska", "North Dakota", "Wyoming"},
    "Tennessee": {"Alabama", "Arkansas", "Georgia", "Kentucky", "Mississippi", "Missouri", "North Carolina", "Virginia"},
    "Texas": {"Arkansas", "Louisiana", "New Mexico", "Oklahoma"},
    "Utah": {"Arizona", "Colorado", "Idaho", "Nevada", "New Mexico", "Wyoming"},
    "Vermont": {"Massachusetts", "New Hampshire", "New York"},
    "Virginia": {"Kentucky", "Maryland", "North Carolina", "Tennessee", "West Virginia"},
    "Washington": {"Idaho", "Oregon"},
    "West Virginia": {"Kentucky", "Maryland", "Ohio", "Pennsylvania", "Virginia"},
    "Wisconsin": {"Iowa", "Illinois", "Michigan", "Minnesota"},
    "Wyoming": {"Colorado", "Idaho", "Montana", "Nebraska", "South Dakota", "Utah"},
}


def serialize_event(event):
    return {
        "eventId": event.id,
        "name": event.event_name,
        "year": str(event.event_year),
        "state": event.state.state_name,
        "era": event.era.era_name,
        "eraStartYear": event.era.start_year,
        "eraEndYear": event.era.end_year,
        "scale": event.scale.scale_name,
        "scaleOrder": event.scale.display_order,
        "tag": event.tag.tag_name,
        "image": event.image_url,
        "description": event.description,
    }


def get_events():
    return (
        Event.objects.exclude(event_name__endswith=" was Born")
        .select_related("state", "era", "scale", "tag")
    )


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
            state_status=_state_status(guessed_event.state.state_name, target.state.state_name),
            era_status=_ordered_status(
                guessed_event.era_id,
                target.era_id,
                list(Era.objects.order_by("start_year").values_list("id", flat=True)),
            ),
            scale_status=_ordered_status(
                guessed_event.scale_id,
                target.scale_id,
                list(Scale.objects.order_by("display_order").values_list("id", flat=True)),
            ),
            tag_status=_exact_status(
                guessed_event.tag_id,
                target.tag_id,
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


def _state_status(guess_state, target_state):
    if guess_state == target_state:
        return "correct"
    return "close" if guess_state in STATE_BORDERS.get(target_state, set()) else "incorrect"


def _ordered_status(guess_value, target_value, ordered_values):
    if guess_value == target_value:
        return "correct"

    try:
        distance = abs(ordered_values.index(guess_value) - ordered_values.index(target_value))
    except ValueError:
        return "incorrect"

    return "close" if distance == 1 else "incorrect"


def _exact_status(guess_value, target_value):
    return "correct" if guess_value == target_value else "incorrect"
