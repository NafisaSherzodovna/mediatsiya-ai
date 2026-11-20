"use client";

import { Mic, Square } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { cn } from "cn";
import { api } from "@/lib/api";

const MAX_SECONDS = 60;
const noop = () => () => {};

function pickMime(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  for (const m of ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"]) {
    if (MediaRecorder.isTypeSupported(m)) return m;
  }
  return undefined;
}

type State = "idle" | "recording" | "uploading";

/** Records up to 60 s, sends it to /ai/transcribe/ and hands back the text. Hidden when the browser can't record. */
export function VoiceButton({ onText, className }: { onText: (text: string) => void; className?: string }) {
  const supported = useSyncExternalStore(
    noop,
    () => typeof MediaRecorder !== "undefined" && !!navigator.mediaDevices?.getUserMedia,
    () => false,
  );
  const [state, setState] = useState<State>("idle");
  const [seconds, setSeconds] = useState(0);
  const [note, setNote] = useState<string | null>(null);
  const rec = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearInterval(timer.current);
      rec.current?.stream.getTracks().forEach((t) => t.stop());
    },
    [],
  );

  if (!supported) return null;

  async function start() {
    setNote(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = pickMime();
      const r = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunks.current = [];
      r.ondataavailable = (e) => e.data.size > 0 && chunks.current.push(e.data);
      r.onstop = () => void upload(r.mimeType || mime || "audio/webm");
      r.start();
      rec.current = r;
      setSeconds(0);
      setState("recording");
      timer.current = setInterval(() => {
        setSeconds((s) => {
          if (s + 1 >= MAX_SECONDS) stop();
          return s + 1;
        });
      }, 1000);
    } catch {
      setNote("Mikrofonga ruxsat berilmadi — matn bilan yozing.");
    }
  }

  function stop() {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    const r = rec.current;
    if (r && r.state !== "inactive") {
      r.stop();
      r.stream.getTracks().forEach((t) => t.stop());
    }
  }

  async function upload(mime: string) {
    setState("uploading");
    const ext = mime.includes("mp4") ? "m4a" : mime.includes("ogg") ? "ogg" : "webm";
    const form = new FormData();
    form.append("audio", new Blob(chunks.current, { type: mime }), `nutq.${ext}`);
    try {
      const res = await api<{ text: string }>("/ai/transcribe/", { form });
      if (res.text.trim()) onText(res.text.trim());
      else toast.error("Ovoz tanilmadi. Iltimos, matn bilan yozing.");
    } catch {
      toast.error("Ovoz tanilmadi. Iltimos, matn bilan yozing.");
    } finally {
      setState("idle");
    }
  }

  const recording = state === "recording";
  return (
    <div className={cn("flex flex-col items-start gap-1.5", className)}>
      <button
        type="button"
        onClick={recording ? stop : start}
        disabled={state === "uploading"}
        className={cn(
          "relative inline-flex h-11 items-center gap-2.5 rounded-full border px-4 text-sm font-semibold transition-colors",
          recording ? "border-stop bg-stop text-white" : "border-ink/80 bg-white text-ink hover:bg-ink-wash",
          state === "uploading" && "opacity-70",
        )}
        aria-label={recording ? "Yozishni toʻxtatish" : "Ovoz bilan aytish"}
      >
        {recording && (
          <motion.span
            className="absolute inset-0 rounded-full border-2 border-stop"
            animate={{ scale: [1, 1.18], opacity: [0.6, 0] }}
            transition={{ duration: 1.1, repeat: Infinity }}
          />
        )}
        {recording ? <Square className="size-4 fill-current" /> : <Mic className="size-[18px]" />}
        {state === "uploading" ? "Matnga aylantirilmoqda…" : recording ? `Toʻxtatish · 0:${String(seconds).padStart(2, "0")}` : "Ovoz bilan aytish"}
        {recording && (
          <span className="flex h-4 items-end gap-[3px]" aria-hidden>
            {[0, 1, 2, 3].map((i) => (
              <motion.span
                key={i}
                className="w-[3px] rounded-full bg-white"
                animate={{ height: ["30%", "100%", "45%", "80%", "30%"] }}
                transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.12 }}
              />
            ))}
          </span>
        )}
      </button>
      {note && <p className="text-sm text-stop">{note}</p>}
    </div>
  );
}
