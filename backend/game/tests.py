from datetime import date

from django.core.management import call_command
from django.db import IntegrityError
from django.db import transaction
from django.test import Client
from django.test import TestCase

from .models import Event, EventTag, GameSession, Guess


class CatalogTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        call_command("seed_game", verbosity=0)

    def test_seed_contains_prototype_events_and_relationships(self):
        gold_rush = Event.objects.get(event_name="California Gold Rush")

        self.assertGreaterEqual(Event.objects.count(), 135)
        self.assertEqual(
            list(gold_rush.tags.values_list("tag_name", flat=True)),
            ["Migration"],
        )
        self.assertEqual(gold_rush.state.state_name, "California")

    def test_event_tag_pair_is_unique(self):
        gold_rush = Event.objects.get(event_name="California Gold Rush")
        migration = gold_rush.tags.get(tag_name="Migration")

        with self.assertRaises(IntegrityError):
            EventTag.objects.create(event=gold_rush, tag=migration)

    def test_tragedy_tag_categorizes_tragic_events(self):
        self.assertEqual(
            Event.objects.get(event_name="Oklahoma City Bombing")
            .tags.get()
            .tag_name,
            "Tragedy",
        )
        self.assertEqual(
            Event.objects.get(event_name="California Gold Rush")
            .tags.get()
            .tag_name,
            "Migration",
        )

    def test_events_api_returns_normalized_catalog(self):
        response = Client().get("/api/events", headers={"Origin": "http://localhost:8081"})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.headers["Access-Control-Allow-Origin"],
            "http://localhost:8081",
        )
        self.assertGreaterEqual(len(response.json()["events"]), 135)
        self.assertFalse(
            any(event["name"].endswith(" was Born") for event in response.json()["events"])
        )
        self.assertIn(
            "California Gold Rush",
            [event["name"] for event in response.json()["events"]],
        )
        self.assertIn(
            "Seneca Falls Convention",
            [event["name"] for event in response.json()["events"]],
        )
        self.assertIn(
            "Watergate Break-in",
            [event["name"] for event in response.json()["events"]],
        )
        self.assertIn(
            "Kansas Statehood",
            [event["name"] for event in response.json()["events"]],
        )

    def test_api_allows_browser_preflight(self):
        response = Client().options(
            "/api/sessions",
            headers={
                "Origin": "http://localhost:8081",
                "Access-Control-Request-Method": "POST",
            },
        )

        self.assertEqual(response.status_code, 204)
        self.assertEqual(response.headers["Access-Control-Allow-Methods"], "GET, POST, OPTIONS")

    def test_api_allows_expo_dynamic_localhost_port(self):
        response = Client().get(
            "/api/events",
            headers={"Origin": "http://localhost:8082"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.headers["Access-Control-Allow-Origin"],
            "http://localhost:8082",
        )

    def test_session_and_guess_api_persists_validated_gameplay(self):
        client = Client()
        session_response = client.post("/api/sessions", data={}, content_type="application/json")
        session_id = session_response.json()["sessionId"]
        target_id = session_response.json()["target"]["eventId"]
        guess = Event.objects.exclude(pk=target_id).first()

        response = client.post(
            f"/api/sessions/{session_id}/guesses",
            data={"guessedEventId": guess.id},
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["attemptNumber"], 1)
        self.assertEqual(GameSession.objects.get(pk=session_id).guesses_used, 1)

    def test_guess_api_rejects_duplicate_guesses(self):
        client = Client()
        session_response = client.post("/api/sessions", data={}, content_type="application/json")
        session_id = session_response.json()["sessionId"]
        guess_id = Event.objects.first().id
        payload = {"guessedEventId": guess_id}

        client.post(
            f"/api/sessions/{session_id}/guesses",
            data=payload,
            content_type="application/json",
        )
        response = client.post(
            f"/api/sessions/{session_id}/guesses",
            data=payload,
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("already been guessed", response.json()["error"])


class SessionTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        call_command("seed_game", verbosity=0)

    def test_session_and_guess_store_gameplay_data(self):
        target = Event.objects.get(event_name="Moon Landing")
        guess = Event.objects.get(event_name="California Gold Rush")
        session = GameSession.objects.create(
            played_on=date(2026, 10, 19),
            target_event=target,
        )

        Guess.objects.create(
            session=session,
            attempt_number=1,
            guessed_event=guess,
            year_status="incorrect",
            state_status="incorrect",
            era_status="incorrect",
            scale_status="correct",
            tag_status="incorrect",
        )

        self.assertEqual(session.guesses.count(), 1)
        self.assertEqual(session.guesses.get().guessed_event, guess)

    def test_attempt_number_is_unique_per_session(self):
        target = Event.objects.get(event_name="Moon Landing")
        session = GameSession.objects.create(
            played_on=date(2026, 10, 19),
            target_event=target,
        )
        values = {
            "session": session,
            "attempt_number": 1,
            "guessed_event": target,
            "year_status": "correct",
            "state_status": "correct",
            "era_status": "correct",
            "scale_status": "correct",
            "tag_status": "correct",
        }
        Guess.objects.create(**values)

        with self.assertRaises(IntegrityError):
            Guess.objects.create(**values)

    def test_attempt_number_must_be_between_one_and_fifteen(self):
        target = Event.objects.get(event_name="Moon Landing")
        session = GameSession.objects.create(
            played_on=date(2026, 10, 19),
            target_event=target,
        )
        values = {
            "session": session,
            "guessed_event": target,
            "year_status": "correct",
            "state_status": "correct",
            "era_status": "correct",
            "scale_status": "correct",
            "tag_status": "correct",
        }

        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Guess.objects.create(attempt_number=0, **values)

        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Guess.objects.create(attempt_number=16, **values)

    def test_feedback_statuses_must_be_valid(self):
        target = Event.objects.get(event_name="Moon Landing")
        session = GameSession.objects.create(
            played_on=date(2026, 10, 19),
            target_event=target,
        )
        values = {
            "session": session,
            "attempt_number": 1,
            "guessed_event": target,
            "year_status": "invalid",
            "state_status": "correct",
            "era_status": "correct",
            "scale_status": "correct",
            "tag_status": "correct",
        }

        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Guess.objects.create(**values)

    def test_session_guess_count_must_not_exceed_fifteen(self):
        target = Event.objects.get(event_name="Moon Landing")

        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                GameSession.objects.create(
                    played_on=date(2026, 10, 19),
                    target_event=target,
                    guesses_used=16,
                )
