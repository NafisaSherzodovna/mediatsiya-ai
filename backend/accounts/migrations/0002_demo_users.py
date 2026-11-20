from django.contrib.auth.hashers import make_password
from django.db import migrations

# Public demo accounts from contract/api.md (passwords are public on purpose).
DEMO_USERS = [
    ("ariza", "ariza123", "claimant", "Aziz Karimov", "+998901234567"),
    ("mediator", "mediator123", "mediator", "Dilnoza Rahimova", "+998901112233"),
    ("vazirlik", "vazirlik123", "ministry", "Adliya vazirligi", ""),
    ("admin", "admin123", "admin", "Administrator", ""),
]


def create_demo_users(apps, schema_editor):
    User = apps.get_model("auth", "User")
    Profile = apps.get_model("accounts", "Profile")
    for username, password, role, full_name, phone in DEMO_USERS:
        is_admin = role == "admin"
        user, _ = User.objects.update_or_create(
            username=username,
            defaults={"password": make_password(password), "is_staff": is_admin, "is_superuser": is_admin},
        )
        Profile.objects.update_or_create(user=user, defaults={"role": role, "full_name": full_name, "phone": phone})


class Migration(migrations.Migration):
    dependencies = [("accounts", "0001_initial"), ("auth", "0012_alter_user_first_name_max_length")]

    operations = [migrations.RunPython(create_demo_users, migrations.RunPython.noop)]
