from datetime import date
import json
from pathlib import Path

from django.core.management.base import BaseCommand

from game.loc_events import LOC_EVENTS, REMOVED_LOC_EVENT_NAMES
from game.kansas_events import KANSAS_EVENTS
from game.models import Era, Event, Scale, State, Tag
from game.sports_events import SPORTS_EVENTS
from game.wikipedia_events import WIKIPEDIA_EVENTS
from game.tragedy_events import TRAGEDY_EVENT_NAMES


class Command(BaseCommand):
    help = "Seed the normalized Histole catalog with prototype events."

    def handle(self, *args, **options):
        image_manifest_path = Path(__file__).resolve().parents[2] / "event_images.json"
        with image_manifest_path.open(encoding="utf-8") as image_manifest_file:
            image_manifest_data = json.load(image_manifest_file)
        image_manifest = {
            entry["eventName"]: entry
            for entry in image_manifest_data.get("events", [])
        }

        states = {
            name: State.objects.get_or_create(state_name=name)[0]
            for name in [
                "Alabama", "Alaska", "Arizona", "Arkansas", "California",
                "Colorado", "Connecticut", "Delaware", "Florida", "Georgia",
                "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas",
                "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts",
                "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana",
                "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico",
                "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma",
                "Oregon", "Pennsylvania", "Rhode Island", "South Carolina",
                "South Dakota", "Tennessee", "Texas", "Utah", "Vermont",
                "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming",
            ]
        }
        eras = {
            name: Era.objects.update_or_create(
                era_name=name,
                defaults={"start_year": start, "end_year": end},
            )[0]
            for name, start, end in [
                ("Colonial Era", 1607, 1763),
                ("American Revolution", 1765, 1783),
                ("New Nation", 1783, 1815),
                ("National Expansion", 1815, 1860),
                ("Civil War", 1861, 1877),
                ("Rise of Industrial America", 1878, 1900),
                ("Progressive Era", 1901, 1928),
                ("WWII and Great Depression", 1929, 1945),
                ("Modern Era", 1945, 2100),
            ]
        }
        scales = {
            name: Scale.objects.update_or_create(
                scale_name=name,
                defaults={"display_order": order},
            )[0]
            for name, order in [
                ("Local", 1),
                ("State", 2),
                ("Regional", 3),
                ("National", 4),
                ("International", 5),
            ]
        }
        tags = {
            name: Tag.objects.get_or_create(tag_name=name)[0]
            for name in [
                "Expansion",
                "Migration",
                "Military",
                "Politics",
                "Science",
                "Sports",
                "Tragedy",
            ]
        }
        events = [
            (
                "California Gold Rush",
                1849,
                "California",
                "National Expansion",
                "International",
                "Migration",
            ),
            (
                "Declaration of Independence",
                1776,
                "Pennsylvania",
                "American Revolution",
                "International",
                "Politics",
            ),
            (
                "Battle of Gettysburg",
                1863,
                "Pennsylvania",
                "Civil War",
                "National",
                "Military",
            ),
            ("Moon Landing", 1969, "Florida", "Modern Era", "International", "Science"),
            (
                "Louisiana Purchase",
                1803,
                "Louisiana",
                "New Nation",
                "International",
                "Expansion",
            ),
            (
                "Jamestown Established",
                1607,
                "Virginia",
                "Colonial Era",
                "National",
                "Expansion",
            ),
            (
                "Colony of Georga Established",
                1732,
                "Georgia",
                "Colonial Era",
                "National",
                "Expansion",
            ),
            (
                "Sugar Act Established",
                1764,
                "Massachusetts",
                "American Revolution",
                "National",
                "Politics",
            ),
            (
                "Stamp Act Established",
                1765,
                "Massachusetts",
                "American Revolution",
                "National",
                "Politics",
            ),
            (
                "Boston Tea Party",
                1773,
                "Massachusetts",
                "American Revolution",
                "National",
                "Politics",
            ),
            (
                "Battle of Bunker Hill",
                1775,
                "Massachusetts",
                "American Revolution",
                "National",
                "Military",
            ),
            (
                "Battle of Saratoga",
                1777,
                "New York",
                "American Revolution",
                "National",
                "Military",
            ),
            (
                "Battle of Yorktown",
                1781,
                "Virginia",
                "American Revolution",
                "National",
                "Military",
            ),
            (
                "Boston Massacre",
                1770,
                "Massachusetts",
                "American Revolution",
                "National",
                "Military",
            ),
            (
                "First Shots of American Revolution",
                1775,
                "Massachusetts",
                "American Revolution",
                "National",
                "Military",
            ),
        ]
        Event.objects.filter(
            event_name__in=REMOVED_LOC_EVENT_NAMES,
        ).delete()
        Event.objects.filter(
            event_name__endswith=" was Born",
            target_sessions__isnull=True,
            guesses__isnull=True,
        ).delete()
        events.extend(LOC_EVENTS)
        events.extend(WIKIPEDIA_EVENTS)
        events.extend(KANSAS_EVENTS)
        events.extend(SPORTS_EVENTS)
        valid_state_names = set(states)
        for event_data in events:
            name, year, state, era, scale, tag = event_data[:6]
            description = event_data[6] if len(event_data) > 6 else ""
            image_data = image_manifest.get(name, {})
            if state not in valid_state_names:
                self.stderr.write(
                    self.style.WARNING(
                        f"Skipping {name}: {state} is not in the state catalog."
                    )
                )
                continue
            event = Event.objects.update_or_create(
                event_name=name,
                defaults={
                    "event_year": year,
                    "state": states[state],
                    "era": eras[era],
                    "scale": scales[scale],
                    "tag": tags["Tragedy"] if name in TRAGEDY_EVENT_NAMES else tags[tag],
                    "description": description,
                },
            )[0]
            if image_data.get("status") == "mapped":
                event.image_url = image_data["imageUrl"]
                event.save(update_fields=["image_url"])

        self.stdout.write(
            self.style.SUCCESS(
                f"Seeded {Event.objects.count()} events and "
                f"{Event.objects.count()} event-tag assignments."
            )
        )
