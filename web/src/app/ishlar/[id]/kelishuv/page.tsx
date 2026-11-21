"use client";

import { ArrowLeft, FileDown } from "lucide-react";
import Link from "next/link";
import { use } from "react";
import useSWR from "swr";
import { AgreementDoc } from "@/components/case/agreement";
import { AppShell } from "@/components/shell/app-header";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useUser } from "@/lib/auth";
import type { Case } from "@/lib/types";
import { useOrigin } from "@/lib/use-origin";

export default function KelishuvPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <AppShell roles={["claimant", "mediator", "admin"]} wide>
      <Doc id={id} />
    </AppShell>
  );
}

function Doc({ id }: { id: string }) {
  const { data: c } = useSWR<Case>(`/cases/${id}/`, (p: string) => api<Case>(p));
  const origin = useOrigin();
  const { user } = useUser();
  if (!c) return <div className="h-96 animate-pulse rounded-2xl bg-muted" />;
  if (!c.agreement) return <p className="text-ink-soft">Bu ish boʻyicha kelishuv hali tuzilmagan.</p>;
  const back = user?.role === "mediator" ? `/mediator/${c.id}` : `/ishlar/${c.id}`;
  return (
    <div>
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link href={back} className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-ink">
          <ArrowLeft className="size-4" /> Ishga qaytish
        </Link>
        <Button variant="accord" onClick={() => window.print()}>
          <FileDown className="size-4" /> PDF yuklab olish
        </Button>
      </div>
      <AgreementDoc c={c} agreement={c.agreement} qr={`${origin}/ishlar/${c.id}`} />
      <p className="no-print mt-4 text-center text-sm text-ink-soft">Brauzer oynasida «PDF sifatida saqlash»ni tanlang.</p>
    </div>
  );
}
