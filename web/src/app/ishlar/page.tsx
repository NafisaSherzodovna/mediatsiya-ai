"use client";

import { FilePlus2, Inbox } from "lucide-react";
import Link from "next/link";
import useSWR from "swr";
import { CaseCard } from "@/components/case/parts";
import { AppShell } from "@/components/shell/app-header";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { Case } from "@/lib/types";

export default function IshlarPage() {
  return (
    <AppShell roles={["claimant"]}>
      <List />
    </AppShell>
  );
}

function List() {
  const { data, error } = useSWR<Case[]>("/cases/", (p: string) => api<Case[]>(p), { refreshInterval: 5000 });
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-[0.14em] text-accord uppercase">Kabinet</p>
          <h1 className="mt-1 text-[2rem] font-semibold text-ink">Ishlarim</h1>
        </div>
        <Button asChild variant="accord">
          <Link href="/murojaat">
            <FilePlus2 className="size-4" /> Yangi murojaat
          </Link>
        </Button>
      </div>
      {error && <p className="text-stop">Ishlarni yuklab boʻlmadi. Sahifani yangilang.</p>}
      {!data && !error && (
        <div className="grid gap-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      )}
      {data && data.length === 0 && (
        <div className="sheet flex flex-col items-center gap-3 p-10 text-center">
          <Inbox className="size-10 text-ink-soft" />
          <p className="text-lg font-semibold text-ink">Hali murojaat yoʻq</p>
          <p className="max-w-sm text-ink-soft">Nizoingizni yozing yoki aytib bering — AI qolganida yordam beradi.</p>
          <Button asChild variant="accord" className="mt-2">
            <Link href="/murojaat">Murojaat qilish</Link>
          </Button>
        </div>
      )}
      <div className="grid gap-3">
        {data?.map((c, i) => (
          <CaseCard key={c.id} item={c} href={`/ishlar/${c.id}`} index={i} />
        ))}
      </div>
    </div>
  );
}
