from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from accounts.models import Profile
from cases.models import Case
from mediators.models import Mediator


class RoomRulesTest(TestCase):
    def test_meeting_clash_and_agreement_gate(self):
        User = get_user_model()
        med_user = User.objects.create_user("m", password="x")
        Profile.objects.create(user=med_user, role="mediator", full_name="Dilnoza")
        claimant = User.objects.create_user("c", password="x")
        Profile.objects.create(user=claimant, role="claimant", full_name="Aziz")
        med = Mediator.objects.create(id="m-99", user=med_user, name="Dilnoza", registry_no="MR-1", region="toshkent-sh", price_uzs=1)
        case = Case.objects.create(code="MD-T-1", dispute_type="ijara", region="toshkent-sh", description="x" * 30, claimant=claimant,
                                   respondent_name="Bekzod", mediator=med, status="scheduled")
        mediator, client = APIClient(), APIClient()
        mediator.credentials(HTTP_AUTHORIZATION="Token " + Token.objects.create(user=med_user).key)
        client.credentials(HTTP_AUTHORIZATION="Token " + Token.objects.create(user=claimant).key)
        start = (timezone.now() + timedelta(days=1)).replace(microsecond=0)

        # meetings with the two parties may not overlap
        r = mediator.post(f"/api/rooms/{case.id}/meetings/", {"party": "claimant", "start": start.isoformat(), "minutes": 60}, format="json")
        self.assertEqual(r.status_code, 201)
        r = mediator.post(f"/api/rooms/{case.id}/meetings/", {"party": "respondent", "start": (start + timedelta(minutes=30)).isoformat(), "minutes": 45}, format="json")
        self.assertEqual(r.status_code, 409)
        r = mediator.post(f"/api/rooms/{case.id}/meetings/", {"party": "respondent", "start": (start + timedelta(minutes=60)).isoformat(), "minutes": 45}, format="json")
        self.assertEqual(r.status_code, 201)

        # the agreement can be sealed only after both parties approved the current text
        agreement = {"title": "K", "clauses": [{"title": "1", "body": "a"}], "citations": [], "source": "ai"}
        self.assertEqual(mediator.patch(f"/api/cases/{case.id}/", {"agreement": agreement}, format="json").status_code, 200)
        self.assertEqual(mediator.patch(f"/api/cases/{case.id}/", {"status": "agreed"}, format="json").status_code, 400)
        self.assertEqual(client.post(f"/api/rooms/{case.id}/approve/", {"decision": "approved"}, format="json").status_code, 200)
        self.assertEqual(APIClient().post(f"/api/rooms/t/{case.invite_token}/approve/", {"decision": "approved"}, format="json").status_code, 200)
        self.assertEqual(mediator.patch(f"/api/cases/{case.id}/", {"status": "agreed"}, format="json").status_code, 200)
