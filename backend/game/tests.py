from datetime import date
import json
from pathlib import Path

from django.core.management import call_command
from django.db import IntegrityError
from django.db import transaction
from django.test import Client
from django.test import TestCase

from .models import Event, GameSession, Guess


class CatalogTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        call_command("seed_game", verbosity=0)

    def test_seed_contains_prototype_events_and_tag_assignments(self):
        gold_rush = Event.objects.get(event_name="California Gold Rush")

        self.assertGreaterEqual(Event.objects.count(), 135)
        self.assertEqual(
            gold_rush.tag.tag_name,
            "Migration",
        )
        self.assertEqual(gold_rush.state.state_name, "California")

    def test_event_has_one_tag(self):
        gold_rush = Event.objects.get(event_name="California Gold Rush")
        self.assertEqual(gold_rush.tag.tag_name, "Migration")

    def test_sports_events_use_us_states_and_sports_tag(self):
        sports = Event.objects.filter(tag__tag_name="Sports")

        self.assertEqual(sports.count(), 26)
        self.assertEqual(
            Event.objects.get(event_name="Miracle on Ice").state.state_name,
            "New York",
        )
        self.assertEqual(
            Event.objects.get(event_name="2024 NBA Finals").tag.tag_name,
            "Sports",
        )

    def test_tragedy_tag_categorizes_tragic_events(self):
        self.assertEqual(
            Event.objects.get(event_name="Oklahoma City Bombing").tag.tag_name,
            "Tragedy",
        )
        self.assertEqual(
            Event.objects.get(event_name="California Gold Rush").tag.tag_name,
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
        self.assertTrue(
            Event.objects.get(event_name="Pennsylvania Colony Established").description
        )
        self.assertIn("description", response.json()["events"][0])
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
        event = next(
            event
            for event in response.json()["events"]
            if event["name"] == "California Gold Rush"
        )
        self.assertEqual(event["eraStartYear"], 1815)
        self.assertEqual(event["eraEndYear"], 1860)
        self.assertEqual(event["scaleOrder"], 5)

    def test_image_manifest_entries_have_required_review_metadata(self):
        manifest_path = Path(__file__).resolve().parent / "event_images.json"
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))["events"]

        for image_data in manifest:
            self.assertIn(image_data.get("status"), {"mapped", "unmapped"})
            if image_data.get("status") == "mapped":
                self.assertTrue(image_data.get("imageUrl"))
                self.assertTrue(image_data.get("sourcePageUrl"))
                self.assertTrue(image_data.get("license"))
                self.assertTrue(image_data.get("credit"))

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

    def test_free_session_uses_a_different_target_when_excluded(self):
        client = Client()
        daily_response = client.post(
            "/api/sessions",
            data={"mode": "daily"},
            content_type="application/json",
        )
        daily_target_id = daily_response.json()["target"]["eventId"]

        free_response = client.post(
            "/api/sessions",
            data={"mode": "free", "excludeEventId": daily_target_id},
            content_type="application/json",
        )

        self.assertEqual(free_response.status_code, 201)
        self.assertEqual(free_response.json()["mode"], "free")
        self.assertNotEqual(free_response.json()["target"]["eventId"], daily_target_id)

    def test_guess_api_persists_close_statuses(self):
        client = Client()
        target = Event.objects.get(event_name="Declaration of Independence")
        guess = Event.objects.get(event_name="Battle of Trenton")
        session = GameSession.objects.create(
            played_on=date(2026, 11, 11),
            target_event=target,
        )

        response = client.post(
            f"/api/sessions/{session.id}/guesses",
            data={"guessedEventId": guess.id},
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(
            response.json()["statuses"],
            {
                "year": "correct",
                "state": "close",
                "era": "correct",
                "scale": "correct",
                "tag": "incorrect",
            },
        )
        self.assertEqual(session.guesses.get().state_status, "close")

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
