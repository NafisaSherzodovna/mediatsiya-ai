"use client";

import { Building2, KeyRound, Mic, RotateCcw, Scale, UserRound, Wand2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { api, errorText, isMock } from "@/lib/api";
import { saveSession } from "@/lib/auth";
import { setDemoPrefill } from "@/lib/demo";
import { ROLE_HOME } from "@/lib/labels";
import type { LoginResponse } from "@/lib/types";

const KEY = "ma.demo.key";

const ACCOUNTS = [
  { u: "ariza", p: "ariza123", label: "Murojaatchi", icon: UserRound },
  { u: "mediator", p: "mediator123", label: "Mediator", icon: Scale },
  { u: "vazirlik", p: "vazirlik123", label: "Vazirlik", icon: Building2 },
];

/** Unlisted stage helper page for the pitch. */
export default function DemoPage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function loginAs(u: string, p: string, next?: string) {
    setBusy(true);
    try {
      const res = await api<LoginResponse>("/auth/login/", { body: { username: u, password: p } });
      saveSession(res);
      router.push(next ?? ROLE_HOME[res.user.role]);
    } catch (e) {
      toast.error(errorText(e));
      setBusy(false);
    }
  }

  async function reset() {
    let key = "";
    try {
      key = window.localStorage.getItem(KEY) ?? "";
    } catch {
      /* ignore */
    }
    if (!isMock() && !key) {
      key = window.prompt("Demo kaliti (DEMO_RESET_KEY):") ?? "";
      if (!key) return;
    }
    setBusy(true);
    try {
      if (isMock()) {
        await api("/demo/reset/", { method: "POST" });
      } else {
        const res = await fetch("/api/demo/reset/", { method: "POST", headers: { "X-Demo-Key": key } });
        if (!res.ok) throw new Error("Kalit notoʻgʻri yoki server javob bermadi");
        try {
          window.localStorage.setItem(KEY, key);
        } catch {
          /* ignore */
        }
      }
      toast.success("Demo holati tiklandi");
    } catch (e) {
      try {
        window.localStorage.removeItem(KEY);
      } catch {
        /* ignore */
      }
      toast.error(e instanceof Error ? e.message : errorText(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10">
      <Logo />
      <h1 className="mt-6 text-3xl font-semibold text-ink">Sahna yordamchisi</h1>
      <p className="mt-1 text-ink-soft">Taqdimot paytida tez oʻtish uchun. Rejim: {isMock() ? "mock (backendsiz)" : "jonli backend"}.</p>

      <section className="sheet mt-6 space-y-3 p-5">
        <h2 className="font-semibold text-ink">Demo hisoblar</h2>
        <div className="grid gap-2 sm:grid-cols-3">
          {ACCOUNTS.map((a) => (
            <Button key={a.u} variant="outline" disabled={busy} onClick={() => loginAs(a.u, a.p)}>
              <a.icon className="size-4" /> {a.label}
            </Button>
          ))}
        </div>
      </section>

      <section className="sheet mt-4 space-y-3 p-5">
        <h2 className="font-semibold text-ink">Stsenariy yorliqlari</h2>
        <Button
          variant="accord"
          className="w-full justify-start"
          disabled={busy}
          onClick={() => {
            setDemoPrefill("voice");
            void loginAs("ariza", "ariza123", "/murojaat");
          }}
        >
          <Mic className="size-4" /> Namuna ovoz bilan murojaat (mikrofonsiz)
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={() => {
            setDemoPrefill("answers");
            toast.success("Keyingi «Rozi boʻlish»da javoblar avtomatik toʻladi");
          }}
        >
          <Wand2 className="size-4" /> Ikkinchi tomon javoblarini avtomatik toʻldirish
        </Button>
        <Button asChild variant="outline" className="w-full justify-start">
          <Link href="/admin/" target="_blank">
            <KeyRound className="size-4" /> Operator paneli (Django admin)
          </Link>
        </Button>
      </section>

      <section className="sheet mt-4 space-y-3 p-5">
        <h2 className="font-semibold text-ink">Maʼlumotlar</h2>
        <p className="text-sm text-ink-soft">278 ta demo ish, 42 mediator va ikkita koʻrgazmali ish (MD-2026-0041, MD-2026-0042) qayta yaratiladi.</p>
        <Button variant="outline" disabled={busy} onClick={reset}>
          <RotateCcw className="size-4" /> Demo holatini tiklash
        </Button>
      </section>
    </main>
  );
}
