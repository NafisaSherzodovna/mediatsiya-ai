"use client";

import { CalendarClock, Hourglass, Inbox, Wallet } from "lucide-react";
import useSWR from "swr";
import { CaseCard } from "@/components/case/parts";
import { AppShell } from "@/components/shell/app-header";
import { api } from "@/lib/api";
import { useUser } from "@/lib/auth";
import { dateUz, som } from "@/lib/format";
import type { Case, User } from "@/lib/types";

export default function MediatorHome() {
  return (
    <AppShell roles={["mediator"]}>
      <List />
    </AppShell>
  );
}

function List() {
  const { user } = useUser();
  // fresh from the server: the admin may have approved this mediator since login
  const { data: me } = useSWR<User>("/auth/me/", (p: string) => api<User>(p), { refreshInterval: 15000 });
  const { data } = useSWR<Case[]>("/cases/", (p: string) => api<Case[]>(p), { refreshInterval: 5000 });
  if (me?.pending ?? user?.pending) {
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
  const upcoming = data?.filter((c) => c.status === "scheduled") ?? [];
  const done = data?.filter((c) => c.status === "agreed" || c.status === "closed") ?? [];
  // shortcut: sums the latest 50 cases the list endpoint returns; add a payouts endpoint once a mediator has more
  const payout = (s: "held" | "released") => (data ?? []).reduce((t, c) => t + (c.payment?.status === s ? c.payment.mediator_payout_uzs : 0), 0);
  return (
    <div>
      <p className="text-xs font-semibold tracking-[0.14em] text-accord uppercase">Mediator kabineti</p>
      <h1 className="mt-1 text-[2rem] font-semibold text-ink">Xush kelibsiz, {user?.name.split(" ")[0]}</h1>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="Rejalashtirilgan" value={upcoming.length} />
        <Stat label="Kelishuv" value={done.length} />
        <Stat label="Jami ishlar" value={data?.length ?? 0} className="hidden sm:block" />
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Money label="Hisobingizga oʻtkazilgan" hint="10 % platforma xizmat haqidan keyin" uzs={payout("released")} accent />
        <Money label="Platformada muzlatilgan" hint="Kelishuv imzolangach oʻtkaziladi" uzs={payout("held")} />
      </div>
      <h2 className="mt-8 mb-3 flex items-center gap-2 text-lg font-semibold text-ink">
        <CalendarClock className="size-5 text-accord" /> Navbatdagi sessiyalar
      </h2>
      {data && upcoming.length === 0 && (
        <div className="sheet flex items-center gap-3 p-5 text-ink-soft">
          <Inbox className="size-5" /> Hozircha rejalashtirilgan sessiya yoʻq.
        </div>
      )}
      {!data && <div className="h-36 animate-pulse rounded-2xl bg-muted" />}
      <div className="grid gap-3">
        {upcoming.map((c, i) => (
          <div key={c.id}>
            {c.session_at && <p className="mb-1.5 text-sm font-semibold text-accord">{dateUz(c.session_at)}</p>}
            <CaseCard item={c} href={`/mediator/${c.id}`} index={i} />
          </div>
        ))}
      </div>
      {done.length > 0 && (
        <>
          <h2 className="mt-8 mb-3 text-lg font-semibold text-ink">Yakunlangan</h2>
          <div className="grid gap-3">
            {done.map((c, i) => (
              <CaseCard key={c.id} item={c} href={`/mediator/${c.id}`} index={i} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Money({ label, hint, uzs, accent }: { label: string; hint: string; uzs: number; accent?: boolean }) {
  return (
    <div className={`sheet p-4 ${accent ? "bg-[linear-gradient(180deg,#fff,var(--accord-tint))]" : ""}`}>
      <p className="flex items-center gap-2 text-sm text-ink-soft">
        <Wallet className="size-4 text-accord" /> {label}
      </p>
      <p className="mt-2 font-display text-2xl font-semibold whitespace-nowrap text-ink tabular">{som(uzs)}</p>
      <p className="mt-1 text-xs text-ink-soft">{hint}</p>
    </div>
  );
}

function Stat({ label, value, className }: { label: string; value: number; className?: string }) {
  return (
    <div className={`sheet p-4 ${className ?? ""}`}>
      <p className="font-display text-3xl font-semibold text-ink tabular">{value}</p>
      <p className="mt-1 text-sm text-ink-soft">{label}</p>
    </div>
  );
}
