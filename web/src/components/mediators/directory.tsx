"use client";

import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { AREA_LABEL, AREAS, LANG_LABEL, LANGS, REGION_LABEL, REGIONS } from "@/lib/labels";
import type { Area, Mediator, MediatorPage } from "@/lib/types";
import { MediatorCard } from "./booking";

const SELECT = "h-10 rounded-lg border border-input bg-white px-2.5 text-sm text-ink";

/** Every approved mediator in the registry, filtered and paged on the server. */
export function MediatorDirectory({ pickedId, onPick, pageSize = 8, defaultArea = "" }: { pickedId?: string; onPick: (m: Mediator) => void; pageSize?: number; defaultArea?: Area | "" }) {
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const [area, setArea] = useState<string>(defaultArea);
  const [region, setRegion] = useState("");
  const [lang, setLang] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => setQuery(q.trim()), 300); // debounce typing
    return () => clearTimeout(t);
  }, [q]);

  const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
  if (query) params.set("q", query);
  if (area) params.set("area", area);
  if (region) params.set("region", region);
  if (lang) params.set("lang", lang);
  const { data } = useSWR<MediatorPage>(`/mediators/?${params}`, (p: string) => api<MediatorPage>(p), { keepPreviousData: true });
  const filter = (set: (v: string) => void) => (e: React.ChangeEvent<HTMLSelectElement>) => {
    set(e.target.value);
    setPage(1);
  };

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto_auto]">
        <label className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-soft" />
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Ism yoki reyestr raqami"
            aria-label="Mediatorni qidirish"
            className="h-10 w-full rounded-lg border border-input bg-white pr-3 pl-9 text-sm text-ink outline-none focus:border-accord"
          />
        </label>
        <select value={area} onChange={filter(setArea)} aria-label="Soha" className={SELECT}>
          <option value="">Barcha sohalar</option>
          {AREAS.map((a) => (
            <option key={a} value={a}>
              {AREA_LABEL[a]}
            </option>
          ))}
        </select>
        <select value={region} onChange={filter(setRegion)} aria-label="Hudud" className={SELECT}>
          <option value="">Barcha hududlar</option>
          {REGIONS.map((r) => (
            <option key={r} value={r}>
              {REGION_LABEL[r]}
            </option>
          ))}
        </select>
        <select value={lang} onChange={filter(setLang)} aria-label="Til" className={SELECT}>
          <option value="">Barcha tillar</option>
          {LANGS.map((l) => (
            <option key={l} value={l}>
              {LANG_LABEL[l]}
            </option>
          ))}
        </select>
      </div>

      <p className="text-sm text-ink-soft">{data ? `${data.count} ta mediator` : "Yuklanmoqda…"}</p>
      <div className="grid gap-2.5">
        {!data
          ? [0, 1, 2].map((i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted" />)
          : data.results.map((m) => <MediatorCard key={m.id} m={m} selected={pickedId === m.id} onSelect={() => onPick(m)} />)}
        {data?.count === 0 && <p className="rounded-xl bg-muted px-4 py-3 text-sm text-ink-soft">Bu filtrlar boʻyicha mediator topilmadi.</p>}
      </div>

      {data && data.pages > 1 && (
        <nav aria-label="Sahifalar" className="flex items-center justify-between gap-2 pt-1">
          <Button variant="outline" size="sm" disabled={data.page <= 1} onClick={() => setPage(data.page - 1)}>
            <ChevronLeft className="size-4" /> Oldingi
          </Button>
          <span className="text-sm font-medium text-ink tabular sm:hidden">
            {data.page} / {data.pages}
          </span>
          <span className="hidden flex-wrap justify-center gap-1 sm:flex">
            {Array.from({ length: data.pages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                aria-current={n === data.page ? "page" : undefined}
                onClick={() => setPage(n)}
                className={`size-8 rounded-lg text-sm font-medium ${n === data.page ? "bg-ink text-white" : "text-ink hover:bg-ink-wash"}`}
              >
                {n}
              </button>
            ))}
          </span>
          <Button variant="outline" size="sm" disabled={data.page >= data.pages} onClick={() => setPage(data.page + 1)}>
            Keyingi <ChevronRight className="size-4" />
          </Button>
        </nav>
      )}
    </div>
  );
}
