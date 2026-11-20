"use client";

import { useEffect, useState } from "react";
import type { LoginResponse, User } from "./types";

const TOKEN_KEY = "ma.token";
const USER_KEY = "ma.user";
const EVENT = "ma-auth";

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    /* private mode: the session simply won't persist */
  }
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return read(TOKEN_KEY);
}

export function getUser(): User | null {
  if (typeof window === "undefined") return null;
  const raw = read(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function saveSession(res: LoginResponse) {
  write(TOKEN_KEY, res.token);
  write(USER_KEY, JSON.stringify(res.user));
  window.dispatchEvent(new Event(EVENT));
}

export function logout() {
  write(TOKEN_KEY, null);
  write(USER_KEY, null);
  window.dispatchEvent(new Event(EVENT));
}

export function useUser(): { user: User | null; ready: boolean } {
  const [state, setState] = useState<{ user: User | null; ready: boolean }>({ user: null, ready: false });
  useEffect(() => {
    const sync = () => setState({ user: getUser(), ready: true });
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return state;
}
