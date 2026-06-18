import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** shadcn/ui className combiner. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format an integer amount of cents as a currency string (default EUR). */
export function formatCents(cents: number, currency = "EUR", locale = "fr-FR") {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(
    cents / 100,
  );
}

/** Inclusive day count between two ISO date strings (YYYY-MM-DD). */
export function countDays(startISO: string, endISO: string): number {
  const start = new Date(`${startISO}T00:00:00Z`);
  const end = new Date(`${endISO}T00:00:00Z`);
  const ms = end.getTime() - start.getTime();
  return Math.max(1, Math.round(ms / 86_400_000) + 1);
}

/** Human-readable date range, e.g. "12 – 15 Jun 2026". */
export function formatDateRange(startISO: string, endISO: string, locale = "en-GB") {
  const fmt = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" });
  const fmtFull = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return `${fmt.format(new Date(startISO))} – ${fmtFull.format(new Date(endISO))}`;
}
