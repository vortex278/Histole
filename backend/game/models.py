from django.db import models


class State(models.Model):
    state_name = models.CharField(max_length=50, unique=True)
    abbreviation = models.CharField(max_length=2, unique=True)

    class Meta:
        ordering = ["state_name"]

    def __str__(self):
        return self.state_name


class Era(models.Model):
    era_name = models.CharField(max_length=100, unique=True)
    start_year = models.IntegerField()
    end_year = models.IntegerField()

    class Meta:
        ordering = ["start_year"]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(start_year__lte=models.F("end_year")),
                name="era_start_before_end",
            )
        ]

    def __str__(self):
        return self.era_name


class Scale(models.Model):
    scale_name = models.CharField(max_length=30, unique=True)
    display_order = models.PositiveIntegerField(unique=True)

    class Meta:
        ordering = ["display_order"]

    def __str__(self):
        return self.scale_name


class Tag(models.Model):
    tag_name = models.CharField(max_length=50, unique=True)

    class Meta:
        ordering = ["tag_name"]

    def __str__(self):
        return self.tag_name


class Event(models.Model):
    event_name = models.CharField(max_length=100, unique=True)
    event_year = models.IntegerField()
    state = models.ForeignKey(State, on_delete=models.PROTECT, related_name="events")
    era = models.ForeignKey(Era, on_delete=models.PROTECT, related_name="events")
    scale = models.ForeignKey(Scale, on_delete=models.PROTECT, related_name="events")
    tags = models.ManyToManyField(Tag, through="EventTag", related_name="events")
    description = models.TextField(default="")
    image_url = models.URLField(blank=True)

    class Meta:
        ordering = ["event_name"]

    def __str__(self):
        return self.event_name


class EventTag(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE)
    tag = models.ForeignKey(Tag, on_delete=models.PROTECT)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["event", "tag"],
                name="unique_event_tag",
            )
        ]


class GameSession(models.Model):
    played_on = models.DateField()
    target_event = models.ForeignKey(
        Event,
        on_delete=models.PROTECT,
        related_name="target_sessions",
    )
    guesses_used = models.PositiveSmallIntegerField(default=0)
    solved = models.BooleanField(default=False)

    class Meta:
        constraints = [
            models.CheckConstraint(
                condition=models.Q(guesses_used__lte=15),
                name="session_guesses_at_most_15",
            )
        ]


class Guess(models.Model):
    STATUS_CHOICES = [
        ("correct", "Correct"),
        ("close", "Close"),
        ("incorrect", "Incorrect"),
    ]

    session = models.ForeignKey(
        GameSession,
        on_delete=models.CASCADE,
        related_name="guesses",
    )
    attempt_number = models.PositiveSmallIntegerField()
    guessed_event = models.ForeignKey(
        Event,
        on_delete=models.PROTECT,
        related_name="guesses",
    )
    year_status = models.CharField(max_length=9, choices=STATUS_CHOICES)
    state_status = models.CharField(max_length=9, choices=STATUS_CHOICES)
    era_status = models.CharField(max_length=9, choices=STATUS_CHOICES)
    scale_status = models.CharField(max_length=9, choices=STATUS_CHOICES)
    tag_status = models.CharField(max_length=9, choices=STATUS_CHOICES)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["session", "attempt_number"],
                name="unique_session_attempt",
            ),
            models.CheckConstraint(
                condition=models.Q(attempt_number__gte=1)
                & models.Q(attempt_number__lte=15),
                name="guess_attempt_between_1_and_15",
            ),
        ]
        ordering = ["session", "attempt_number"]
