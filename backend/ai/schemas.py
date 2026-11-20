"""Model output schemas. They mirror contract/api.md without `source` (views add it)."""

from typing import Literal

from pydantic import BaseModel, Field

DisputeType = Literal["qarz", "ijara", "oilaviy", "istemolchi", "mehnat", "qoshnichilik", "boshqa"]


class Classification(BaseModel):
    dispute_type: DisputeType
    mediable: bool
    reason: str = Field(description="1-2 sentences why mediation can or cannot be used")
    summary: str = Field(description="One neutral sentence: who owes or wants what")
    amount_uzs: int | None = Field(description="Amount in soʻm if stated, else null")
    confidence: float = Field(ge=0, le=1)


class CompareNotes(BaseModel):
    notes: list[str] = Field(max_length=3)


class InviteOut(BaseModel):
    text: str
    checks: list[str] = Field(description="2-3 short labels of what the text does well", max_length=3)


class Position(BaseModel):
    wants: list[str]
    can_offer: list[str]
    concerns: list[str]
    summary: str


class Brief(BaseModel):
    facts: list[str]
    claimant_wants: list[str]
    respondent_wants: list[str]
    common_ground: list[str]
    zopa: str = Field(description="One sentence: the settlement range both sides could accept")
    suggested_options: list[str]
    risks: list[str]


class Clause(BaseModel):
    title: str
    body: str


class Agreement(BaseModel):
    title: str
    clauses: list[Clause]


class AskOut(BaseModel):
    answer: str
    articles: list[str] = Field(description="Article numbers used, like '13-modda'")
