#!/usr/bin/env node
// Sync this clone with origin/main and show what changed since the last sync.
// Usage: node scripts/sync.mjs [A|B]   (no dependencies; works before any scaffold exists)
import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const role = (process.argv[2] || "").toUpperCase();
const sh = (cmd, opts = {}) =>
  execSync(cmd, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], ...opts }).trim();
const tryRun = (cmd) => {
  try {
    return sh(cmd);
  } catch {
    return null;
  }
};

const gitDir = sh("git rev-parse --git-dir");
const marker = join(gitDir, "mediatsiya-last-sync");
const before = sh("git rev-parse HEAD");
const lastSync = existsSync(marker) ? readFileSync(marker, "utf8").trim() : before;

sh("git fetch origin --quiet");
try {
  execSync("git rebase --autostash origin/main", { stdio: "inherit" });
} catch {
  console.error(
    "\nREBASE CONFLICT. Run `git status`, resolve the conflicted files " +
      "(keep both sides' intent; never drop the other role's change), `git add <files>`, " +
      "then `git rebase --continue`. Ask the user if the conflict is in the other role's file.",
  );
  process.exit(1);
}

const after = sh("git rev-parse HEAD");
const base = tryRun(`git merge-base ${lastSync} origin/main`) || lastSync;
const log = tryRun(`git log --oneline --no-decorate ${base}..origin/main`) || "";

console.log("\n=== New commits on main since your last sync ===");
if (!log) console.log("(none)");
for (const line of log.split("\n").filter(Boolean)) {
  console.log(line.includes("[contract]") ? `!! CONTRACT CHANGE: ${line}` : `   ${line}`);
}

const changed = (tryRun(`git diff --name-only ${base} origin/main`) || "").split("\n").filter(Boolean);
if (changed.some((f) => f.startsWith("docs/plan/") || f === "CLAUDE.md" || f === "DESIGN.md")) {
  console.log("\n!! Plan/docs changed: re-read the changed files under docs/plan/, CLAUDE.md, DESIGN.md.");
}
if (changed.some((f) => f.startsWith("contract/"))) {
  console.log("!! contract/ changed: check that your code still matches contract/api.md and the fixtures.");
}
if (existsSync("web/package.json") && changed.some((f) => f === "web/package.json" || f === "web/package-lock.json")) {
  console.log("\nweb dependencies changed -> npm install");
  execSync("npm install --no-audit --no-fund", { stdio: "inherit", cwd: "web" });
}
if (changed.includes("backend/requirements.txt")) {
  console.log("\n!! backend/requirements.txt changed: run `cd backend && .venv/Scripts/pip install -r requirements.txt`.");
}
if (changed.some((f) => f.includes("/migrations/"))) {
  console.log("!! New migrations: run `cd backend && .venv/Scripts/python manage.py migrate`.");
}

if (role && tryRun("gh --version")) {
  const issues = tryRun(`gh issue list --state open --search "[for-${role}] in:title" --limit 20`);
  console.log(`\n=== Open issues for role ${role} ===\n${issues || "(none or gh not authenticated)"}`);
}

writeFileSync(marker, sh("git rev-parse origin/main"));
console.log(`\nSynced: ${before.slice(0, 7)} -> ${after.slice(0, 7)} (origin/main ${sh("git rev-parse --short origin/main")})`);
