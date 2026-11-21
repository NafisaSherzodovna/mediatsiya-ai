"""Deterministic demo data: 42 mediators, 276 background cases (Jan–Nov 2026) and 2 showcase cases for `ariza`.

Totals and distributions match contract/fixtures/stats.json: 278 cases, 171 agreed (61.5 %), by type, region and month.
"""

from __future__ import annotations

import json
import random
from datetime import date, datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password
from django.db import transaction

from accounts.models import Profile
from cases.models import Case, CaseEvent, Region
from cases.procedure import terms
from rooms.logic import agreement_hash
from rooms.models import Approval
from mediators.models import Mediator

TZ = ZoneInfo("Asia/Tashkent")
FIXTURES = Path(__file__).resolve().parents[2] / "contract" / "fixtures"

TYPES = [("qarz", 96, 62), ("ijara", 58, 39), ("oilaviy", 41, 22), ("istemolchi", 37, 24), ("mehnat", 24, 13), ("qoshnichilik", 15, 8), ("boshqa", 7, 3)]
REGIONS = [
    ("toshkent-sh", 64), ("toshkent-v", 31), ("andijon", 22), ("fargona", 25), ("namangan", 19), ("samarqand", 28), ("buxoro", 17),
    ("navoiy", 9), ("qashqadaryo", 14), ("surxondaryo", 12), ("jizzax", 8), ("sirdaryo", 6), ("xorazm", 13), ("qoraqalpogiston", 10),
]
MONTHS = [(1, 8), (2, 11), (3, 14), (4, 17), (5, 20), (6, 22), (7, 25), (8, 28), (9, 31), (10, 34), (11, 68)]
FIRST = ["Aziza", "Bobur", "Gulnora", "Dilshod", "Elyor", "Feruza", "Hasan", "Iroda", "Jahongir", "Kamola", "Laziz", "Madina",
         "Nodir", "Oydin", "Rustam", "Sevara", "Temur", "Umida", "Xurshid", "Yulduz", "Zafar", "Shahnoza", "Otabek", "Nilufar",
         "Sardor", "Muxlisa", "Akmal", "Barno", "Davron", "Lola", "Jasur", "Maftuna", "Anvar", "Gavhar", "Sherzod", "Komila"]
LAST = ["Karimov", "Toshmatova", "Rasulov", "Ergasheva", "Nazarov", "Yoqubova", "Sobirov", "Ismoilova", "Qodirov", "Abdullayeva",
        "Mirzayev", "Hamidova", "Usmonov", "Raximova", "Saidov", "Xolmatova", "Jurayev", "Olimova"]
SAMPLES = {
    "qarz": "Tanishimga qarz bergan pulim qaytarilmayapti.",
    "ijara": "Ijara haqi bir necha oydan beri toʻlanmayapti.",
    "oilaviy": "Ajrashgandan keyin aliment va farzand bilan koʻrishish masalasi.",
    "istemolchi": "Sotib olingan mahsulot buzildi, doʻkon almashtirmayapti.",
    "mehnat": "Ish beruvchi oxirgi ikki oylik ish haqini bermayapti.",
    "qoshnichilik": "Qoʻshni bilan devor va suv oqishi boʻyicha kelishmovchilik.",
    "boshqa": "Shartnoma shartlari boʻyicha kelishmovchilik.",
}
LABEL = {"qarz": "Qarz", "ijara": "Ijara", "oilaviy": "Oilaviy", "istemolchi": "Isteʼmolchi huquqi", "mehnat": "Mehnat", "qoshnichilik": "Qoʻshnichilik", "boshqa": "Boshqa"}
EV = {
    "created": "Murojaat yaratildi", "invited": "Ikkinchi tomonga taklif yuborildi", "accepted": "Ikkinchi tomon rozi boʻldi",
    "declined": "Ikkinchi tomon rad etdi", "scheduled": "Mediator bilan sessiya belgilandi", "agreed": "Kelishuvga erishildi",
}


def fx(name: str):
    return json.loads((FIXTURES / name).read_text(encoding="utf-8"))


def comparison_for(amount: int | None) -> dict:
    duty = max(round((amount or 0) * 0.04), 440_000)
    return {
        "court": {"days_min": 30, "days_max": 90, "cost_uzs": duty + 1_000_000,
                  "items": [{"label": "Davlat boji (taxminiy)", "uzs": duty}, {"label": "Advokat xizmati (taxminiy)", "uzs": 1_000_000}]},
        "mediation": {"days_min": 3, "days_max": 14, "cost_uzs": 600_000, "items": [{"label": "Mediator haqi (2 sessiya, taxminiy)", "uzs": 600_000}]},
        "notes": [], "sources": [], "source": "ai",
    }


def make_mediators(rng: random.Random) -> list[Mediator]:
    User = get_user_model()
    med_user = User.objects.filter(username="mediator").first()
    out = []
    for i, m in enumerate(fx("mediators.json")):
        out.append(Mediator(id=m["id"], user=med_user if m["id"] == "m-01" else None, name=m["name"], photo="", registry_no=m["registry_no"],
                            registry_date=date.fromisoformat(m["registry_date"]), areas=m["areas"], address=m["address"],
                            phone=m["phone"], email=m["email"], certificate_no=m["certificate_no"],
                            certificate_date=date.fromisoformat(m["certificate_date"]),
                            languages=m["languages"], region=m["region"], price_uzs=m["price_uzs"],
                            rating=m["rating"], sessions=m["sessions"], resolved=m["resolved"], reviews=m["reviews"], years=m["years"],
                            bio=m["bio"], is_demo=True))
    types = [t for t, *_ in TYPES]
    regions = [r for r, _ in REGIONS]
    for n in range(7, 43):
        first, last = FIRST[(n * 7) % len(FIRST)], LAST[(n * 5) % len(LAST)]
        if first.endswith("a") and not last.endswith("a"):
            last += "a"
        if not first.endswith("a") and last.endswith("a"):
            last = last[:-1]
        picked = rng.sample(types, k=rng.choice([2, 3]))  # same rng calls as before: keeps the seeded distributions
        region = rng.choice(regions)
        reg_day = date(2019 + n % 6, n % 12 + 1, n % 27 + 1)
        out.append(Mediator(id=f"m-{n:02d}", name=f"{first} {last}", photo="", registry_no=f"MR-{1040 + n * 7}",
                            registry_date=reg_day, areas=sorted({t if t in ("mehnat", "oilaviy") else "fuqarolik" for t in picked}),
                            languages=["uz", "ru"] if n % 4 else (["uz", "tr"] if n % 8 else ["uz"]),
                            address=f"{Region(region).label}, demo manzil", phone=f"+99890{1000000 + n * 1111:07d}",
                            email=f"m-{n:02d}@mediatsiya.demo", certificate_no=f"M {n * 37:06d}",
                            certificate_date=reg_day - timedelta(days=30),
                            region=region, price_uzs=rng.choice([250_000, 300_000, 350_000, 400_000, 450_000]),
                            rating=round(rng.uniform(4.2, 4.8), 1), sessions=rng.randint(12, 140), years=rng.randint(2, 8),
                            bio="Professional mediator. Demo profil.", is_demo=True))
    for m in out:
        if not m.resolved:
            m.resolved = round(m.sessions * 0.62)
            m.reviews = round(m.resolved * 0.7)
    # Demo logins for every other mediator: m02 … m42 / mediator123 (public on purpose, like the other demo accounts).
    # One hash for all: 41 separate PBKDF2 hashes would make a demo reset take ~10 s.
    demo_hash = make_password("mediator123")
    for m in out:
        if m.user is None:
            u, _ = User.objects.update_or_create(username=m.id.replace("-", ""), defaults={"password": demo_hash})
            Profile.objects.update_or_create(user=u, defaults={"role": "mediator", "full_name": m.name, "phone": m.phone})
            m.user = u
    Mediator.objects.bulk_create(out)
    return out


def at(month: int, rng: random.Random) -> datetime:
    last_day = 20 if month == 11 else 28
    return datetime(2026, month, rng.randint(1, last_day), rng.randint(9, 18), rng.choice([0, 15, 30, 45]), tzinfo=TZ)


@transaction.atomic
def seed(wipe: bool = False) -> int:
    rng = random.Random(42)
    if wipe:
        CaseEvent.objects.all().delete()
        Case.objects.all().delete()
        Mediator.objects.filter(is_demo=True).delete()  # keep self-registered mediators
    if Case.objects.exists():
        return Case.objects.count()
    User = get_user_model()
    mediators = make_mediators(rng)
    pool, _ = User.objects.get_or_create(username="demo-fuqarolar")
    pool.set_unusable_password()
    pool.save()
    Profile.objects.get_or_create(user=pool, defaults={"role": "claimant", "full_name": "Demo fuqarolar"})
    ariza = User.objects.get(username="ariza")

    # Background: 276 cases. Showcase takes one qarz (agreed) and one ijara (scheduled), both in Toshkent, November.
    kinds: list[tuple[str, bool]] = []
    for t, total, agreed in TYPES:
        total -= {"qarz": 1, "ijara": 1}.get(t, 0)
        agreed -= {"qarz": 1}.get(t, 0)
        kinds += [(t, True)] * agreed + [(t, False)] * (total - agreed)
    regions = [r for r, c in REGIONS for _ in range(c - (2 if r == "toshkent-sh" else 0))]
    months = [m for m, c in MONTHS for _ in range(c - (2 if m == 11 else 0))]
    rng.shuffle(kinds)
    rng.shuffle(regions)
    months.sort()
    # Agreed cases are more likely earlier (they had time to finish): sort so late-November rows lean open.
    kinds.sort(key=lambda k: (not k[1]) and rng.random() < 0.35)

    codes = [n for n in range(1, 279) if n not in (41, 42)]
    events: list[CaseEvent] = []
    cases: list[Case] = []
    for i, ((dtype, is_agreed), region, month) in enumerate(zip(kinds, regions, months)):
        created = at(month, rng)
        amount = rng.choice([2, 3, 4, 5, 6, 8, 9, 12, 15, 18, 25, 40]) * 1_000_000 if dtype != "oilaviy" else None
        mediator = rng.choice(mediators)
        c = Case(code=f"MD-2026-{codes[i]:04d}", dispute_type=dtype, region=region, amount_uzs=amount,
                 description=SAMPLES[dtype], claimant=pool, respondent_name=f"{rng.choice(FIRST)} {rng.choice(LAST)}",
                 respondent_phone="+99890" + str(rng.randint(1000000, 9999999)), comparison=comparison_for(amount),
                 invite_text="Masalani mediator yordamida tinch hal qilishni taklif qilaman.", created_at=created)
        steps = ["created", "invited"]
        if is_agreed:
            days = rng.choice([3, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 18])
            c.status, c.mediator, c.agreed_at = "agreed", mediator, created + timedelta(days=days, hours=rng.randint(1, 6))
            c.session_at = c.agreed_at - timedelta(hours=2)
            c.fee_uzs = mediator.price_uzs  # finished cases: both halves paid, escrow released
            c.claimant_paid_at = c.respondent_paid_at = c.session_at - timedelta(days=1)
            c.agreement = {"title": f"Mediativ kelishuv № {c.code}", "clauses": [
                {"title": "1. Tomonlar", "body": "Tomonlar mediator ishtirokida kelishuvga erishdilar."},
                {"title": "2. Shartlar", "body": "Majburiyatlar kelishilgan jadval asosida bajariladi."}],
                "citations": [], "source": "ai"}
            steps += ["accepted", "scheduled", "agreed"]
        else:
            roll = rng.random()
            if roll < 0.28:
                c.status = "declined"
                steps += ["declined"]
            elif roll < 0.55:
                c.status = "invited"
            elif roll < 0.75:
                c.status = "accepted"
                steps += ["accepted"]
            else:
                c.status, c.mediator = "scheduled", mediator
                c.session_at = created + timedelta(days=rng.randint(2, 6))
                c.fee_uzs = mediator.price_uzs
                steps += ["accepted", "scheduled"]
        c.classification = {"dispute_type": dtype, "mediable": True, "reason": "", "summary": SAMPLES[dtype], "amount_uzs": amount,
                            "confidence": 0.9, "source": "ai"}
        cases.append(c)
        t = created
        for s in steps:
            events.append(CaseEvent(case=c, kind=s, label=EV[s], at=t))
            t = c.agreed_at if s == "scheduled" and c.agreed_at else t + timedelta(hours=rng.randint(2, 30))

    # Showcase cases (identical to contract/fixtures/cases.json), owned by the demo claimant.
    base = fx("case.json")
    m01 = next(m for m in mediators if m.id == "m-01")
    now = datetime.now(TZ)
    for code, status, dtype in (("MD-2026-0041", "agreed", "qarz"), ("MD-2026-0042", "scheduled", "ijara")):
        created = now - timedelta(days=9 if status == "agreed" else 1, hours=3)
        c = Case(code=code, status=status, dispute_type=dtype, region="toshkent-sh", amount_uzs=base["amount_uzs"],
                 description=base["description"], claimant=ariza, respondent_name=base["respondent"]["name"],
                 respondent_phone=base["respondent"]["phone"], classification=base["classification"], comparison=comparison_for(base["amount_uzs"]),
                 invite_text=base["invite_text"], claimant_position=base["claimant_position"], respondent_position=base["respondent_position"],
                 mediator=m01, fee_uzs=m01.price_uzs, created_at=created)
        if status == "agreed":
            c.brief = base["brief"]
            c.agreement = fx("agreement.json")
            c.agreement["title"] = f"Mediativ kelishuv № {code}"
            c.session_at = created + timedelta(days=6)
            c.agreed_at = created + timedelta(days=7)
            c.claimant_paid_at = c.respondent_paid_at = created + timedelta(days=5)
            steps = ["created", "invited", "accepted", "scheduled", "agreed"]
        else:
            c.invite_token = "demo-invite-0042"
            c.session_at = (now + timedelta(days=1)).replace(hour=10, minute=0, second=0, microsecond=0)
            steps = ["created", "invited", "accepted", "scheduled"]
        # Art. 19, 20: the procedure agreement both parties consented to when the mediator was confirmed
        c.procedure = terms(c, m01, "uz", created + timedelta(hours=9 if status == "scheduled" else 60))
        c.procedure_deadline = datetime.fromisoformat(c.procedure["deadline"])
        cases.append(c)
        t = created
        for s in steps:
            events.append(CaseEvent(case=c, kind=s, label=EV[s], at=t))
            t = t + timedelta(hours=3 if status == "scheduled" else 30)

    Case.objects.bulk_create(cases)
    CaseEvent.objects.bulk_create(events)
    # Art. 29: the sealed showcase agreement names both parties in full, with addresses
    sealed = next(c for c in cases if c.code == "MD-2026-0041")
    for party, full_name, address in (
        ("claimant", "Karimov Aziz Bahodirovich", "Toshkent sh., Yunusobod tumani, Amir Temur koʻchasi, 12-uy (demo)"),
        ("respondent", "Umarov Bekzod Rustamovich", "Toshkent sh., Chilonzor tumani, 9-mavze, 14-uy, 23-xonadon (demo)"),
    ):
        Approval.objects.create(case=sealed, party=party, decision="approved", agreement_hash=agreement_hash(sealed.agreement),
                                full_name=full_name, address=address, at=sealed.agreed_at - timedelta(hours=2))
    return len(cases)
