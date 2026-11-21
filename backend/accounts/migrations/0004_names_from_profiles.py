from django.db import migrations


def fill_names(apps, schema_editor):
    # Users registered on the site had their name only on Profile; copy it where the User row is empty.
    Profile = apps.get_model("accounts", "Profile")
    for p in Profile.objects.select_related("user"):
        u = p.user
        parts = (p.full_name or "").split()
        if u.first_name or u.last_name or len(parts) < 2:
            continue
        u.last_name, u.first_name = parts[0][:150], " ".join(parts[1:])[:150]
        u.save(update_fields=["first_name", "last_name"])


class Migration(migrations.Migration):
    dependencies = [("accounts", "0003_remove_ministry")]

    operations = [migrations.RunPython(fill_names, migrations.RunPython.noop)]
