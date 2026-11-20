"use client";

import { CalendarClock, Inbox } from "lucide-react";
import useSWR from "swr";
import { CaseCard } from "@/components/case/parts";
import { AppShell } from "@/components/shell/app-header";
import { api } from "@/lib/api";
import { useUser } from "@/lib/auth";
import { dateUz } from "@/lib/format";
import type { Case } from "@/lib/types";

export default function MediatorHome() {
  return (
    <AppShell roles={["mediator"]}>
      <List />
    </AppShell>
  );
}

function List() {
  const { user } = useUser();
  const { data } = useSWR<Case[]>("/cases/", (p: string) => api<Case[]>(p), { refreshInterval: 5000 });
  const upcoming = data?.filter((c) => c.status === "scheduled") ?? [];
  const done = data?.filter((c) => c.status === "agreed" || c.status === "closed") ?? [];
  return (
    <div>
      <p className="text-xs font-semibold tracking-[0.14em] text-accord uppercase">Mediator kabineti</p>
      <h1 className="mt-1 text-[2rem] font-semibold text-ink">Xush kelibsiz, {user?.name.split(" ")[0]}</h1>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="Rejalashtirilgan" value={upcoming.length} />
        <Stat label="Kelishuv" value={done.length} />
        <Stat label="Jami ishlar" value={data?.length ?? 0} className="hidden sm:block" />
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

function Stat({ label, value, className }: { label: string; value: number; className?: string }) {
  return (
    <div className={`sheet p-4 ${className ?? ""}`}>
      <p className="font-display text-3xl font-semibold text-ink tabular">{value}</p>
      <p className="mt-1 text-sm text-ink-soft">{label}</p>
    </div>
  );
}
