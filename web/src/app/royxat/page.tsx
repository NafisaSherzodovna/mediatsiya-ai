"use client";

import { ArrowRight, Scale, UserRound } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { cn } from "cn";
import { Logo } from "@/components/brand/logo";
import { HomeButton } from "@/components/shell/home-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, errorText } from "@/lib/api";
import { saveSession } from "@/lib/auth";
import { AREA_LABEL, AREAS, homeFor, LANG_LABEL, LANGS, REGION_LABEL, REGIONS } from "@/lib/labels";
import type { Area, Lang, LoginResponse, Region } from "@/lib/types";

type Kind = "claimant" | "mediator";
const KINDS = [
  { v: "claimant" as const, label: "Murojaatchi", hint: "Nizoni hal qilmoqchiman", icon: UserRound },
  { v: "mediator" as const, label: "Mediator", hint: "Reyestrdagi mediatorman", icon: Scale },
];
const today = () => new Date().toISOString().slice(0, 10);

function toggle<T>(list: T[], v: T): T[] {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
}

function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [kind, setKind] = useState<Kind>(params.get("rol") === "mediator" ? "mediator" : "claimant");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("+998 ");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [registryNo, setRegistryNo] = useState("");
  const [registryDate, setRegistryDate] = useState("");
  const [areas, setAreas] = useState<Area[]>([]);
  const [languages, setLanguages] = useState<Lang[]>(["uz"]);
  const [region, setRegion] = useState<Region>("toshkent-sh");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [certNo, setCertNo] = useState("");
  const [certDate, setCertDate] = useState("");
  const [declared, setDeclared] = useState(false);
  const [price, setPrice] = useState("300000");
  const [years, setYears] = useState("");
  const [bio, setBio] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isMediator = kind === "mediator";
  const ready =
    fullName.trim().length >= 3 &&
    phone.replace(/\D/g, "").length >= 9 &&
    /^[A-Za-z0-9_.]{3,30}$/.test(username) &&
    password.length >= 6 &&
    (!isMediator ||
      (registryNo.trim() &&
        registryDate &&
        areas.length > 0 &&
        languages.length > 0 &&
        address.trim().length >= 5 &&
        /^\S+@\S+\.\S+$/.test(email) &&
        certNo.trim() &&
        certDate &&
        Number(price) >= 50_000 &&
        years !== "" &&
        declared));

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const res = await api<LoginResponse>("/auth/register/", {
        body: {
          role: kind,
          username,
          password,
          full_name: fullName,
          phone,
          ...(isMediator && {
            mediator: {
              registry_no: registryNo,
              registry_date: registryDate,
              areas,
              languages,
              region,
              address,
              email,
              certificate_no: certNo,
              certificate_date: certDate,
              price_uzs: Number(price),
              years: Number(years),
              bio,
              declaration: declared,
            },
          }),
        },
      });
      saveSession(res);
      router.push(homeFor(res.user.role, params.get("next")));
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
      className="sheet w-full max-w-lg p-6 sm:p-8"
    >
      <h1 className="text-2xl font-semibold text-ink">Roʻyxatdan oʻtish</h1>
      <p className="mt-1.5 text-ink-soft">Bir daqiqada hisob oching.</p>

      <div role="radiogroup" aria-label="Kim sifatida" className="mt-6 grid grid-cols-2 gap-2">
        {KINDS.map((k) => (
          <button
            key={k.v}
            type="button"
            role="radio"
            aria-checked={kind === k.v}
            onClick={() => setKind(k.v)}
            className={cn(
              "flex items-center gap-3 rounded-xl border bg-white px-3.5 py-3 text-left transition-all",
              kind === k.v ? "border-accord ring-2 ring-accord/25" : "border-rule hover:border-accord/40",
            )}
          >
            <span className="hidden size-10 shrink-0 place-items-center rounded-lg bg-accord-tint text-accord sm:grid">
              <k.icon className="size-5" />
            </span>
            <span className="min-w-0">
              <span className="block font-semibold text-ink">{k.label}</span>
              <span className="block truncate text-xs text-ink-soft">{k.hint}</span>
            </span>
          </button>
        ))}
      </div>

      <form
        className="mt-6 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (ready) void submit();
        }}
      >
        <Field id="name" label="F.I.Sh.">
          <Input id="name" autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="h-12 text-base" />
        </Field>
        <Field id="phone" label="Telefon">
          <Input id="phone" type="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="h-12 text-base" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2 sm:items-end">
          <Field id="u" label="Login" hint="Lotin harf, raqam, _ yoki .">
            <Input id="u" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value.trim())} className="h-12 text-base" />
          </Field>
          <Field id="p" label="Parol" hint="Kamida 6 belgi">
            <Input id="p" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 text-base" />
          </Field>
        </div>

        {isMediator && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 border-t border-rule pt-4">
            <p className="text-sm text-ink-soft">
              Platformada faqat Adliya vazirligi Mediatorlar reyestriga kiritilgan mediatorlar ishlaydi (Qonun, 9³ va 12-moddalar). Quyidagi maʼlumotlar reyestrdagi
              yozuv bilan solishtiriladi va administrator tasdiqlaydi.
            </p>
            <div className="grid gap-4 sm:grid-cols-2 sm:items-end">
              <Field id="reg" label="Reyestr raqami">
                <Input id="reg" placeholder="MR-1234" value={registryNo} onChange={(e) => setRegistryNo(e.target.value)} className="h-12 text-base" />
              </Field>
              <Field id="regdate" label="Reyestrga kiritilgan sana">
                <Input id="regdate" type="date" max={today()} value={registryDate} onChange={(e) => setRegistryDate(e.target.value)} className="h-12 text-base" />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 sm:items-end">
              <Field id="region" label="Hudud">
                <select
                  id="region"
                  value={region}
                  onChange={(e) => setRegion(e.target.value as Region)}
                  className="h-12 w-full rounded-lg border border-input bg-transparent px-2.5 text-base text-ink"
                >
                  {REGIONS.map((r) => (
                    <option key={r} value={r}>
                      {REGION_LABEL[r]}
                    </option>
                  ))}
                </select>
              </Field>
              <Field id="email" label="Elektron pochta">
                <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value.trim())} className="h-12 text-base" />
              </Field>
            </div>
            <Field id="addr" label="Joylashgan yeri" hint="Mediator bilan aloqa uchun manzil: shahar, mahalla, koʻcha, uy">
              <Input id="addr" autoComplete="street-address" value={address} onChange={(e) => setAddress(e.target.value)} className="h-12 text-base" />
            </Field>
            <Chips label="Ixtisoslashgan mediatsiya sohasi" options={AREAS.map((a) => ({ v: a, l: AREA_LABEL[a] }))} value={areas} onToggle={(v) => setAreas((s) => toggle(s, v))} />
            <Chips label="Mediatsiyani oʻtkaza oladigan tillar" options={LANGS.map((l) => ({ v: l, l: LANG_LABEL[l] }))} value={languages} onToggle={(v) => setLanguages((s) => toggle(s, v))} />
            <div className="grid gap-4 sm:grid-cols-2 sm:items-end">
              <Field id="cert" label="Oʻquv kursi hujjati №">
                <Input id="cert" placeholder="M 000034" value={certNo} onChange={(e) => setCertNo(e.target.value)} className="h-12 text-base" />
              </Field>
              <Field id="certdate" label="Hujjat sanasi">
                <Input id="certdate" type="date" max={today()} value={certDate} onChange={(e) => setCertDate(e.target.value)} className="h-12 text-base" />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 sm:items-end">
              <Field id="price" label="Bir sessiya narxi, soʻm">
                <Input id="price" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))} className="h-12 text-base tabular" />
              </Field>
              <Field id="years" label="Tajriba, yil">
                <Input id="years" inputMode="numeric" value={years} onChange={(e) => setYears(e.target.value.replace(/\D/g, "").slice(0, 2))} className="h-12 text-base tabular" />
              </Field>
            </div>
            <Field id="bio" label="Qoʻshimcha maʼlumot (ixtiyoriy)">
              <textarea
                id="bio"
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 1000))}
                className="w-full resize-none rounded-lg border border-input bg-transparent px-2.5 py-2 text-base text-ink outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </Field>
            <label className="flex items-start gap-2.5 rounded-xl bg-muted px-3.5 py-3 text-sm leading-relaxed text-ink">
              <input type="checkbox" checked={declared} onChange={(e) => setDeclared(e.target.checked)} className="mt-1 size-4 shrink-0 accent-[var(--accord)]" />
              <span>
                Oliy maʼlumotga egaman, maxsus oʻquv kursidan oʻtganman, davlat xizmatida emasman (pedagogik, ilmiy, ijodiy va notarial faoliyat bundan
                mustasno), sudlanganligim yoʻq va muomalaga layoqatliman. <span className="text-ink-soft">(«Mediatsiya toʻgʻrisida»gi Qonun, 12-modda)</span>
              </span>
            </label>
          </motion.div>
        )}

        {error && (
          <p role="alert" className="rounded-lg bg-stop-tint px-3 py-2 text-sm font-medium text-stop">
            {error}
          </p>
        )}
        <Button type="submit" size="lg" className="w-full" disabled={busy || !ready}>
          {busy ? "Yuborilmoqda…" : isMediator ? "Ariza yuborish" : "Roʻyxatdan oʻtish"}
          {!busy && <ArrowRight className="size-4" />}
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-ink-soft">
        Hisobingiz bormi?{" "}
        <Link href={`/kirish${params.get("next") ? `?next=${encodeURIComponent(params.get("next")!)}` : ""}`} className="font-semibold text-accord hover:underline">
          Kirish
        </Link>
      </p>
    </motion.div>
  );
}

function Field({ id, label, hint, children }: { id: string; label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-ink-soft">{hint}</p>}
    </div>
  );
}

function Chips<T extends string>({ label, options, value, onToggle }: { label: string; options: { v: T; l: string }[]; value: T[]; onToggle: (v: T) => void }) {
  return (
    <fieldset className="space-y-1.5">
      <legend className="mb-1.5 text-sm font-medium text-ink">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.v}
            type="button"
            aria-pressed={value.includes(o.v)}
            onClick={() => onToggle(o.v)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
              value.includes(o.v) ? "border-ink bg-ink text-white" : "border-rule bg-white text-ink hover:bg-ink-wash",
            )}
          >
            {o.l}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export default function RoyxatPage() {
  return (
    <main className="relative isolate flex flex-1 flex-col items-center overflow-x-clip px-4 py-6 sm:py-10">
      <HomeButton />
      <Link href="/" className="mb-8">
        <Logo />
      </Link>
      <Suspense>
        <RegisterForm />
      </Suspense>
    </main>
  );
}
