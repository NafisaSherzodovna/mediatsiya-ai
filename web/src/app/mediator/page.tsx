"use client";

import { CalendarClock, ChevronRight, CircleCheck, Hourglass, Inbox, Wallet } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";
import { cn } from "cn";
import { StatusBadge } from "@/components/brand/bits";
import { AppShell } from "@/components/shell/app-header";
import { api } from "@/lib/api";
import { useUser } from "@/lib/auth";
import { hhmmTashkent, monthUz, percent, som, tashkent, tashkentDay } from "@/lib/format";
import { DISPUTE_LABEL } from "@/lib/labels";
import type { Case, User } from "@/lib/types";

export default function MediatorHome() {
  return (
    <AppShell roles={["mediator"]} wide>
      <Dashboard />
    </AppShell>
  );
}

type Tab = "active" | "done" | "ended";
const TABS: { v: Tab; label: string }[] = [
  { v: "active", label: "Faol" },
  { v: "done", label: "Kelishuv bilan" },
  { v: "ended", label: "Tugatilgan" },
];

function Dashboard() {
  const { user } = useUser();
  // fresh from the server: the admin may have approved this mediator since login
  const { data: me } = useSWR<User>("/auth/me/", (p: string) => api<User>(p), { refreshInterval: 15000 });
  const { data } = useSWR<Case[]>("/cases/", (p: string) => api<Case[]>(p), { refreshInterval: 5000 });
  const [tab, setTab] = useState<Tab>("active");
  const [today] = useState(() => [tashkentDay(0).ymd, tashkentDay(1).ymd] as const);

  if (me?.pending ?? user?.pending) return <Pending />;

  const active = (data ?? []).filter((c) => c.status === "scheduled").sort((a, b) => (a.session_at ?? "").localeCompare(b.session_at ?? ""));
  const done = (data ?? []).filter((c) => c.status === "agreed" || c.status === "closed");
  const ended = (data ?? []).filter((c) => c.status === "terminated");
  const lists: Record<Tab, Case[]> = { active, done, ended };
  const finished = done.length + ended.length;
  // shortcut: sums the latest 50 cases the list endpoint returns; add a payouts endpoint once a mediator has more
  const payout = (s: "held" | "released" | "pending") => (data ?? []).reduce((t, c) => t + (c.payment?.status === s ? c.payment.mediator_payout_uzs : 0), 0);
  const todayCount = active.filter((c) => c.session_at && dayKey(c.session_at) === today[0]).length;

  return (
    <div>
      <p className="text-xs font-semibold tracking-[0.14em] text-accord uppercase">Mediator kabineti</p>
      <h1 className="mt-1 text-[2rem] font-semibold text-ink">Xush kelibsiz, {user?.name.split(" ")[0]}</h1>
      <p className="mt-1 text-ink-soft">
        {!data ? "Yuklanmoqda…" : todayCount ? `Bugun ${todayCount} ta sessiya bor.` : active.length ? `${active.length} ta faol ish.` : "Hozircha faol ish yoʻq."}
      </p>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1fr_320px]">
        <section className="min-w-0">
          <div role="tablist" aria-label="Ishlar" className="flex gap-1 overflow-x-auto rounded-xl bg-muted p-1">
            {TABS.map((t) => (
              <button
                key={t.v}
                type="button"
                role="tab"
                aria-selected={tab === t.v}
                onClick={() => setTab(t.v)}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors",
                  tab === t.v ? "bg-white text-ink shadow-sm" : "text-ink-soft hover:text-ink",
                )}
              >
                {t.label}
                <span className={cn("rounded-full px-1.5 text-xs tabular", tab === t.v ? "bg-ink text-white" : "bg-white/70")}>{lists[t.v].length}</span>
              </button>
            ))}
          </div>

          <div className="mt-4">
            {!data && <div className="h-48 animate-pulse rounded-2xl bg-muted" />}
            {data && lists[tab].length === 0 && (
              <div className="sheet flex items-center gap-3 p-6 text-ink-soft">
                <Inbox className="size-5 shrink-0" />
                {tab === "active" ? "Hozircha rejalashtirilgan sessiya yoʻq." : tab === "done" ? "Hali kelishuv bilan yakunlangan ish yoʻq." : "Tugatilgan ish yoʻq."}
              </div>
            )}
            {data && lists[tab].length > 0 && (
              <ul className="sheet divide-y divide-rule overflow-hidden p-0">
                {lists[tab].map((c) => (
                  <Row key={c.id} c={c} today={today} />
                ))}
              </ul>
            )}
          </div>
        </section>

        <aside className="space-y-4 lg:sticky lg:top-24">
          <div className="sheet p-5">
            <p className="text-sm font-semibold text-ink">Koʻrsatkichlar</p>
            <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
              <Stat label="Faol" value={active.length} />
              <Stat label="Kelishuv" value={done.length} />
              <Stat label="Jami" value={data?.length ?? 0} />
            </dl>
            {finished > 0 && (
              <p className="mt-3 flex items-center gap-1.5 text-sm text-ink-soft">
                <CircleCheck className="size-4 text-accord" /> Kelishuv ulushi: <b className="text-ink">{percent(done.length / finished, 0)}</b>
              </p>
            )}
          </div>

          <div className="sheet p-5">
            <p className="flex items-center gap-2 text-sm font-semibold text-ink">
              <Wallet className="size-4 text-accord" /> Daromad
            </p>
            <p className="mt-3 text-xs text-ink-soft">Hisobingizga oʻtkazilgan</p>
            <p className="font-display text-2xl font-semibold whitespace-nowrap text-ink tabular">{som(payout("released"))}</p>
            <div className="mt-3 grid grid-cols-2 gap-3 border-t border-rule pt-3">
              <Money label="Muzlatilgan" hint="kelishuvdan keyin" uzs={payout("held")} />
              <Money label="Toʻlov kutilmoqda" hint="taraflar toʻlamagan" uzs={payout("pending")} />
            </div>
            <p className="mt-3 text-xs text-ink-soft">Summalar 10 % platforma xizmat haqidan keyin koʻrsatilgan.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function dayKey(iso: string) {
  const p = tashkent(iso);
  return `${p.y}-${String(p.mo + 1).padStart(2, "0")}-${String(p.d).padStart(2, "0")}`;
}

/** One case as an agenda line: the date tile, what the dispute is, the parties, its state. */
function Row({ c, today }: { c: Case; today: readonly [string, string] }) {
  const when = c.status === "scheduled" ? c.session_at : (c.agreed_at ?? c.updated_at);
  const p = when ? tashkent(when) : null;
  const key = when ? dayKey(when) : "";
  const label = key === today[0] ? "Bugun" : key === today[1] ? "Ertaga" : null;
  const unpaid = c.status === "scheduled" && c.payment?.status === "pending";
  return (
    <li>
      <Link href={`/mediator/${c.id}`} className="group flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-ink-wash/60 sm:px-5">
        <span className={cn("grid w-16 shrink-0 place-items-center rounded-xl py-2 text-center leading-none", label === "Bugun" ? "bg-accord text-white" : "bg-muted text-ink")}>
          {p && when ? (
            <>
              <span className="text-[0.7rem] font-semibold uppercase opacity-80">{label ?? monthUz(`${p.y}-${String(p.mo + 1).padStart(2, "0")}`)}</span>
              <span className="mt-1 font-display text-xl font-semibold tabular">{p.d}</span>
              {c.status === "scheduled" && <span className="mt-1 text-xs font-medium tabular opacity-80">{hhmmTashkent(when)}</span>}
            </>
          ) : (
            <CalendarClock className="size-5" />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-mono text-xs text-ink-soft">{c.code}</span>
            <StatusBadge status={c.status} className="px-2 py-0.5" />
            {unpaid && <span className="rounded-full bg-warn-tint px-2 py-0.5 text-xs font-semibold text-[#7a4f12]">Toʻlov kutilmoqda</span>}
          </span>
          <span className="mt-1 block truncate font-semibold text-ink">
            {DISPUTE_LABEL[c.dispute_type]}
            {c.amount_uzs ? ` · ${som(c.amount_uzs)}` : ""}
          </span>
          <span className="mt-0.5 block truncate text-sm text-ink-soft">
            {c.claimant.name} ↔ {c.respondent.name || "Ikkinchi tomon"}
          </span>
        </span>
        <ChevronRight className="size-5 shrink-0 text-ink-soft transition-transform group-hover:translate-x-0.5" />
      </Link>
    </li>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-muted px-2 py-3">
      <dd className="font-display text-2xl font-semibold text-ink tabular">{value}</dd>
      <dt className="mt-0.5 text-xs text-ink-soft">{label}</dt>
    </div>
  );
}

function Money({ label, hint, uzs }: { label: string; hint: string; uzs: number }) {
  return (
    <div>
      <p className="text-xs text-ink-soft">{label}</p>
      <p className="font-semibold whitespace-nowrap text-ink tabular">{som(uzs)}</p>
      <p className="text-[0.7rem] text-ink-soft">{hint}</p>
    </div>
  );
}

function Pending() {
  return (
    <div className="sheet mx-auto mt-6 max-w-lg p-6 text-center sm:p-8">
      <span className="mx-auto grid size-16 place-items-center rounded-full bg-warn-tint text-[#7a4f12]">
        <Hourglass className="size-7" />
      </span>
      <h1 className="mt-5 text-2xl font-semibold text-ink">Arizangiz koʻrib chiqilmoqda</h1>
      <p className="mt-2 leading-relaxed text-ink-soft">
        Administrator reyestr raqamingizni tekshirib, profilingizni tasdiqlaydi. Shundan keyin siz murojaatchilarga tavsiya qilinadigan mediatorlar roʻyxatida
        paydo boʻlasiz.
      </p>
    </div>
  );
}
