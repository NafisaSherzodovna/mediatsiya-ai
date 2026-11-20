"use client";

import { useState } from "react";
import { AiThinking } from "@/components/brand/ai-thinking";
import { AiSourceChip, Avatar, Eyebrow, StatusBadge } from "@/components/brand/bits";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { som } from "@/lib/format";
import type { CaseStatus } from "@/lib/types";

const STATUSES: CaseStatus[] = ["new", "invited", "accepted", "declined", "scheduled", "agreed", "closed"];

export default function Kit() {
  const [run, setRun] = useState(0);
  return (
    <main className="mx-auto w-full max-w-4xl space-y-10 px-4 py-10">
      <Logo />
      <section className="space-y-3">
        <Eyebrow>Tipografiya</Eyebrow>
        <h1 className="text-4xl font-semibold text-ink sm:text-5xl">Nizoni sudsiz hal qiling</h1>
        <p className="max-w-prose text-lg text-ink-soft">
          Oʻzbekcha harflar tekshiruvi: oʻ gʻ Oʻ Gʻ, tutuq: maʼlumot, isteʼmolchi, taʼlim. Qoʻshnichilik, Fargʻona.
        </p>
        <p className="font-doc text-lg text-ink">Hujjat shrifti: Mediativ kelishuv — tomonlar oʻzaro kelishib oldilar. Toʻlov jadvali.</p>
        <p className="font-display tabular text-3xl text-ink">{som(9000000)}</p>
        <p className="text-ink-soft">
          Kalit ibora <span className="marker text-ink">qarz 6 oyda boʻlib toʻlanadi</span> shu kabi belgilanadi.
        </p>
      </section>
      <section className="flex flex-wrap gap-3">
        <Button size="lg">Murojaat qilish</Button>
        <Button size="lg" variant="outline">
          Batafsil
        </Button>
        <Button size="lg" variant="secondary">
          Ikkinchi darajali
        </Button>
      </section>
      <section className="flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <StatusBadge key={s} status={s} />
        ))}
        <AiSourceChip source="ai" />
        <AiSourceChip source="fallback" />
      </section>
      <section className="flex gap-3">
        {["Dilnoza Rahimova", "Shoxrux Aliyev", "Malika Yusupova", "Jamshid Toʻraev"].map((n) => (
          <Avatar key={n} name={n} />
        ))}
      </section>
      <section className="grid gap-4 sm:grid-cols-2">
        <AiThinking
          key={run}
          steps={["Matn oʻqilmoqda", "Nizo turi aniqlanmoqda", "Qonun bilan solishtirilmoqda"]}
          done={true}
        />
        <div className="hujjat p-6 pl-14 font-doc">
          <p className="font-semibold">Mediativ kelishuv № MD-2026-0042</p>
          <p className="mt-2 text-ink-soft">Qarz 6 oy davomida har oyning 10-sanasigacha toʻlanadi.</p>
          <Button className="mt-4" variant="outline" onClick={() => setRun((r) => r + 1)}>
            Animatsiyani qayta
          </Button>
        </div>
      </section>
    </main>
  );
}
