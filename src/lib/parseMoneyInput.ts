/**
 * parseMoneyInput — strict money-field parser for finance form inputs.
 *
 * Unlike `parseFloat(x) || 0`, this:
 *   - normalizes Arabic-Indic (٠-٩) and Persian (۰-۹) digits to Western digits
 *   - strips thousands separators (commas / spaces) so "1,500" reads as 1500
 *   - rejects anything that isn't a clean number instead of silently
 *     coercing it to 0 (so callers can show a validation error and refuse
 *     to save, instead of writing a corrupted amount)
 *
 * Returns `null` for empty/invalid input — callers must treat `null` as
 * "reject the form", not "use 0".
 */
export function parseMoneyInput(raw: string | null | undefined): number | null {
  if (raw == null) return null;

  const normalized = raw
    .trim()
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660)) // Arabic-Indic
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0)) // Extended Arabic-Indic (Persian)
    .replace(/[,\s]/g, '');

  if (!/^-?\d+(\.\d+)?$/.test(normalized)) return null;

  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}
