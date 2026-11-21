"use client";

import NumberFlow from "@number-flow/react";
import { Activity, Clock, FileCheck2, ShieldCheck, Users, Wallet } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, LabelList, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import useSWR from "swr";
import { api } from "@/lib/api";
import { monthUz, percent } from "@/lib/format";
import { DISPUTE_LABEL, REGION_LABEL } from "@/lib/labels";
import type { Stats } from "@/lib/types";

// Validated with the dataviz skill's validator (light surface): all six checks pass.
const C_CASES = "#2e4fa3";
const C_AGREED = "#0d9488";
const C_REST = "#d5d9e2";
const GRID = "#ece8de";
const AXIS = "#55607a";

/** Public live statistics for the landing page (aggregated, no personal data). */
export function LiveStats() {
  const { data } = useSWR<Stats>("/stats/", (p: string) => api<Stats>(p), { refreshInterval: 10000 });
  if (!data) return <div className="h-[640px] animate-pulse rounded-2xl bg-muted" />;
  const t = data.totals;
  const tiles = [
    { icon: FileCheck2, label: "Murojaatlar", value: t.cases, fmt: {} },
    { icon: ShieldCheck, label: `Kelishuv bilan tugagan · ${percent(t.agreement_rate)}`, value: t.agreed, fmt: {}, accent: true },
    { icon: Clock, label: "Oʻrtacha hal qilish muddati, kun", value: t.avg_days, fmt: { minimumFractionDigits: 1, maximumFractionDigits: 1 } },
    { icon: Wallet, label: "Qaytarilgan davlat boji, mln soʻm", value: Math.round(t.refunded_fees_uzs / 100_000) / 10, fmt: { maximumFractionDigits: 1 } },
    { icon: Users, label: "Faol mediatorlar", value: t.mediators_active, fmt: {} },
  ];
  const byType = data.by_type.map((r) => ({ name: DISPUTE_LABEL[r.type], agreed: r.agreed, rest: r.count - r.agreed, count: r.count }));
  const byRegion = [...data.by_region]
    .sort((a, b) => b.count - a.count)
    .map((r) => ({ name: REGION_LABEL[r.region], agreed: r.agreed, rest: r.count - r.agreed, count: r.count }));
  const monthly = data.monthly.map((m) => ({ ...m, label: monthUz(m.month) }));

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-accord uppercase">
            <Activity className="size-4" /> Ochiq statistika
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-ink sm:text-4xl">Platforma raqamlarda — jonli</h2>
          <p className="mt-2 text-ink-soft">2026-yil, barcha hududlar. Maʼlumotlar shaxsiylashtirilmagan, har 10 soniyada yangilanadi.</p>
        </div>
        <span className="rounded-full bg-warn-tint px-3 py-1 text-xs font-semibold text-[#7a4f12]">Demo maʼlumotlar</span>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
        {tiles.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ delay: i * 0.06 }}
            className={`sheet p-4 ${s.accent ? "bg-[linear-gradient(180deg,#fff,var(--accord-tint))]" : ""} ${i === 0 ? "col-span-2 lg:col-span-1" : ""}`}
          >
            <s.icon className="size-5 text-ink-soft" />
            <p className="mt-3 font-display text-[2rem] leading-none font-semibold text-ink tabular">
              <NumberFlow value={s.value} locales="ru-RU" format={s.fmt} />
            </p>
            <p className="mt-2 text-sm leading-snug text-ink-soft">{s.label}</p>
          </motion.div>
        ))}
      </div>

      <section className="sheet mt-6 p-5">
        <ChartHead title="Oylar boʻyicha" legend={[{ c: C_CASES, l: "Murojaatlar" }, { c: C_AGREED, l: "Kelishuv" }]} />
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthly} margin={{ top: 16, right: 104, bottom: 0, left: -12 }}>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis dataKey="label" tick={{ fill: AXIS, fontSize: 12 }} axisLine={{ stroke: GRID }} tickLine={false} />
              <YAxis tick={{ fill: AXIS, fontSize: 12 }} axisLine={false} tickLine={false} width={44} />
              <Tooltip content={<Tip />} cursor={{ stroke: AXIS, strokeDasharray: "3 3" }} />
              <Line isAnimationActive={false} dataKey="cases" name="Murojaatlar" stroke={C_CASES} strokeWidth={2} dot={false} activeDot={{ r: 5, stroke: "#fff", strokeWidth: 2 }}>
                <LabelList content={<EndLabel n={monthly.length} color={C_CASES} text="Murojaatlar" />} />
              </Line>
              <Line isAnimationActive={false} dataKey="agreed" name="Kelishuv" stroke={C_AGREED} strokeWidth={2} dot={false} activeDot={{ r: 5, stroke: "#fff", strokeWidth: 2 }}>
                <LabelList content={<EndLabel n={monthly.length} color={C_AGREED} text="Kelishuv" />} />
              </Line>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-2">
        <section className="sheet p-5">
          <ChartHead title="Nizo turlari" legend={[{ c: C_AGREED, l: "Kelishuv" }, { c: C_REST, l: "Boshqa holat" }]} />
          <StackedBars data={byType} height={byType.length * 40 + 20} />
        </section>
        <section className="sheet p-5">
          <ChartHead title="Hududlar" legend={[{ c: C_AGREED, l: "Kelishuv" }, { c: C_REST, l: "Boshqa holat" }]} />
          <StackedBars data={byRegion} height={byRegion.length * 30 + 20} compact />
          <RegionTable rows={byRegion} />
        </section>
      </div>
      <p className="mt-6 text-sm text-ink-soft">
        Bugun mediatsiya natijalari boʻyicha alohida statistika yuritilmaydi (EBRD hisoboti). Platforma har bir ishni yozib boradi va bu panelni real vaqtda toʻldiradi.
      </p>
    </div>
  );
}

function ChartHead({ title, legend }: { title: string; legend: { c: string; l: string }[] }) {
  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      <div className="flex gap-4 text-sm text-ink-soft">
        {legend.map((x) => (
          <span key={x.l} className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm" style={{ background: x.c }} /> {x.l}
          </span>
        ))}
      </div>
    </div>
  );
}

type Row = { name: string; agreed: number; rest: number; count: number };

function StackedBars({ data, height, compact }: { data: Row[]; height: number; compact?: boolean }) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 40, bottom: 0, left: 0 }} barCategoryGap={compact ? 6 : 10}>
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="name" width={compact ? 128 : 132} tick={{ fill: "#1b2a4a", fontSize: compact ? 12 : 13 }} axisLine={false} tickLine={false} />
          <Tooltip content={<BarTip />} cursor={{ fill: "rgb(27 42 74 / 0.04)" }} />
          <Bar dataKey="agreed" stackId="a" fill={C_AGREED} stroke="#fff" strokeWidth={1} radius={[4, 0, 0, 4]} isAnimationActive={false} />
          <Bar isAnimationActive={false} dataKey="rest" stackId="a" fill={C_REST} stroke="#fff" strokeWidth={1} radius={[0, 4, 4, 0]}>
            <LabelList dataKey="count" position="right" style={{ fill: "#1b2a4a", fontSize: 12, fontWeight: 600 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function RegionTable({ rows }: { rows: Row[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-3 border-t border-rule pt-3">
      <button type="button" onClick={() => setOpen((o) => !o)} className="text-sm font-medium text-ink-soft underline decoration-rule hover:text-ink">
        {open ? "Jadvalni yashirish" : "Jadval koʻrinishida"}
      </button>
      {open && (
        <table className="mt-3 w-full text-sm">
          <thead>
            <tr className="text-left text-ink-soft">
              <th className="py-1.5 font-medium">Hudud</th>
              <th className="py-1.5 text-right font-medium">Ishlar</th>
              <th className="py-1.5 text-right font-medium">Kelishuv</th>
              <th className="py-1.5 text-right font-medium">Ulush</th>
            </tr>
          </thead>
          <tbody className="tabular">
            {rows.map((r) => (
              <tr key={r.name} className="border-t border-rule/70 text-ink">
                <td className="py-1.5">{r.name}</td>
                <td className="py-1.5 text-right">{r.count}</td>
                <td className="py-1.5 text-right">{r.agreed}</td>
                <td className="py-1.5 text-right">{percent(r.agreed / Math.max(1, r.count), 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

type TipProps = { active?: boolean; label?: string; payload?: { name?: string; value?: number; color?: string; stroke?: string }[] };

function Tip({ active, label, payload }: TipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-rule bg-white px-3 py-2 text-sm shadow-[var(--shadow-sheet)]">
      <p className="mb-1 font-semibold text-ink">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="flex items-center gap-2 text-ink">
          <span className="size-2 rounded-full" style={{ background: p.stroke ?? p.color }} />
          {p.name}: <b className="tabular">{p.value}</b>
        </p>
      ))}
    </div>
  );
}

function BarTip({ active, payload }: { active?: boolean; payload?: { payload: Row }[] }) {
  if (!active || !payload?.length) return null;
  const r = payload[0].payload;
  return (
    <div className="rounded-xl border border-rule bg-white px-3 py-2 text-sm shadow-[var(--shadow-sheet)]">
      <p className="font-semibold text-ink">{r.name}</p>
      <p className="text-ink">
        {r.count} ta ish · kelishuv <b>{r.agreed}</b> ({percent(r.agreed / Math.max(1, r.count), 0)})
      </p>
    </div>
  );
}

function EndLabel(props: { n: number; color: string; text: string; index?: number; x?: number | string; y?: number | string; value?: number | string }) {
  const { n, color, text, index, x, y, value } = props;
  if (index !== n - 1) return null;
  return (
    <g>
      <circle cx={Number(x)} cy={Number(y)} r={4} fill={color} stroke="#fff" strokeWidth={2} />
      <text x={Number(x) + 8} y={Number(y) + 4} fontSize={12} fontWeight={600} fill="#1b2a4a">
        {value} {text === "Kelishuv" ? "kelishuv" : "murojaat"}
      </text>
    </g>
  );
}
