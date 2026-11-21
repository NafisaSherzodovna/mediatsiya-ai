"use client";

import { ArrowRight, FilePlus2, Inbox, MailOpen } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { CaseCard } from "@/components/case/parts";
import { AppShell } from "@/components/shell/app-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, errorText } from "@/lib/api";
import { DISPUTE_LABEL, STATUS_LABEL } from "@/lib/labels";
import type { Case, Me, MyInvite } from "@/lib/types";

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
      <Invites />
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

/** Invitations where someone named this user's phone as the other party. */
function Invites() {
  const { data: me, mutate: refreshMe } = useSWR<Me>("/auth/me/", (p: string) => api<Me>(p));
  const { data, mutate } = useSWR<MyInvite[]>(me?.phone ? "/my-invites/" : null, (p: string) => api<MyInvite[]>(p), { refreshInterval: 10000 });
  const [phone, setPhone] = useState("+998 ");
  const [busy, setBusy] = useState(false);

  async function savePhone() {
    setBusy(true);
    try {
      await refreshMe(await api<Me>("/auth/me/", { method: "PATCH", body: { phone } }), { revalidate: false });
      void mutate();
      toast.success("Telefon raqami saqlandi");
    } catch (e) {
      toast.error(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  if (!me) return null;
  if (!me.phone) {
    return (
      <section className="sheet mb-6 p-5">
        <h2 className="flex items-center gap-2 font-semibold text-ink">
          <MailOpen className="size-5 text-accord" /> Sizga kelgan takliflar
        </h2>
        <p className="mt-1 text-sm text-ink-soft">Kimdir sizni ikkinchi tomon sifatida koʻrsatgan boʻlsa, taklif shu yerda chiqadi. Buning uchun telefon raqamingizni kiriting.</p>
        <form
          className="mt-3 flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void savePhone();
          }}
        >
          <Input type="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="h-11 max-w-xs text-base" aria-label="Telefon raqami" />
          <Button type="submit" variant="outline" disabled={busy || phone.replace(/\D/g, "").length < 9}>
            Saqlash
          </Button>
        </form>
      </section>
    );
  }
  if (!data?.length) return null;
  return (
    <section className="mb-8">
      <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-ink">
        <MailOpen className="size-5 text-accord" /> Sizga kelgan takliflar
      </h2>
      <div className="grid gap-3">
        {data.map((x) => (
          <Link
            key={x.code}
            href={`/taklif/${x.invite_token}`}
            className="sheet flex items-center justify-between gap-3 p-4 transition-shadow hover:shadow-[var(--shadow-sheet)]"
          >
            <span className="min-w-0">
              <span className="block font-mono text-xs text-ink-soft">{x.code}</span>
              <span className="block font-semibold text-ink">
                {x.claimant_name} · {DISPUTE_LABEL[x.dispute_type]}
              </span>
              <span className="block text-sm text-ink-soft">{STATUS_LABEL[x.status]}</span>
            </span>
            <span className="flex shrink-0 items-center gap-1 text-sm font-semibold text-accord">
              {x.status === "invited" ? "Javob berish" : "Ochish"} <ArrowRight className="size-4" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
