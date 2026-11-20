// Copies the shared API fixtures (../contract/fixtures) into src/fixtures so the
// mock API can import them. Runs before dev and build.
import { cpSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const from = join(here, "..", "..", "contract", "fixtures");
const to = join(here, "..", "src", "fixtures");

if (!existsSync(from)) {
  console.warn(`[fixtures] ${from} not found; keeping existing src/fixtures`);
  process.exit(0);
}
mkdirSync(to, { recursive: true });
cpSync(from, to, { recursive: true });
console.log("[fixtures] copied contract/fixtures -> src/fixtures");
