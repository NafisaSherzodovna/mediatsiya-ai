"use client";

import { ArrowRight, Building2, Scale, UserRound } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { cn } from "cn";
import { GuillocheRosette } from "@/components/brand/backdrop";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, errorText } from "@/lib/api";
import { saveSession } from "@/lib/auth";
import { ROLE_HOME } from "@/lib/labels";
import type { LoginResponse } from "@/lib/types";

const DEMO = [
  { u: "ariza", p: "ariza123", label: "Murojaatchi", hint: "Aziz Karimov", icon: UserRound },
  { u: "mediator", p: "mediator123", label: "Mediator", hint: "Dilnoza Rahimova", icon: Scale },
  { u: "vazirlik", p: "vazirlik123", label: "Vazirlik", hint: "Statistika paneli", icon: Building2 },
];

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(u = username, p = password) {
    setBusy(true);
    setError(null);
    try {
      const res = await api<LoginResponse>("/auth/login/", { body: { username: u, password: p } });
      saveSession(res);
      const next = params.get("next");
      router.push(next && next.startsWith("/") ? next : ROLE_HOME[res.user.role]);
    } catch (e) {
      setError(errorText(e));
      setBusy(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="sheet w-full max-w-md p-6 sm:p-8"
    >
      <h1 className="text-2xl font-semibold text-ink">Tizimga kirish</h1>
      <p className="mt-1.5 text-ink-soft">Murojaatlaringizni kuzatish uchun hisobingizga kiring.</p>

      <form
        className="mt-6 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="u">Login</Label>
          <Input id="u" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} className="h-12 text-base" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="p">Parol</Label>
          <Input
            id="p"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 text-base"
          />
        </div>
        {error && (
          <p role="alert" className="rounded-lg bg-stop-tint px-3 py-2 text-sm font-medium text-stop">
            {error}
          </p>
        )}
        <Button type="submit" size="lg" className="w-full" disabled={busy || !username || !password}>
          {busy ? "Kirilmoqda…" : "Kirish"}
          {!busy && <ArrowRight className="size-4" />}
        </Button>
      </form>

      <div className="mt-7">
        <p className="mb-3 text-xs font-semibold tracking-[0.12em] text-ink-soft uppercase">Demo hisoblar</p>
        <div className="grid gap-2">
          {DEMO.map((d) => (
            <button
              key={d.u}
              type="button"
              disabled={busy}
              onClick={() => {
                setUsername(d.u);
                setPassword(d.p);
                void submit(d.u, d.p);
              }}
              className={cn(
                "group flex items-center gap-3 rounded-xl border border-rule bg-white px-3.5 py-3 text-left transition-all",
                "hover:-translate-y-px hover:border-accord/50 hover:shadow-[0_8px_20px_-14px_rgb(15_118_110/0.6)]",
              )}
            >
              <span className="grid size-10 place-items-center rounded-lg bg-accord-tint text-accord">
                <d.icon className="size-5" />
              </span>
              <span className="flex-1">
                <span className="block font-semibold text-ink">{d.label}</span>
                <span className="block text-sm text-ink-soft">
                  {d.hint} · <span className="font-mono text-xs">{d.u}</span>
                </span>
              </span>
              <ArrowRight className="size-4 text-ink-soft transition-transform group-hover:translate-x-0.5" />
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default function KirishPage() {
  return (
    <main className="relative isolate flex flex-1 flex-col items-center overflow-x-clip px-4 py-8 sm:py-14">
      <GuillocheRosette className="absolute top-40 left-1/2 -z-10 size-[900px] -translate-x-1/2 opacity-60 [mask-image:radial-gradient(closest-side,black_45%,transparent)]" />
      <Link href="/" className="mb-8">
        <Logo />
      </Link>
      <Suspense>
        <LoginForm />
      </Suspense>
      <p className="mt-6 text-center text-sm text-ink-soft">Ikkinchi tomon hisobsiz, taklif havolasi orqali javob beradi.</p>
    </main>
  );
}
