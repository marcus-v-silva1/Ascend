export type Rates = { usd_brl: number; eur_brl: number };

export function toBRL(amount: number, currency: string, rates: Rates): number {
  switch (currency.toUpperCase()) {
    case "USD":
      return amount * rates.usd_brl;
    case "EUR":
      return amount * rates.eur_brl;
    default:
      return amount;
  }
}

const formatters = new Map<string, Intl.NumberFormat>();
export function money(amount: number, currency = "BRL"): string {
  const key = currency.toUpperCase();
  if (!formatters.has(key)) {
    formatters.set(key, new Intl.NumberFormat("pt-BR", { style: "currency", currency: key, maximumFractionDigits: 0 }));
  }
  return formatters.get(key)!.format(amount);
}

/** Meses para atingir a meta guardando um valor fixo por mês. */
export function monthsToGoal(current: number, target: number, monthly: number): number | null {
  if (current >= target) return 0;
  if (monthly <= 0) return null;
  return Math.ceil((target - current) / monthly);
}

/** Média mensal de aportes nos últimos N meses (considera só meses com histórico). */
export function averageMonthly(entries: { amount: number; date: string }[], today: string, months = 3): number {
  const cutoff = new Date(`${today}T12:00:00Z`);
  cutoff.setUTCMonth(cutoff.getUTCMonth() - months);
  const since = cutoff.toISOString().slice(0, 10);
  const recent = entries.filter((e) => e.date > since);
  if (recent.length === 0) return 0;
  const total = recent.reduce((s, e) => s + e.amount, 0);
  const first = recent.map((e) => e.date).sort()[0];
  const span = Math.max(
    1,
    Math.min(months, (new Date(`${today}T12:00:00Z`).getTime() - new Date(`${first}T12:00:00Z`).getTime()) / (30.44 * 86_400_000) + 1),
  );
  return total / span;
}

/**
 * Simula a quitação com juros compostos mensais e pagamento fixo.
 * Retorna meses e juros totais; null se o pagamento não cobre os juros.
 */
export function payoffPlan(balance: number, monthlyRatePct: number, payment: number) {
  if (balance <= 0) return { months: 0, interest: 0 };
  const r = monthlyRatePct / 100;
  if (payment <= balance * r) return null;
  let months = 0;
  let interest = 0;
  let b = balance;
  while (b > 0 && months < 600) {
    const i = b * r;
    interest += i;
    b = b + i - payment;
    months++;
  }
  return { months, interest: Math.round(interest * 100) / 100 };
}
