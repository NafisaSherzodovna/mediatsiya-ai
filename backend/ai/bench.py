"""Dev-only latency probe: python manage.py shell -c "import ai.bench"  (not used by the app)."""

import time

import httpx
from django.conf import settings

from .client import URL, _clean_schema
from .prompts import CLASSIFY
from .schemas import Classification

TEXT = "Ijarachim 3 oydan beri toʻlamayapti, qarzi 9 million soʻm boʻldi."
for model in settings.GEMINI_MODELS[:1]:
    for n, key in enumerate(settings.GEMINI_API_KEYS, 1):
        for label, cfg in [
            ("json+think-low", {"thinkingConfig": {"thinkingLevel": "low"}}),
            ("json+think-minimal", {"thinkingConfig": {"thinkingLevel": "minimal"}}),
            ("json-no-think-cfg", {}),
        ]:
            body = {
                "systemInstruction": {"parts": [{"text": CLASSIFY}]},
                "contents": [{"role": "user", "parts": [{"text": TEXT}]}],
                "generationConfig": {
                    "temperature": 0.4,
                    "responseMimeType": "application/json",
                    "responseJsonSchema": _clean_schema(Classification.model_json_schema()),
                    **cfg,
                },
            }
            t = time.monotonic()
            try:
                r = httpx.post(URL.format(model=model), headers={"x-goog-api-key": key}, json=body, timeout=25)
                print(model, f"key#{n}", label, r.status_code, int((time.monotonic() - t) * 1000), "ms", r.text[:120].replace("\n", " ") if r.status_code != 200 else "")
            except httpx.TimeoutException:
                print(model, f"key#{n}", label, "timeout 25s")
