/**
 * Automated WCAG contrast audit for the LIGHT theme.
 * Gates every token pair the UI relies on:
 *   - body text on background / cards
 *   - muted/secondary text
 *   - buttons (primary, destructive, success, warning) text on fills
 *   - chart-like surfaces (primary fills) against background
 *   - focus ring vs background (UI-component contrast 1.4.11)
 *
 * Reads the canonical token values straight from src/index.css so the test
 * stays in sync with the design system and breaks when tokens drift.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { contrastRatio, WCAG } from "./contrast";

function loadLightTokens(): Record<string, string> {
  const css = readFileSync(resolve(__dirname, "../index.css"), "utf8");
  // Grab the :root { ... } block (light mode).
  const match = css.match(/:root\s*\{([\s\S]*?)\}/);
  if (!match) throw new Error("Could not find :root block in index.css");
  const block = match[1];
  const tokens: Record<string, string> = {};
  for (const line of block.split("\n")) {
    const m = line.match(/--([a-z0-9-]+)\s*:\s*([^;]+);/i);
    if (!m) continue;
    tokens[m[1].trim()] = m[2].trim();
  }
  return tokens;
}

const T = loadLightTokens();

/** Sanity: required tokens must be present. */
const REQUIRED = [
  "background", "foreground", "card", "card-foreground",
  "primary", "primary-foreground",
  "secondary", "secondary-foreground",
  "muted", "muted-foreground",
  "destructive", "destructive-foreground",
  "success", "success-foreground",
  "warning", "warning-foreground",
  "border", "ring",
];

describe("Light theme — token presence", () => {
  for (const k of REQUIRED) {
    it(`defines --${k}`, () => expect(T[k], `missing --${k}`).toBeTruthy());
  }
});

/** Build a labelled matrix of contrast assertions. */
type Pair = { name: string; fg: string; bg: string; min: number };
const pairs: Pair[] = [
  // Body text
  { name: "foreground on background",        fg: T.foreground, bg: T.background, min: WCAG.AA_NORMAL },
  { name: "card-foreground on card",         fg: T["card-foreground"], bg: T.card, min: WCAG.AAA_NORMAL },
  { name: "popover-foreground on popover",   fg: T["popover-foreground"], bg: T.popover, min: WCAG.AAA_NORMAL },
  { name: "muted-foreground on background",  fg: T["muted-foreground"], bg: T.background, min: WCAG.AA_NORMAL },
  { name: "muted-foreground on card",        fg: T["muted-foreground"], bg: T.card, min: WCAG.AA_NORMAL },
  { name: "secondary-foreground on secondary", fg: T["secondary-foreground"], bg: T.secondary, min: WCAG.AA_NORMAL },
  { name: "accent-foreground on accent",     fg: T["accent-foreground"], bg: T.accent, min: WCAG.AA_NORMAL },

  // Buttons (text on filled brand surfaces)
  { name: "primary button text",             fg: T["primary-foreground"], bg: T.primary, min: WCAG.AA_NORMAL },
  { name: "destructive button text",         fg: T["destructive-foreground"], bg: T.destructive, min: WCAG.AA_NORMAL },
  { name: "success button text",             fg: T["success-foreground"], bg: T.success, min: WCAG.AA_NORMAL },
  { name: "warning button text",             fg: T["warning-foreground"], bg: T.warning, min: WCAG.AA_NORMAL },

  // Chart/data surfaces — coloured fills must stand out from canvas (UI component contrast)
  { name: "primary fill vs background (chart)",     fg: T.primary, bg: T.background, min: WCAG.UI_COMPONENT },
  { name: "destructive fill vs background (chart)", fg: T.destructive, bg: T.background, min: WCAG.UI_COMPONENT },
  { name: "success fill vs background (chart)",     fg: T.success, bg: T.background, min: WCAG.UI_COMPONENT },

  // Lines & focus indicator (1.4.11)
  { name: "ring vs background (focus indicator)",   fg: T.ring, bg: T.background, min: WCAG.UI_COMPONENT },
];

describe("Light theme — WCAG contrast", () => {
  for (const p of pairs) {
    it(`${p.name} ≥ ${p.min}:1`, () => {
      const ratio = contrastRatio(p.fg, p.bg);
      expect(
        ratio,
        `${p.name}: ${ratio.toFixed(2)}:1 (need ≥ ${p.min}:1) — fg(${p.fg}) bg(${p.bg})`
      ).toBeGreaterThanOrEqual(p.min);
    });
  }

  it("emits a human-readable contrast report", () => {
    const lines = pairs.map((p) => {
      const r = contrastRatio(p.fg, p.bg).toFixed(2);
      const status = Number(r) >= p.min ? "✓" : "✗";
      return `${status} ${p.name.padEnd(48)} ${r}:1 (min ${p.min}:1)`;
    });
    // eslint-disable-next-line no-console
    console.log("\nLight theme contrast report:\n" + lines.join("\n") + "\n");
    expect(lines.length).toBeGreaterThan(0);
  });
});
