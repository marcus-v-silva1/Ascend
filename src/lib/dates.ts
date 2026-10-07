// Belém e São Paulo estão em UTC-3 o ano todo.
export const TZ = "America/Sao_Paulo";

/** Data local (YYYY-MM-DD) no fuso do usuário. */
export function localDate(d: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d);
}

export function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Segunda-feira da semana da data (ISO). */
export function weekStart(iso: string = localDate()): string {
  const d = new Date(`${iso}T12:00:00Z`);
  const dow = (d.getUTCDay() + 6) % 7; // 0 = segunda
  return addDays(iso, -dow);
}

/** Início do dia local em ISO UTC, para filtrar timestamptz. */
export function startOfLocalDay(iso: string = localDate()): string {
  return new Date(`${iso}T00:00:00-03:00`).toISOString();
}

export function daysUntil(iso: string, from: string = localDate()): number {
  const a = new Date(`${from}T12:00:00Z`).getTime();
  const b = new Date(`${iso}T12:00:00Z`).getTime();
  return Math.round((b - a) / 86_400_000);
}

const dateFmt = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC", day: "2-digit", month: "short", year: "numeric" });
const shortFmt = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC", day: "2-digit", month: "short" });

export function formatDate(iso: string | null | undefined, short = false): string {
  if (!iso) return "";
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00Z` : iso);
  return (short ? shortFmt : dateFmt).format(d).replace(".", "");
}

export function relativeDays(iso: string): string {
  const n = daysUntil(iso);
  if (n === 0) return "hoje";
  if (n === 1) return "amanhã";
  if (n === -1) return "ontem";
  return n > 0 ? `em ${n} dias` : `há ${-n} dias`;
}
