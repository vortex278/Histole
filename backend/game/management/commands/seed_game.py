from datetime import date

from django.core.management.base import BaseCommand

from game.loc_events import LOC_EVENTS, REMOVED_LOC_EVENT_NAMES
from game.kansas_events import KANSAS_EVENTS
from game.models import Era, Event, EventTag, Scale, State, Tag
from game.wikipedia_events import WIKIPEDIA_EVENTS
from game.tragedy_events import TRAGEDY_EVENT_NAMES


class Command(BaseCommand):
    help = "Seed the normalized Histole catalog with prototype events."

    def handle(self, *args, **options):
        states = {
            name: State.objects.update_or_create(
                state_name=name,
                defaults={"abbreviation": abbreviation},
            )[0]
            for name, abbreviation in {
                "Alabama": "AL",
                "Alaska": "AK",
                "Arizona": "AZ",
                "Arkansas": "AR",
                "California": "CA",
                "Colorado": "CO",
                "Connecticut": "CT",
                "Delaware": "DE",
                "Florida": "FL",
                "Georgia": "GA",
                "Hawaii": "HI",
                "Idaho": "ID",
                "Illinois": "IL",
                "Indiana": "IN",
                "Iowa": "IA",
                "Kansas": "KS",
                "Kentucky": "KY",
                "Louisiana": "LA",
                "Maine": "ME",
                "Maryland": "MD",
                "Massachusetts": "MA",
                "Michigan": "MI",
                "Minnesota": "MN",
                "Mississippi": "MS",
                "Missouri": "MO",
                "Montana": "MT",
                "Nebraska": "NE",
                "Nevada": "NV",
                "New Hampshire": "NH",
                "New Jersey": "NJ",
                "New Mexico": "NM",
                "New York": "NY",
                "North Carolina": "NC",
                "North Dakota": "ND",
                "Ohio": "OH",
                "Oklahoma": "OK",
                "Oregon": "OR",
                "Pennsylvania": "PA",
                "Rhode Island": "RI",
                "South Carolina": "SC",
                "South Dakota": "SD",
                "Tennessee": "TN",
                "Texas": "TX",
                "Utah": "UT",
                "Vermont": "VT",
                "Virginia": "VA",
                "Washington": "WA",
                "West Virginia": "WV",
                "Wisconsin": "WI",
                "Wyoming": "WY",
            }.items()
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
        Event.objects.filter(event_name__in=REMOVED_LOC_EVENT_NAMES).delete()
        events.extend(LOC_EVENTS)
        events.extend(WIKIPEDIA_EVENTS)
        events.extend(KANSAS_EVENTS)
        valid_state_names = set(states)
        for name, year, state, era, scale, tag in events:
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
                },
            )[0]
            event.tags.set([tags["Tragedy"] if name in TRAGEDY_EVENT_NAMES else tags[tag]])

        self.stdout.write(
            self.style.SUCCESS(
                f"Seeded {Event.objects.count()} events and "
                f"{EventTag.objects.count()} event-tag associations."
            )
        )
