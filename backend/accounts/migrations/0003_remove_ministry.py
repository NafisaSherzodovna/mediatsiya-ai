from django.db import migrations, models


def drop_ministry(apps, schema_editor):
    # The ministry role is gone; its demo account goes with it.
    User = apps.get_model("auth", "User")
    User.objects.filter(profile__role="ministry").delete()


class Migration(migrations.Migration):
    dependencies = [("accounts", "0002_demo_users")]

    operations = [
        migrations.RunPython(drop_ministry, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="profile",
            name="role",
            field=models.CharField(
                choices=[("claimant", "Murojaatchi"), ("mediator", "Mediator"), ("admin", "Administrator")],
                default="claimant",
                max_length=16,
                verbose_name="Rol",
            ),
        ),
    ]
