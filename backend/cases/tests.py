from django.contrib.auth.models import User
from rest_framework.test import APITestCase

from .models import Case


class InviteFlowTest(APITestCase):
    def test_invite_flow(self):
        claimant = User.objects.get(username="ariza")  # created by accounts 0002_demo_users
        self.client.force_authenticate(claimant)
        res = self.client.post("/api/cases/", {
            "description": "Ijarachim 3 oydan beri toʻlamayapti, qarzi 9 million soʻm.",
            "dispute_type": "ijara", "region": "toshkent-sh", "amount_uzs": 9000000,
            "respondent": {"name": "Bekzod Umarov", "phone": "+998931112233"},
            "invite_text": "Assalomu alaykum, mediatsiyani taklif qilaman.",
        }, format="json")
        self.assertEqual(res.status_code, 201, res.data)
        self.assertEqual(res.data["status"], "invited")
        token = Case.objects.get(pk=res.data["id"]).invite_token

        self.client.force_authenticate(None)  # the respondent has no account
        res = self.client.get(f"/api/invite/{token}/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["claimant_name"], "Aziz Karimov")

        res = self.client.post(f"/api/invite/{token}/respond/", {"accept": True, "position": None}, format="json")
        self.assertEqual(res.data, {"status": "accepted"})
        self.assertEqual(self.client.get("/api/invite/nope/").status_code, 404)
