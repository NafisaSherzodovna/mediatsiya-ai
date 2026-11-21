"use client";

import { useEffect } from "react";
import { toYangi } from "@/lib/yangi";

const SKIP = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA", "INPUT", "CODE"]);
const ATTRS = ["placeholder", "title", "aria-label", "alt"];

/**
 * Shows every visible text in the new Uzbek alphabet (ş ç ğ ö). Source code, the database and AI output keep the
 * classic spelling; this converts at display time, so API data, fixtures and AI answers are covered too.
 * Starts after the page is hydrated, and only writes when the text actually changes, so it cannot loop.
 */
export function YangiBridge() {
  useEffect(() => {
    const skipped = (el: Element | null) => !el || SKIP.has(el.tagName) || !!el.closest("[data-no-yangi],[contenteditable='true']");

    const text = (n: Node) => {
      if (skipped(n.parentElement)) return;
      const v = n.nodeValue;
      if (!v) return;
      const y = toYangi(v);
      if (y !== v) n.nodeValue = y;
    };
    const attrs = (el: Element) => {
      if (skipped(el) && el.tagName !== "INPUT" && el.tagName !== "TEXTAREA") return;
      for (const a of ATTRS) {
        const v = el.getAttribute(a);
        if (v) {
          const y = toYangi(v);
          if (y !== v) el.setAttribute(a, y);
        }
      }
    };
    const walk = (root: Node) => {
      if (root.nodeType === Node.TEXT_NODE) return text(root);
      if (!(root instanceof Element)) return;
      attrs(root);
      root.querySelectorAll(ATTRS.map((a) => `[${a}]`).join(",")).forEach(attrs);
      const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      for (let n = w.nextNode(); n; n = w.nextNode()) text(n);
    };

    const obs = new MutationObserver((list) => {
      for (const m of list) {
        if (m.type === "characterData") text(m.target);
        else if (m.type === "attributes") attrs(m.target as Element);
        else m.addedNodes.forEach(walk);
      }
    });
    // Suspense boundaries hydrate after this effect; touching their server HTML earlier breaks hydration.
    // So the first pass waits for the load event and an idle moment.
    let idle = 0;
    const start = () => {
      idle = window.requestIdleCallback
        ? window.requestIdleCallback(go, { timeout: 500 })
        : window.setTimeout(go, 50);
    };
    function go() {
      walk(document.body);
      document.title = toYangi(document.title);
      obs.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
    }
    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });
    return () => {
      window.removeEventListener("load", start);
      if (window.cancelIdleCallback) window.cancelIdleCallback(idle);
      window.clearTimeout(idle);
      obs.disconnect();
    };
  }, []);
  return null;
}
