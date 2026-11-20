"use client";

import { getToken, getUser } from "./auth";
import { MockError, mockRoute } from "./mock";

export class ApiError extends Error {
  constructor(
    public status: number,
    public detail: string,
  ) {
    super(detail);
  }
}

export function isMock(): boolean {
  return (process.env.NEXT_PUBLIC_API_MODE ?? "mock") !== "live";
}

type Init = { method?: string; body?: unknown; form?: FormData };

/**
 * Calls the backend at /api<path>. In mock mode it answers from fixtures.
 * In live mode an AI call (/ai/...) that fails falls back to the mock answer
 * with source "fallback", so the stage never shows an error page.
 */
export async function api<T>(path: string, init: Init = {}): Promise<T> {
  const method = init.method ?? (init.body || init.form ? "POST" : "GET");
  if (isMock()) return mockCall<T>(path, method, init);

  try {
    return await liveCall<T>(path, method, init);
  } catch (err) {
    const isAi = path.startsWith("/ai/");
    const isClientError = err instanceof ApiError && err.status >= 400 && err.status < 500 && err.status !== 429;
    if (isAi && !isClientError) return mockCall<T>(path, method, init);
    throw err;
  }
}

async function mockCall<T>(path: string, method: string, init: Init): Promise<T> {
  try {
    return await mockRoute<T>({ method, path, body: init.body, user: getUser() });
  } catch (e) {
    if (e instanceof MockError) throw new ApiError(e.status, e.detail);
    throw e;
  }
}

async function liveCall<T>(path: string, method: string, init: Init): Promise<T> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers.Authorization = `Token ${token}`;
  let body: BodyInit | undefined;
  if (init.form) body = init.form;
  else if (init.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(init.body);
  }
  const res = await fetch(`/api${path}`, { method, headers, body });
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  if (!res.ok) {
    const raw = data !== null && typeof data === "object" ? (data as { detail?: unknown }).detail : undefined;
    const detail = raw ? String(raw) : "Xatolik yuz berdi. Qayta urinib koʻring.";
    throw new ApiError(res.status, detail);
  }
  return data as T;
}

export function errorText(e: unknown): string {
  if (e instanceof ApiError) return e.detail;
  return "Aloqa uzildi. Internetni tekshirib, qayta urinib koʻring.";
}
