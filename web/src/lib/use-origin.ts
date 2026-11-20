"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** window.location.origin on the client, "" during server render. */
export function useOrigin(): string {
  return useSyncExternalStore(
    subscribe,
    () => window.location.origin,
    () => "",
  );
}
