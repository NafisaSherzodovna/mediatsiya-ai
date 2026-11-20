from django.core.management.base import BaseCommand

from demo.seed import seed


class Command(BaseCommand):
    help = "Seed demo mediators and cases (idempotent; --wipe rebuilds everything)."

    def add_arguments(self, parser):
        parser.add_argument("--wipe", action="store_true", help="delete cases and mediators first")

    def handle(self, *args, wipe=False, **opts):
        n = seed(wipe=wipe)
        self.stdout.write(self.style.SUCCESS(f"demo data ready: {n} cases"))
