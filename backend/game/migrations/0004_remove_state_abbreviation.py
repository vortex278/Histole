from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("game", "0003_make_event_tag_single"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="state",
            name="abbreviation",
        ),
    ]
