from datetime import date

from django.core.management import call_command
from django.db import IntegrityError
from django.db import transaction
from django.test import TestCase

from .models import Event, EventTag, GameSession, Guess


class CatalogTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        call_command("seed_game", verbosity=0)

    def test_seed_contains_prototype_events_and_relationships(self):
        gold_rush = Event.objects.get(event_name="California Gold Rush")

        self.assertEqual(Event.objects.count(), 60)
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
