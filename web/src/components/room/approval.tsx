"use client";

import { CheckCircle2, CircleDashed, FileSignature, MessageSquareWarning, PenLine } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { errorText } from "@/lib/api";
import { PARTY_TITLE, roomApi, type RoomTarget } from "@/lib/rooms";
import type { ApprovalState, Room, RoomParty } from "@/lib/types";

export function ApprovalChip({ name, state }: { name: string; state: ApprovalState }) {
  const ok = state?.current && state.decision === "approved";
  const changes = state?.current && state.decision === "changes";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium",
        ok ? "bg-accord-tint text-accord-strong" : changes ? "bg-warn-tint text-[#7a4f12]" : "bg-muted text-ink-soft",
      )}
    >
      {ok ? <CheckCircle2 className="size-4" /> : changes ? <MessageSquareWarning className="size-4" /> : <CircleDashed className="size-4" />}
      {name}: {ok ? "tasdiqladi" : changes ? "oʻzgartirish soʻradi" : "kutilmoqda"}
    </span>
  );
}

/** Mediator's view of the two approvals; sealing is allowed only when both approved the current text. */
export function ApprovalStatus({ room }: { room: Room }) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {(["claimant", "respondent"] as RoomParty[]).map((p) => (
          <ApprovalChip key={p} name={room.names[p]} state={room.approvals[p]} />
        ))}
      </div>
      {(["claimant", "respondent"] as RoomParty[]).map((p) => {
        const s = room.approvals[p];
        return s?.current && s.decision === "changes" && s.comment ? (
          <p key={p} className="rounded-xl bg-warn-tint px-3 py-2 text-sm text-ink">
            <b>{room.names[p]}:</b> {s.comment}
          </p>
        ) : null;
      })}
    </div>
  );
}

/** A party reviews the draft and approves it or asks for changes. */
export function PartyApproval({ room, target, party, onChange }: { room: Room; target: RoomTarget; party: RoomParty; onChange: () => void }) {
  const [asking, setAsking] = useState(false);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const mine = room.approvals[party];
  const agreed = room.status === "agreed" || room.status === "closed";

  if (!room.agreement) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-dashed border-rule p-6 text-ink-soft">
        <PenLine className="size-5 shrink-0" /> Mediator suhbatlardan keyin kelishuv loyihasini tayyorlaydi. U shu yerda koʻrinadi va siz tasdiqlaysiz.
      </div>
    );
  }

  async function send(decision: "approved" | "changes") {
    setBusy(true);
    try {
      await roomApi.approve(target, decision, decision === "changes" ? comment : "");
      toast.success(decision === "approved" ? "Kelishuv tasdiqlandi" : "Izohingiz mediatorga yuborildi");
      setAsking(false);
      onChange();
    } catch (e) {
      toast.error(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="hujjat p-5 pl-14 font-doc">
        <p className="flex items-center gap-2 font-sans text-xs font-semibold tracking-[0.12em] text-accord uppercase">
          <FileSignature className="size-4" /> {agreed ? "Muhrlangan kelishuv" : "Kelishuv loyihasi"}
        </p>
        <p className="mt-2 text-lg font-semibold text-ink">{room.agreement.title}</p>
        <ol className="mt-3 space-y-2.5">
          {room.agreement.clauses.map((c) => (
            <li key={c.title}>
              <p className="font-semibold text-ink">{c.title}</p>
              <p className="text-[1rem] leading-relaxed text-ink">{c.body}</p>
            </li>
          ))}
        </ol>
      </div>
      {agreed ? (
        <p className="rounded-xl bg-accord-tint px-4 py-3 font-medium text-accord-strong">Kelishuv ikkala tomon tasdigʻi bilan muhrlandi.</p>
      ) : mine?.current && mine.decision === "approved" ? (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 rounded-xl bg-accord-tint px-4 py-3 font-medium text-accord-strong">
          <CheckCircle2 className="size-5" /> Siz tasdiqladingiz. Ikkinchi tomon tasdiqlagach, mediator kelishuvni muhrlaydi.
        </motion.p>
      ) : (
        <div className="space-y-3">
          {mine?.current && mine.decision === "changes" && (
            <p className="rounded-xl bg-warn-tint px-4 py-3 text-sm text-ink">Siz oʻzgartirish soʻradingiz. Mediator loyihani yangilaganda qayta koʻrasiz.</p>
          )}
          {asking ? (
            <div className="space-y-2">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                placeholder="Qaysi band va nimani oʻzgartirish kerak?"
                className="w-full rounded-xl border border-input bg-white p-3 text-ink outline-none focus:border-accord"
              />
              <div className="flex gap-2">
                <Button variant="accord" disabled={busy || comment.trim().length < 5} onClick={() => send("changes")}>
                  Mediatorga yuborish
                </Button>
                <Button variant="ghost" onClick={() => setAsking(false)}>
                  Bekor
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button size="lg" variant="accord" disabled={busy} onClick={() => send("approved")}>
                <CheckCircle2 className="size-5" /> Tasdiqlayman
              </Button>
              <Button size="lg" variant="outline" disabled={busy} onClick={() => setAsking(true)}>
                Oʻzgartirish soʻrash
              </Button>
            </div>
          )}
          <p className="text-xs text-ink-soft">{PARTY_TITLE[party]} sifatida tasdiqlaysiz. Matn oʻzgarsa, tasdiq qayta soʻraladi.</p>
        </div>
      )}
    </div>
  );
}
