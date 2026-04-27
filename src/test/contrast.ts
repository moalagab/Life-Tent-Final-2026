/**
 * WCAG 2.1 contrast helpers — pure functions, no DOM dependency.
 * Used by `light-theme-contrast.test.ts` to gate the light-mode token system.
 */

export type HSL = { h: number; s: number; l: number };

/** Parse "H S% L%" or "H, S%, L%" (the format used in our CSS variables). */
export function parseHsl(input: string): HSL {
  const cleaned = input.replace(/,/g, " ").replace(/%/g, "").trim();
  const [h, s, l] = cleaned.split(/\s+/).map(Number);
  return { h, s, l };
}

/** HSL → linear sRGB → relative luminance per WCAG. */
export function hslToRgb({ h, s, l }: HSL): [number, number, number] {
  const S = s / 100;
  const L = l / 100;
  const C = (1 - Math.abs(2 * L - 1)) * S;
  const Hp = h / 60;
  const X = C * (1 - Math.abs((Hp % 2) - 1));
  let r = 0, g = 0, b = 0;
  if (Hp >= 0 && Hp < 1) [r, g, b] = [C, X, 0];
  else if (Hp < 2) [r, g, b] = [X, C, 0];
  else if (Hp < 3) [r, g, b] = [0, C, X];
  else if (Hp < 4) [r, g, b] = [0, X, C];
  else if (Hp < 5) [r, g, b] = [X, 0, C];
  else [r, g, b] = [C, 0, X];
  const m = L - C / 2;
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const f = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

/** WCAG contrast ratio between two HSL strings (e.g. "215 28% 14%"). */
export function contrastRatio(fg: string, bg: string): number {
  const L1 = relativeLuminance(hslToRgb(parseHsl(fg)));
  const L2 = relativeLuminance(hslToRgb(parseHsl(bg)));
  const [hi, lo] = L1 > L2 ? [L1, L2] : [L2, L1];
  return (hi + 0.05) / (lo + 0.05);
}

export const WCAG = {
  AA_NORMAL: 4.5,
  AA_LARGE: 3,
  AAA_NORMAL: 7,
  AAA_LARGE: 4.5,
  /** Non-text UI components & graphical objects (WCAG 1.4.11). */
  UI_COMPONENT: 3,
} as const;
