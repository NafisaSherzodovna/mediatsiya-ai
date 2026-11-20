from django.test import TestCase, override_settings
from rest_framework.test import APIClient


@override_settings(GEMINI_API_KEYS=[])
class ClassifyFallbackTests(TestCase):
    """The stage failures that would hurt most: model down + Cyrillic input, and a criminal matter."""

    def setUp(self):
        self.api = APIClient()

    def test_classify_fallback_cyrillic(self):
        r = self.api.post("/api/ai/classify/", {"text": "Ижарачим 3 ойдан бери тўламаяпти, қарзи 9 миллион"}, format="json")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data["dispute_type"], "ijara")
        self.assertIs(r.data["mediable"], True)
        self.assertEqual(r.data["amount_uzs"], 9000000)
        self.assertEqual(r.data["source"], "fallback")

    def test_classify_criminal_not_mediable(self):
        r = self.api.post("/api/ai/classify/", {"text": "Qoʻshnim meni urdi va telefonimni oʻgʻirladi"}, format="json")
        self.assertEqual(r.status_code, 200)
        self.assertIs(r.data["mediable"], False)
