from django.db import migrations, models
import django.db.models.deletion


def copy_primary_tags(apps, schema_editor):
    Event = apps.get_model("game", "Event")
    EventTag = apps.get_model("game", "EventTag")

    for event in Event.objects.all():
        event_tag = EventTag.objects.filter(event_id=event.id).order_by("id").first()
        if event_tag is not None:
            Event.objects.filter(id=event.id).update(tag_id=event_tag.tag_id)


class Migration(migrations.Migration):

    dependencies = [
        ("game", "0002_remove_gamesession_session_guesses_at_most_15_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="event",
            name="tag",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="events",
                to="game.tag",
            ),
        ),
        migrations.RunPython(copy_primary_tags, migrations.RunPython.noop),
        migrations.RemoveField(
            model_name="event",
            name="tags",
        ),
        migrations.DeleteModel(
            name="EventTag",
        ),
        migrations.AlterField(
            model_name="event",
            name="tag",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.PROTECT,
                related_name="events",
                to="game.tag",
            ),
        ),
    ]
