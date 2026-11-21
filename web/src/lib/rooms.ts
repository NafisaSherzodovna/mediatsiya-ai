"use client";

import useSWR from "swr";
import { api } from "./api";
import type { Meeting, Room, RoomMessage, RoomParty } from "./types";

/** Who is talking to the room API: a signed-in user by case id, or the respondent by invite token. */
export type RoomTarget = { kind: "case"; id: string } | { kind: "token"; token: string };

function base(t: RoomTarget) {
  return t.kind === "case" ? `/rooms/${t.id}/` : `/rooms/t/${t.token}/`;
}

export const roomApi = {
  room: (t: RoomTarget) => api<Room>(base(t)),
  messages: (t: RoomTarget, party: RoomParty) => api<RoomMessage[]>(`${base(t)}messages/${t.kind === "case" ? `?party=${party}` : ""}`),
  send: (t: RoomTarget, party: RoomParty, text: string) => api<RoomMessage>(`${base(t)}messages/`, { body: { party, text } }),
  propose: (t: RoomTarget, m: { party: RoomParty; start: string; minutes: number; mode: string; place: string; note: string }) =>
    api<Meeting>(`${base(t)}meetings/`, { body: m }),
  answer: (t: RoomTarget, id: string, status: "accepted" | "declined" | "cancelled") =>
    api<Meeting>(t.kind === "case" ? `/rooms/meetings/${id}/` : `/rooms/t/${t.token}/meetings/${id}/`, { body: { status } }),
  approve: (t: RoomTarget, decision: "approved" | "changes", comment = "", signer: { full_name?: string; address?: string } = {}) =>
    api<{ approvals: Room["approvals"] }>(`${base(t)}approve/`, { body: { decision, comment, ...signer } }),
};

export function useRoom(t: RoomTarget | null, refreshMs = 4000) {
  return useSWR<Room>(t ? ["room", base(t)] : null, () => roomApi.room(t!), { refreshInterval: refreshMs });
}

export function useMessages(t: RoomTarget | null, party: RoomParty | null) {
  return useSWR<RoomMessage[]>(t && party ? ["msgs", base(t), party] : null, () => roomApi.messages(t!, party!), { refreshInterval: 2500 });
}

export const PARTY_TITLE: Record<RoomParty, string> = { claimant: "Murojaatchi", respondent: "Ikkinchi tomon" };
