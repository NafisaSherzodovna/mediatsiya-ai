"use client";

import { ArrowLeft, CalendarClock, Copy, FileSignature, Hourglass, Scale, Send, XCircle } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { use, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { Avatar } from "@/components/brand/bits";
import { CaseHeader, PositionCard, Timeline } from "@/components/case/parts";
import { BookingDialog } from "@/components/mediators/booking";
import { AppShell } from "@/components/shell/app-header";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { dateUz } from "@/lib/format";
import type { Case } from "@/lib/types";
import { useOrigin } from "@/lib/use-origin";

export default function CasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <AppShell roles={["claimant", "admin", "ministry"]} wide>
      <CaseView id={id} />
    </AppShell>
  );
}

function CaseView({ id }: { id: string }) {
  const { data, error, mutate } = useSWR<Case>(`/cases/${id}/`, (p: string) => api<Case>(p), { refreshInterval: 4000 });
  const [booking, setBooking] = useState(false);
  const origin = useOrigin();

  if (error) return <p className="text-stop">Ish topilmadi.</p>;
  if (!data) return <div className="h-64 animate-pulse rounded-2xl bg-muted" />;
  const c = data;
  const link = `${origin}/taklif/${c.invite_token}`;

  return (
    <div>
      <Link href="/ishlar" className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-ink">
        <ArrowLeft className="size-4" /> Ishlarim
      </Link>
      <CaseHeader item={c} />

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <NextAction c={c} link={link} onBook={() => setBooking(true)} />

          {(c.claimant_position || c.respondent_position) && (
            <section>
              <h2 className="mb-3 text-lg font-semibold text-ink">Tomonlar pozitsiyasi</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {c.claimant_position && <PositionCard title="Murojaatchi" name={c.claimant.name} data={c.claimant_position} tone="ink" />}
                {c.respondent_position && <PositionCard title="Ikkinchi tomon" name={c.respondent.name} data={c.respondent_position} tone="accord" />}
              </div>
            </section>
          )}

          <section className="sheet p-5">
            <h2 className="text-lg font-semibold text-ink">Nizo tavsifi</h2>
            <p className="mt-2 leading-relaxed text-ink">{c.description}</p>
            {c.classification && <p className="mt-3 rounded-xl bg-muted px-3.5 py-2.5 text-sm text-ink-soft">AI: {c.classification.summary}</p>}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="sheet p-5">
            <h2 className="mb-4 text-lg font-semibold text-ink">Jarayon</h2>
            <Timeline events={c.events} />
          </section>
          <section className="sheet p-5">
            <h2 className="mb-3 text-lg font-semibold text-ink">Tomonlar</h2>
            <div className="space-y-3">
              <Party name={c.claimant.name} role="Murojaatchi" />
              <Party name={c.respondent.name} role="Ikkinchi tomon" />
              {c.mediator && <Party name={c.mediator.name} role={`Mediator · ${c.mediator.registry_no}`} />}
            </div>
          </section>
        </aside>
      </div>

      <BookingDialog open={booking} onOpenChange={setBooking} item={c} onBooked={(u) => void mutate(u, { revalidate: false })} />
    </div>
  );
}

function Party({ name, role }: { name: string; role: string }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar name={name} className="size-9 text-xs" />
      <div className="leading-tight">
        <p className="font-semibold text-ink">{name}</p>
        <p className="text-xs text-ink-soft">{role}</p>
      </div>
    </div>
  );
}

function Panel({ icon, tone, title, children }: { icon: React.ReactNode; tone: string; title: string; children: React.ReactNode }) {
  return (
    <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`rounded-2xl border p-5 sm:p-6 ${tone}`}>
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/80">{icon}</span>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold text-ink">{title}</h2>
          <div className="mt-1.5 text-ink-soft">{children}</div>
        </div>
      </div>
    </motion.section>
  );
}

function NextAction({ c, link, onBook }: { c: Case; link: string; onBook: () => void }) {
  if (c.status === "invited" || c.status === "new") {
    return (
      <Panel icon={<Hourglass className="size-5 text-warn" />} tone="border-warn/30 bg-warn-tint" title="Ikkinchi tomon javobi kutilmoqda">
        <p>{c.respondent.name} havolani ochib, roziligini bildiradi. Sahifa avtomatik yangilanadi.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button asChild size="sm" className="bg-[#229ED9] text-white hover:bg-[#1b8bc0]">
            <a href={`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(c.invite_text)}`} target="_blank" rel="noreferrer">
              <Send className="size-4" /> Qayta yuborish
            </a>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => void navigator.clipboard?.writeText(link).then(() => toast.success("Havola nusxalandi"))}
          >
            <Copy className="size-4" /> Havola
          </Button>
        </div>
      </Panel>
    );
  }
  if (c.status === "accepted") {
    return (
      <Panel icon={<Scale className="size-5 text-seal" />} tone="border-seal/25 bg-seal-tint" title="Ikkinchi tomon rozi! Mediator tanlang">
        <p>Reyestrdagi mediatorlardan birini tanlab, sessiya vaqtini belgilang.</p>
        <Button className="mt-3" variant="accord" onClick={onBook}>
          Mediator tanlash
        </Button>
      </Panel>
    );
  }
  if (c.status === "scheduled" && c.mediator) {
    return (
      <Panel icon={<CalendarClock className="size-5 text-accord" />} tone="border-accord/25 bg-accord-tint" title="Sessiya belgilandi">
        <p>
          Mediator <b className="text-ink">{c.mediator.name}</b> · {c.session_at ? dateUz(c.session_at) : "vaqt kelishilmoqda"}. Mediator AI tayyorlagan maʼlumotnoma bilan
          sessiyaga tayyorlanadi.
        </p>
      </Panel>
    );
  }
  if (c.status === "agreed" || c.status === "closed") {
    return (
      <Panel icon={<FileSignature className="size-5 text-accord" />} tone="border-accord/25 bg-accord-tint" title="Kelishuvga erishildi">
        <p>Mediativ kelishuv imzolandi{c.agreed_at ? ` (${dateUz(c.agreed_at, false)})` : ""}.</p>
        <Button asChild className="mt-3" variant="accord">
          <Link href={`/ishlar/${c.id}/kelishuv`}>Kelishuvni koʻrish</Link>
        </Button>
      </Panel>
    );
  }
  return (
    <Panel icon={<XCircle className="size-5 text-stop" />} tone="border-stop/25 bg-stop-tint" title="Ikkinchi tomon rad etdi">
      <p>Sudga murojaat qilish huquqingiz saqlanadi. Xohlasangiz, yangi taklif bilan qayta urinib koʻring.</p>
    </Panel>
  );
}
