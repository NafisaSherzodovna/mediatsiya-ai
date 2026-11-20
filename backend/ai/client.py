"""Gemini over REST with key and model failover.

Rules (docs/plan/00-overview.md, "AI calls"):
- 429 / 500 / 503 -> same model, next key; when every key failed on a model -> next model
- 401 / 403 -> drop the key for the rest of the process
- timeout / network error -> next key on the same model (latency on flash-lite varies 5-20 s), then next model
- 400 -> next model
- total budget `total_s`, per attempt `attempt_s`; returns None when everything failed
Never logs a key.
"""

from __future__ import annotations

import json
import logging
import time
from typing import Any, TypeVar

import httpx
from django.conf import settings
from pydantic import BaseModel, ValidationError

log = logging.getLogger("ai")
log.setLevel(logging.INFO)
if not log.handlers:
    _h = logging.StreamHandler()
    _h.setFormatter(logging.Formatter("%(message)s"))
    log.addHandler(_h)
    log.propagate = False
URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
T = TypeVar("T", bound=BaseModel)

_dead_keys: set[str] = set()


def enabled() -> bool:
    return any(k not in _dead_keys for k in settings.GEMINI_API_KEYS)


def _clean_schema(schema: dict[str, Any]) -> dict[str, Any]:
    """Inline $defs and drop keys Gemini's JSON schema support may reject."""
    defs = schema.get("$defs", {})

    def walk(node: Any) -> Any:
        if isinstance(node, dict):
            if "$ref" in node:
                return walk(defs[node["$ref"].split("/")[-1]])
            out = {}
            for k, v in node.items():
                if k in ("$defs", "title", "default"):
                    continue  # schema keywords only; a property *named* "title" lives under "properties"
                out[k] = {pk: walk(pv) for pk, pv in v.items()} if k == "properties" else walk(v)
            return out
        if isinstance(node, list):
            return [walk(v) for v in node]
        return node

    return walk(schema)


def _text_of(data: dict[str, Any]) -> str | None:
    try:
        parts = data["candidates"][0]["content"]["parts"]
    except (KeyError, IndexError, TypeError):
        return None
    text = "".join(p.get("text", "") for p in parts if not p.get("thought"))
    return text.strip() or None


def _call(system: str, parts: list[dict], gen_config: dict, total_s: float, attempt_s: float) -> str | None:
    keys = [k for k in settings.GEMINI_API_KEYS if k not in _dead_keys]
    if not keys:
        return None
    deadline = time.monotonic() + total_s
    body = {
        "systemInstruction": {"parts": [{"text": system}]},
        "contents": [{"role": "user", "parts": parts}],
        "generationConfig": gen_config,
    }
    with httpx.Client() as http:
        for model in settings.GEMINI_MODELS:
            for n, key in enumerate(keys, start=1):
                if key in _dead_keys:
                    continue
                left = deadline - time.monotonic()
                if left <= 0.5:
                    return None
                started = time.monotonic()
                try:
                    res = http.post(
                        URL.format(model=model),
                        headers={"x-goog-api-key": key, "Content-Type": "application/json"},
                        json=body,
                        timeout=min(attempt_s, left),
                    )
                except (httpx.TimeoutException, httpx.TransportError) as exc:
                    log.warning("[ai] %s key#%d -> %s", model, n, type(exc).__name__)
                    continue  # slow answer: the other key often answers in time
                ms = int((time.monotonic() - started) * 1000)
                if res.status_code == 200:
                    text = _text_of(res.json())
                    if text:
                        log.info("[ai] %s key#%d -> OK %d ms", model, n, ms)
                        return text
                    log.warning("[ai] %s key#%d -> empty answer", model, n)
                    break
                log.warning("[ai] %s key#%d -> HTTP %d in %d ms", model, n, res.status_code, ms)
                if res.status_code in (401, 403):
                    _dead_keys.add(key)
                    continue
                if res.status_code in (429, 500, 503):
                    continue  # busy: try the other key on the same model
                break  # 400 and anything else: next model
    return None


# No thinkingConfig: measured 2026-11-20, flash-lite answers fastest without it (4.9-5.6 s vs 6-7 s with "low").
def generate_text(system: str, parts: list[dict], *, total_s: float = 20, attempt_s: float = 10) -> str | None:
    return _call(system, parts, {"temperature": 0.4}, total_s, attempt_s)


def generate_json(system: str, parts: list[dict], schema: type[T], *, total_s: float = 20, attempt_s: float = 10) -> T | None:
    config = {
        "temperature": 0.4,
        "responseMimeType": "application/json",
        "responseJsonSchema": _clean_schema(schema.model_json_schema()),
    }
    text = _call(system, parts, config, total_s, attempt_s)
    if not text:
        return None
    try:
        return schema.model_validate_json(text)
    except ValidationError:
        try:  # tolerate ```json fences
            return schema.model_validate(json.loads(text.strip().strip("`").removeprefix("json")))
        except (ValueError, ValidationError):
            log.warning("[ai] invalid JSON for %s", schema.__name__)
            return None
