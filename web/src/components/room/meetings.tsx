"use client";

import { CalendarCheck2, CalendarClock, CalendarPlus, CalendarX2, MapPin, Video, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { errorText } from "@/lib/api";
import { tashkent, tashkentDay } from "@/lib/format";
import { PARTY_TITLE, roomApi, type RoomTarget } from "@/lib/rooms";
import type { Meeting, Room, RoomParty } from "@/lib/types";

const DAY = ["Yak", "Dush", "Sesh", "Chor", "Pay", "Jum", "Shan"];
const MONTH = ["yan", "fev", "mar", "apr", "may", "iyun", "iyul", "avg", "sen", "okt", "noy", "dek"];
const SLOTS = Array.from({ length: 19 }, (_, i) => 9 * 60 + i * 30); // 09:00 … 18:00
const PARTY_TONE: Record<RoomParty, string> = { claimant: "bg-seal", respondent: "bg-accord" };

function fmt(iso: string) {
  const p = tashkent(iso);
  return `${DAY[p.wd]}, ${p.d}-${MONTH[p.mo]} · ${String(p.h).padStart(2, "0")}:${String(p.mi).padStart(2, "0")}`;
}
function hm(min: number) {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}
const live = (m: Meeting) => m.status === "proposed" || m.status === "accepted";

const STATUS_UI: Record<Meeting["status"], { label: string; cls: string; icon: typeof CalendarClock }> = {
  proposed: { label: "Tasdiq kutilmoqda", cls: "bg-warn-tint text-[#7a4f12]", icon: CalendarClock },
  accepted: { label: "Belgilandi", cls: "bg-accord-tint text-accord-strong", icon: CalendarCheck2 },
  declined: { label: "Rad etildi", cls: "bg-stop-tint text-stop", icon: CalendarX2 },
  cancelled: { label: "Bekor qilindi", cls: "bg-muted text-ink-soft", icon: CalendarX2 },
};

function MeetingCard({
  m,
  room,
  viewer,
  onAnswer,
}: {
  m: Meeting;
  room: Room;
  viewer: "mediator" | RoomParty;
  onAnswer: (id: string, s: "accepted" | "declined" | "cancelled") => void;
}) {
  const ui = STATUS_UI[m.status];
  return (
    <motion.li layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-rule bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-display font-semibold text-ink">{fmt(m.start)}</p>
          <p className="mt-0.5 text-sm text-ink-soft">
            {m.minutes} daqiqa · {viewer === "mediator" ? room.names[m.party] : room.mediator?.name ?? "Mediator"}
          </p>
        </div>
        <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold", ui.cls)}>
          <ui.icon className="size-3.5" /> {ui.label}
        </span>
      </div>
      <p className="mt-2 flex items-center gap-1.5 text-sm text-ink">
        {m.mode === "online" ? <Video className="size-4 text-accord" /> : <MapPin className="size-4 text-accord" />}
        {m.mode === "online" ? "Onlayn" : "Ofisda"}
        {m.place && <span className="text-ink-soft">· {m.place}</span>}
      </p>
      {m.note && <p className="mt-1 text-sm text-ink-soft">{m.note}</p>}
      {viewer !== "mediator" && m.status === "proposed" && (
        <div className="mt-3 flex gap-2">
          <Button size="sm" variant="accord" onClick={() => onAnswer(m.id, "accepted")}>
            Qabul qilaman
          </Button>
          <Button size="sm" variant="outline" onClick={() => onAnswer(m.id, "declined")}>
            Boshqa vaqt
          </Button>
        </div>
      )}
      {viewer === "mediator" && live(m) && (
        <button type="button" onClick={() => onAnswer(m.id, "cancelled")} className="mt-3 inline-flex items-center gap-1 text-sm text-ink-soft hover:text-stop">
          <X className="size-3.5" /> Bekor qilish
        </button>
      )}
    </motion.li>
  );
}

export function MeetingsPanel({ room, target, onChange }: { room: Room; target: RoomTarget; onChange: () => void }) {
  const viewer = room.viewer;
  const [form, setForm] = useState(false);
  const meetings = [...room.meetings].sort((a, b) => a.start.localeCompare(b.start));

  async function answer(id: string, status: "accepted" | "declined" | "cancelled") {
    try {
      await roomApi.answer(target, id, status);
      toast.success(status === "accepted" ? "Uchrashuv tasdiqlandi" : status === "declined" ? "Mediatorga boshqa vaqt kerakligi aytildi" : "Uchrashuv bekor qilindi");
      onChange();
    } catch (e) {
      toast.error(errorText(e));
    }
  }

  return (
    <div className="space-y-4">
      {viewer === "mediator" && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-lg text-sm text-ink-soft">
            Har bir tomon bilan alohida uchrashuv. Ikkala tomon bilan uchrashuvlar bir vaqtga toʻgʻri kelmaydi. Uchrashuv tomon qabul qilgandagina belgilanadi.
          </p>
          <Button variant="accord" onClick={() => setForm((f) => !f)}>
            <CalendarPlus className="size-4" /> Uchrashuv belgilash
          </Button>
        </div>
      )}
      <AnimatePresence>{form && viewer === "mediator" && <NewMeeting room={room} target={target} onDone={() => { setForm(false); onChange(); }} />}</AnimatePresence>
      {meetings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-rule p-6 text-center text-ink-soft">
          {viewer === "mediator" ? "Hali uchrashuv yoʻq. Har bir tomon bilan alohida vaqt belgilang." : "Mediator uchrashuv vaqtini taklif qilganda shu yerda koʻrinadi."}
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {meetings.map((m) => (
            <MeetingCard key={m.id} m={m} room={room} viewer={viewer} onAnswer={answer} />
          ))}
        </ul>
      )}
    </div>
  );
}

function NewMeeting({ room, target, onDone }: { room: Room; target: RoomTarget; onDone: () => void }) {
  // next six working days on Tashkent time
  const days = useMemo(() => {
    const out: ReturnType<typeof tashkentDay>[] = [];
    for (let i = 1; out.length < 6 && i < 14; i++) {
      const d = tashkentDay(i);
      if (d.wd !== 0) out.push(d);
    }
    return out;
  }, []);
  const at = (dayIdx: number, slotMin: number) => `${days[dayIdx].ymd}T${hm(slotMin)}:00+05:00`;
  const [party, setParty] = useState<RoomParty>("claimant");
  const [day, setDay] = useState(0);
  const [slot, setSlot] = useState<number | null>(null);
  const [minutes, setMinutes] = useState(45);
  const [mode, setMode] = useState<"online" | "ofis">("online");
  const [place, setPlace] = useState("");
  const [busy, setBusy] = useState(false);

  // which slots overlap a live meeting (with either party) — shown taken, like the server enforces
  const taken = useMemo(() => {
    const map = new Map<number, RoomParty>();
    for (const s of SLOTS) {
      const start = new Date(at(day, s)).getTime();
      const end = start + minutes * 60_000;
      const hit = room.meetings.find((m) => live(m) && new Date(m.start).getTime() < end && new Date(m.start).getTime() + m.minutes * 60_000 > start);
      if (hit) map.set(s, hit.party);
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room.meetings, days, day, minutes]);

  async function submit() {
    if (slot === null) return;
    setBusy(true);
    const start = at(day, slot);
    try {
      await roomApi.propose(target, { party, start, minutes, mode, place, note: "" });
      toast.success(`${PARTY_TITLE[party]}ga uchrashuv taklif qilindi`);
      onDone();
    } catch (e) {
      toast.error(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
      <div className="sheet space-y-4 p-5">
        <div>
          <p className="mb-2 text-sm font-semibold text-ink">Kim bilan?</p>
          <div className="inline-flex rounded-xl bg-muted p-1">
            {(["claimant", "respondent"] as RoomParty[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setParty(p)}
                className={cn("rounded-lg px-4 py-2 text-sm font-semibold transition-colors", party === p ? "bg-white text-ink shadow-sm" : "text-ink-soft")}
              >
                <span className={cn("mr-2 inline-block size-2 rounded-full", PARTY_TONE[p])} />
                {room.names[p]}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-sm font-semibold text-ink">Kun</p>
          <div className="flex flex-wrap gap-2">
            {days.map((d, i) => (
              <button
                key={d.ymd}
                type="button"
                onClick={() => {
                  setDay(i);
                  setSlot(null);
                }}
                className={cn("rounded-xl border px-3 py-2 text-sm font-medium", day === i ? "border-ink bg-ink text-white" : "border-rule bg-white text-ink hover:bg-ink-wash")}
              >
                {DAY[d.wd]}, {d.d}-{MONTH[d.mo]}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-ink">Vaqt</p>
            <div className="flex items-center gap-3 text-xs text-ink-soft">
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-seal" /> {room.names.claimant}
              </span>
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-accord" /> {room.names.respondent}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-7">
            {SLOTS.map((s) => {
              const who = taken.get(s);
              return (
                <button
                  key={s}
                  type="button"
                  disabled={!!who}
                  onClick={() => setSlot(s)}
                  title={who ? `Band: ${room.names[who]} bilan uchrashuv` : undefined}
                  className={cn(
                    "relative rounded-lg border px-2 py-2 text-sm font-medium tabular transition-colors",
                    who
                      ? "cursor-not-allowed border-transparent bg-muted text-ink-soft/60 line-through"
                      : slot === s
                        ? "border-accord bg-accord text-white"
                        : "border-rule bg-white text-ink hover:border-accord/50",
                  )}
                >
                  {hm(s)}
                  {who && <span className={cn("absolute top-1 right-1 size-1.5 rounded-full", PARTY_TONE[who])} />}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex flex-wrap gap-4">
          <div>
            <p className="mb-2 text-sm font-semibold text-ink">Davomiylik</p>
            <div className="flex gap-1.5">
              {[30, 45, 60, 90].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setMinutes(m);
                    setSlot(null);
                  }}
                  className={cn("rounded-lg border px-3 py-1.5 text-sm", minutes === m ? "border-ink bg-ink text-white" : "border-rule bg-white text-ink")}
                >
                  {m} daq.
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold text-ink">Shakl</p>
            <div className="flex gap-1.5">
              {(["online", "ofis"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={cn("rounded-lg border px-3 py-1.5 text-sm", mode === m ? "border-ink bg-ink text-white" : "border-rule bg-white text-ink")}
                >
                  {m === "online" ? "Onlayn" : "Ofisda"}
                </button>
              ))}
            </div>
          </div>
          <input
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            placeholder={mode === "online" ? "Havola (masalan, Meet/Zoom)" : "Manzil"}
            className="h-10 min-w-56 flex-1 self-end rounded-xl border border-input bg-white px-3 text-sm text-ink outline-none focus:border-accord"
          />
        </div>
        <Button variant="accord" size="lg" className="w-full sm:w-auto" disabled={slot === null || busy} onClick={submit}>
          <CalendarPlus className="size-4" /> {busy ? "Yuborilmoqda…" : slot === null ? "Vaqtni tanlang" : `${hm(slot)} — ${room.names[party]}ga taklif yuborish`}
        </Button>
      </div>
    </motion.div>
  );
}
