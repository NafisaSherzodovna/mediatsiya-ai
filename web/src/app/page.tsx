"use client";

import {
  ArrowRight,
  Building2,
  ExternalLink,
  FileSignature,
  Lock,
  Mic,
  Scale,
  ScrollText,
  Send,
  Sparkles,
  UserRound,
} from "lucide-react";
import { motion } from "motion/react";
import NumberFlow from "@number-flow/react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { Eyebrow } from "@/components/brand/bits";
import { Logo } from "@/components/brand/logo";
import { CompareBars } from "@/components/case/compare-bars";
import { HeroBridge } from "@/components/landing/hero-bridge";
import { Button } from "@/components/ui/button";
import compareFx from "@/fixtures/compare.json";
import { useUser } from "@/lib/auth";
import { useOrigin } from "@/lib/use-origin";
import { ROLE_HOME } from "@/lib/labels";
import type { Comparison } from "@/lib/types";

const ease = [0.16, 1, 0.3, 1] as const;

const STEPS = [
  { icon: Mic, title: "Yozing yoki gapiring", text: "Nizoni oʻz soʻzingiz bilan, oʻzbekcha yoki ruscha aytib bering." },
  { icon: Sparkles, title: "AI tahlil qiladi", text: "Nizo turini aniqlaydi, sud va mediatsiyani vaqt va pul boʻyicha taqqoslaydi." },
  { icon: Send, title: "Xushmuomala taklif", text: "Ikkinchi tomonga betaraf, hujumsiz taklif yoziladi va Telegram orqali yuboriladi." },
  { icon: FileSignature, title: "Mediator bilan kelishuv", text: "Reyestrdagi mediator sessiya oʻtkazadi, AI kelishuv loyihasini tayyorlaydi." },
];

const ROLES = [
  { icon: UserRound, title: "Fuqaro va biznes", text: "Sudga bormasdan, bir necha kunda va arzonroq. Munosabat buzilmaydi." },
  { icon: Scale, title: "Mediator", text: "Tayyor mijoz oqimi va AI tayyorlagan 1 sahifalik maʼlumotnoma. Sessiya qisqaradi." },
  { icon: Building2, title: "Adliya vazirligi", text: "Mediatsiya boʻyicha jonli statistika: hudud, nizo turi, kelishuv foizi." },
];

const FACTS = [
  {
    from: 4800,
    to: 7200,
    suffix: "ta",
    label: "ish mediatsiya bilan hal qilingan: 2021 → 2024 (+50 %)",
    source: { title: "gov.uz", url: "https://gov.uz/en/news/view/76434" },
  },
  {
    from: 0,
    to: 6200,
    suffix: "+",
    label: "ish 2024-yilda mediativ kelishuv tufayli suddan qaytarib olingan",
    source: {
      title: "Kun.uz, 2025",
      url: "https://kun.uz/en/news/2025/09/30/faster-cheaper-and-more-effective-mediation-gains-ground-in-uzbekistans-justice-system",
    },
  },
  {
    from: 0,
    to: 100,
    suffix: "%",
    label: "davlat boji qaytariladi, agar nizo mediatsiya bilan hal boʻlsa",
    source: {
      title: "Kun.uz, 2025",
      url: "https://kun.uz/en/news/2025/09/30/faster-cheaper-and-more-effective-mediation-gains-ground-in-uzbekistans-justice-system",
    },
  },
];


export default function Landing() {
  const { user } = useUser();
  const origin = useOrigin();
  const start = user ? (user.role === "claimant" ? "/murojaat" : ROLE_HOME[user.role]) : "/kirish?next=/murojaat";

  return (
    <div className="flex flex-1 flex-col overflow-x-clip">
      <header className="sticky top-0 z-30 border-b border-transparent bg-paper/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-6 px-4">
          <Logo />
          <nav className="ml-6 hidden gap-1 text-sm font-medium text-ink-soft md:flex">
            <a href="#qanday" className="rounded-lg px-3 py-2 hover:bg-ink-wash hover:text-ink">
              Qanday ishlaydi
            </a>
            <a href="#taqqoslash" className="rounded-lg px-3 py-2 hover:bg-ink-wash hover:text-ink">
              Sud va mediatsiya
            </a>
            <a href="#raqamlar" className="rounded-lg px-3 py-2 hover:bg-ink-wash hover:text-ink">
              Raqamlar
            </a>
          </nav>
          <div className="ml-auto flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={user ? ROLE_HOME[user.role] : "/kirish"}>{user ? "Kabinet" : "Kirish"}</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 pt-8 pb-16 sm:pt-14 lg:grid-cols-[1.05fr_1fr] lg:pb-24">
        <div>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }}>
            <Eyebrow>Onlayn mediatsiya platformasi</Eyebrow>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05, ease }}
            className="mt-4 text-[2.35rem] leading-[1.08] font-semibold text-ink sm:text-[3.4rem]"
          >
            Nizoni sudsiz, <span className="text-accord">bir necha kunda</span> hal qiling
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12, ease }}
            className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft"
          >
            Yozing yoki gapiring — AI nizoni tahlil qiladi, sud bilan taqqoslaydi, ikkinchi tomonga xushmuomala taklif yozadi va
            mediator bilan kelishuvgacha olib boradi.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease }}
            className="mt-8 flex flex-wrap gap-3"
          >
            <Button asChild size="lg" variant="accord">
              <Link href={start}>
                Murojaat qilish <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="#qanday">Qanday ishlaydi</a>
            </Button>
          </motion.div>
          <motion.ul
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45, duration: 0.6 }}
            className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-soft"
          >
            <li className="flex items-center gap-1.5">
              <ScrollText className="size-4 text-accord" /> «Mediatsiya toʻgʻrisida»gi Qonun asosida
            </li>
            <li className="flex items-center gap-1.5">
              <Scale className="size-4 text-accord" /> Reyestrdagi mediatorlar
            </li>
            <li className="flex items-center gap-1.5">
              <Lock className="size-4 text-accord" /> Maxfiy
            </li>
          </motion.ul>
        </div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.15, ease }}>
          <HeroBridge />
        </motion.div>
      </section>

      {/* How it works */}
      <section id="qanday" className="scroll-mt-20 border-y border-rule/70 bg-white/60">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:py-20">
          <Eyebrow>Qanday ishlaydi</Eyebrow>
          <h2 className="mt-3 max-w-2xl text-3xl font-semibold text-ink sm:text-4xl">Birinchi murojaatdan imzolangan kelishuvgacha</h2>
          <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <motion.li
                key={s.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.08, ease }}
                className="sheet relative p-5"
              >
                <span className="font-display text-sm font-semibold text-accord">0{i + 1}</span>
                <span className="mt-3 grid size-11 place-items-center rounded-xl bg-accord-tint text-accord">
                  <s.icon className="size-5" />
                </span>
                <h3 className="mt-4 text-lg font-semibold text-ink">{s.title}</h3>
                <p className="mt-1.5 text-[0.95rem] leading-relaxed text-ink-soft">{s.text}</p>
              </motion.li>
            ))}
          </ol>
          <p className="mt-6 text-sm text-ink-soft">
            AI mediatorning oʻrnini bosmaydi: yakuniy qarorni har doim tomonlar va inson-mediator qabul qiladi.
          </p>
        </div>
      </section>

      {/* Court vs mediation */}
      <section id="taqqoslash" className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-16 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <Eyebrow>Sud va mediatsiya</Eyebrow>
            <h2 className="mt-3 text-3xl font-semibold text-ink sm:text-4xl">Bir xil nizo — ikki xil yoʻl</h2>
            <p className="mt-4 text-lg leading-relaxed text-ink-soft">
              9 million soʻmlik ijara qarzi misolida. Platforma har bir murojaat uchun shu taqqoslashni avtomatik tuzadi.
            </p>
            <p className="mt-3 text-sm text-ink-soft">Raqamlar taxminiy, manbalari koʻrsatiladi.</p>
          </div>
          <CompareBars data={compareFx as Comparison} />
        </div>
      </section>

      {/* Numbers */}
      <section id="raqamlar" className="scroll-mt-20 bg-ink text-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:py-20">
          <p className="text-xs font-semibold tracking-[0.14em] text-[#7fd1c7] uppercase">Raqamlar</p>
          <h2 className="mt-3 max-w-3xl text-3xl font-semibold sm:text-4xl">Mediatsiya oʻsmoqda — lekin uni hali koʻpchilik bilmaydi</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {FACTS.map((f, i) => (
              <Fact key={f.label} {...f} delay={i * 0.1} />
            ))}
          </div>
          <p className="mt-8 max-w-3xl text-[0.95rem] leading-relaxed text-white/70">
            Bugun mediatsiya natijalari boʻyicha alohida statistika yuritilmaydi (
            <a
              className="underline decoration-white/40 hover:decoration-white"
              href="https://www.ebrd.com/content/dam/ebrd_dxp/assets/pdfs/legal-reform/dispute-resolution/country-reports/country%20report%20uzbekistan.pdf"
              target="_blank"
              rel="noreferrer"
            >
              EBRD
            </a>
            ). Platforma uni real vaqtda beradi.
          </p>
        </div>
      </section>

      {/* Roles */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:py-20">
        <Eyebrow>Kim uchun</Eyebrow>
        <h2 className="mt-3 text-3xl font-semibold text-ink sm:text-4xl">Uch tomon — bitta platforma</h2>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {ROLES.map((r, i) => (
            <motion.div
              key={r.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.08, ease }}
              className="sheet p-6"
            >
              <span className="grid size-11 place-items-center rounded-xl bg-seal-tint text-seal">
                <r.icon className="size-5" />
              </span>
              <h3 className="mt-4 text-xl font-semibold text-ink">{r.title}</h3>
              <p className="mt-2 leading-relaxed text-ink-soft">{r.text}</p>
            </motion.div>
          ))}
        </div>

        <div className="sheet mt-12 flex flex-col items-center gap-6 p-6 sm:flex-row sm:p-8">
          <div className="rounded-2xl border border-rule bg-white p-3">
            {origin ? <QRCodeSVG value={origin} size={148} fgColor="#1b2a4a" level="M" /> : <div className="size-[148px]" />}
          </div>
          <div className="text-center sm:text-left">
            <h3 className="text-2xl font-semibold text-ink">Telefoningizda sinab koʻring</h3>
            <p className="mt-2 max-w-md text-ink-soft">QR kodni skanerlang va demo hisob bilan bir daqiqada murojaat yuboring.</p>
            <Button asChild size="lg" variant="accord" className="mt-4">
              <Link href={start}>
                Murojaat qilish <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="mt-auto border-t border-rule/70">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-ink-soft sm:flex-row sm:items-center sm:justify-between">
          <Logo />
          <p>Xakaton demosi. Koʻrsatilgan ishlar va mediatorlar — demo maʼlumotlar.</p>
        </div>
      </footer>
    </div>
  );
}

function Fact({
  from,
  to,
  suffix,
  label,
  source,
  delay,
}: {
  from: number;
  to: number;
  suffix: string;
  label: string;
  source: { title: string; url: string };
  delay: number;
}) {
  const [value, setValue] = useState(from);
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      onViewportEnter={() => setTimeout(() => setValue(to), 250 + delay * 1000)}
      transition={{ duration: 0.5, delay, ease }}
      className="rounded-2xl border border-white/10 bg-white/[0.04] p-6"
    >
      <p className="font-display text-5xl font-semibold tabular">
        <NumberFlow value={value} locales="ru-RU" />
        <span className="ml-1 text-3xl text-[#7fd1c7]">{suffix}</span>
      </p>
      <p className="mt-3 leading-relaxed text-white/80">{label}</p>
      <a href={source.url} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1 text-sm text-white/55 hover:text-white">
        Manba: {source.title} <ExternalLink className="size-3.5" />
      </a>
    </motion.div>
  );
}
