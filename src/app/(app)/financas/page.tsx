import type { Metadata } from "next";
import { Check } from "lucide-react";
import { ActionForm, Field } from "@/components/action-form";
import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth";
import { formatDate, localDate } from "@/lib/dates";
import { averageMonthly, money, monthsToGoal, payoffPlan, toBRL } from "@/lib/finance";
import { cn } from "@/lib/utils";
import { addFundEntry, createDebt, createFund, createPlannedCost, deletePlannedCost, payDebt, saveRates, togglePaidCost } from "./actions";

// Página com dados do usuário: pode esperar os dados (o loading.tsx mostra o esqueleto)
export const instant = false;

export const metadata: Metadata = { title: "Finanças" };

type Fund = { id: string; name: string; target_amount: number; currency: string; target_date: string | null };
type Entry = { fund_id: string; amount: number; date: string; note: string | null };
type Debt = { id: string; name: string; creditor: string | null; original_amount: number; interest_rate_month: number; min_payment: number; due_day: number | null; paid_off_at: string | null };
type Cost = { id: string; name: string; category: string | null; amount: number; currency: string; due_date: string | null; paid_at: string | null; notes: string | null };

function CurrencySelect({ id }: { id: string }) {
  return (
    <div>
      <label htmlFor={id} className="field-label">Moeda</label>
      <select id={id} name="currency" defaultValue="BRL" className="field">
        <option value="BRL">R$</option>
        <option value="USD">US$</option>
        <option value="EUR">€</option>
      </select>
    </div>
  );
}

export default async function FinancePage() {
  const { supabase, userId } = await requireUser();
  const today = localDate();
  const [{ data: profile }, { data: funds }, { data: entries }, { data: debts }, { data: payments }, { data: costs }] = await Promise.all([
    supabase.from("profiles").select("usd_brl, eur_brl").eq("id", userId).single(),
    supabase.from("funds").select("id, name, target_amount, currency, target_date").order("created_at"),
    supabase.from("fund_entries").select("fund_id, amount, date, note").order("date", { ascending: false }),
    supabase.from("debts").select("id, name, creditor, original_amount, interest_rate_month, min_payment, due_day, paid_off_at").order("created_at"),
    supabase.from("debt_payments").select("debt_id, amount"),
    supabase.from("planned_costs").select("id, name, category, amount, currency, due_date, paid_at, notes").order("due_date", { nullsFirst: false }),
  ]);
  const rates = { usd_brl: Number(profile?.usd_brl ?? 5.4), eur_brl: Number(profile?.eur_brl ?? 6.2) };
  const allEntries = ((entries ?? []) as Entry[]).map((e) => ({ ...e, amount: Number(e.amount) }));
  const costList = (costs ?? []) as Cost[];
  const openCosts = costList.filter((c) => !c.paid_at);
  const costTotal = openCosts.reduce((s, c) => s + toBRL(Number(c.amount), c.currency, rates), 0);
  const byCategory = new Map<string, number>();
  for (const c of openCosts) {
    const k = c.category ?? "Outros";
    byCategory.set(k, (byCategory.get(k) ?? 0) + toBRL(Number(c.amount), c.currency, rates));
  }

  return (
    <>
      <PageHeader title="Finanças" description="Reserva para a mudança, quitação de dívidas e quanto custam as próximas etapas do plano." />

      <section aria-labelledby="funds" className="mb-10">
        <h2 id="funds" className="mb-3 text-xl font-semibold">Reservas</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {((funds ?? []) as Fund[]).map((f) => {
            const mine = allEntries.filter((e) => e.fund_id === f.id);
            const saved = mine.reduce((s, e) => s + e.amount, 0);
            const target = Number(f.target_amount);
            const pct = target ? Math.min(100, Math.round((saved / target) * 100)) : 0;
            const avg = averageMonthly(mine, today);
            const eta = monthsToGoal(saved, target, avg);
            return (
              <article key={f.id} className="rounded-lg border bg-card p-5">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="font-semibold">{f.name}</h3>
                  <span className="num text-sm text-muted-foreground">{pct}%</span>
                </div>
                <p className="num mt-2 text-2xl font-semibold" style={{ fontFamily: "var(--font-sora)" }}>
                  {money(saved, f.currency)} <span className="text-base font-normal text-muted-foreground">de {money(target, f.currency)}</span>
                </p>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted" aria-hidden>
                  <div className={cn("h-full rounded-full", pct >= 100 ? "bg-success" : "bg-primary")} style={{ width: `${pct}%` }} />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {avg > 0 ? `Média de ${money(avg, f.currency)}/mês` : "Registre aportes para ver a projeção"}
                  {eta !== null && eta > 0 && ` · meta em ~${eta} meses`}
                  {f.target_date && ` · prazo ${formatDate(f.target_date, true)}`}
                </p>
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm text-primary">Registrar aporte ou retirada</summary>
                  <ActionForm action={addFundEntry} submitLabel="Registrar" submitVariant="secondary" className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                    <input type="hidden" name="fund_id" value={f.id} />
                    <Field label="Valor (negativo = retirada)" name="amount" type="number" step="0.01" required />
                    <Field label="Data" name="date" type="date" defaultValue={today} required />
                  </ActionForm>
                </details>
                {mine.length > 0 && (
                  <ul className="mt-3 space-y-0.5 text-xs text-muted-foreground">
                    {mine.slice(0, 3).map((e, i) => (
                      <li key={i} className="num flex justify-between"><span>{formatDate(e.date, true)}</span><span className={e.amount < 0 ? "text-destructive" : undefined}>{money(e.amount, f.currency)}</span></li>
                    ))}
                  </ul>
                )}
              </article>
            );
          })}
        </div>
        <details className="mt-3">
          <summary className="cursor-pointer text-sm text-muted-foreground">Nova reserva</summary>
          <ActionForm action={createFund} submitLabel="Criar" className="mt-3 grid max-w-2xl gap-2 sm:grid-cols-4 sm:items-end">
            <Field label="Nome" name="name" required />
            <Field label="Meta" name="target_amount" type="number" step="0.01" required />
            <CurrencySelect id="fund-cur" />
            <Field label="Prazo" name="target_date" type="date" />
          </ActionForm>
        </details>
      </section>

      <div className="grid gap-10 lg:grid-cols-2">
        <section aria-labelledby="costs">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 id="costs" className="text-xl font-semibold">Custos planejados</h2>
            <p className="num text-sm text-muted-foreground">Em aberto: <span className="font-semibold text-foreground">{money(costTotal)}</span></p>
          </div>
          <p className="mb-3 text-xs text-muted-foreground">
            {[...byCategory.entries()].map(([k, v]) => `${k} ${money(v)}`).join(" · ")}
          </p>
          <ul className="divide-y rounded-lg border bg-card">
            {costList.map((c) => {
              const paid = Boolean(c.paid_at);
              return (
                <li key={c.id} className="group flex items-center gap-3 px-4 py-2.5">
                  <form action={togglePaidCost}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="paid" value={String(paid)} />
                    <button type="submit" aria-label={paid ? `Desmarcar ${c.name}` : `Marcar ${c.name} como pago`} className={cn("grid size-5 place-items-center rounded border", paid && "border-success bg-success text-white")}>
                      {paid && <Check className="size-3.5" />}
                    </button>
                  </form>
                  <div className={cn("min-w-0 flex-1 text-sm", paid && "text-muted-foreground line-through")}>
                    <p className="truncate">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{[c.category, c.due_date && formatDate(c.due_date, true), c.notes].filter(Boolean).join(" · ")}</p>
                  </div>
                  <div className="num text-right text-sm">
                    <p>{money(Number(c.amount), c.currency)}</p>
                    {c.currency !== "BRL" && <p className="text-xs text-muted-foreground">≈ {money(toBRL(Number(c.amount), c.currency, rates))}</p>}
                  </div>
                  <form action={deletePlannedCost} className="hidden group-hover:block">
                    <input type="hidden" name="id" value={c.id} />
                    <button type="submit" className="text-xs text-muted-foreground hover:text-destructive" aria-label={`Excluir ${c.name}`}>×</button>
                  </form>
                </li>
              );
            })}
          </ul>
          <details className="mt-3 rounded-lg border bg-card p-4">
            <summary className="cursor-pointer text-sm font-medium">Novo custo</summary>
            <ActionForm action={createPlannedCost} submitLabel="Adicionar" className="mt-3 grid gap-2 sm:grid-cols-2">
              <Field label="Descrição" name="name" required className="sm:col-span-2" />
              <Field label="Categoria" name="category" placeholder="Certificação, Visto, Mudança…" />
              <Field label="Data prevista" name="due_date" type="date" />
              <Field label="Valor" name="amount" type="number" step="0.01" required />
              <CurrencySelect id="cost-cur" />
            </ActionForm>
          </details>
          <details className="mt-3">
            <summary className="cursor-pointer text-xs text-muted-foreground">Cotações usadas: US$ {rates.usd_brl.toFixed(2)} · € {rates.eur_brl.toFixed(2)}</summary>
            <ActionForm action={saveRates} submitLabel="Salvar cotações" submitVariant="secondary" resetOnSuccess={false} className="mt-2 grid max-w-md grid-cols-[1fr_1fr_auto] items-end gap-2">
              <Field label="US$ → R$" name="usd_brl" type="number" step="0.01" defaultValue={rates.usd_brl} required />
              <Field label="€ → R$" name="eur_brl" type="number" step="0.01" defaultValue={rates.eur_brl} required />
            </ActionForm>
          </details>
        </section>

        <section aria-labelledby="debts">
          <h2 id="debts" className="mb-3 text-xl font-semibold">Dívidas</h2>
          <p className="mb-3 text-xs text-muted-foreground">Quitar primeiro a de juros mais altos (avalanche) é o que mais economiza.</p>
          <ul className="space-y-3">
            {((debts ?? []) as Debt[])
              .sort((a, b) => Number(b.interest_rate_month) - Number(a.interest_rate_month))
              .map((d) => {
                const paid = (payments ?? []).filter((p: { debt_id: string }) => p.debt_id === d.id).reduce((s: number, p: { amount: number }) => s + Number(p.amount), 0);
                const balance = Math.max(0, Number(d.original_amount) - paid);
                const plan = payoffPlan(balance, Number(d.interest_rate_month), Number(d.min_payment));
                const pct = Math.min(100, Math.round((paid / Number(d.original_amount)) * 100));
                return (
                  <li key={d.id} className={cn("rounded-lg border bg-card p-4", d.paid_off_at && "opacity-60")}>
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="font-medium">{d.name}{d.creditor && <span className="font-normal text-muted-foreground"> · {d.creditor}</span>}</p>
                      <p className="num font-semibold">{d.paid_off_at ? "Quitada" : money(balance)}</p>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
                      <div className="h-full rounded-full bg-success" style={{ width: `${pct}%` }} />
                    </div>
                    {!d.paid_off_at && (
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        {Number(d.interest_rate_month)}% a.m.
                        {Number(d.min_payment) > 0 && ` · parcela ${money(Number(d.min_payment))}`}
                        {d.due_day && ` · vence dia ${d.due_day}`}
                        {plan === null
                          ? " · a parcela não cobre os juros"
                          : plan.months > 0 && ` · quita em ${plan.months} meses (${money(plan.interest)} de juros)`}
                      </p>
                    )}
                    {!d.paid_off_at && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm text-primary">Registrar pagamento</summary>
                        <ActionForm action={payDebt} submitLabel="Registrar" submitVariant="secondary" className="mt-2 grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                          <input type="hidden" name="debt_id" value={d.id} />
                          <Field label="Valor" name="amount" type="number" step="0.01" required defaultValue={Number(d.min_payment) || undefined} />
                          <Field label="Data" name="date" type="date" defaultValue={today} required />
                        </ActionForm>
                      </details>
                    )}
                  </li>
                );
              })}
          </ul>
          <details className="mt-3 rounded-lg border bg-card p-4" open={(debts ?? []).length === 0}>
            <summary className="cursor-pointer text-sm font-medium">Cadastrar dívida</summary>
            <ActionForm action={createDebt} submitLabel="Cadastrar" className="mt-3 grid gap-2 sm:grid-cols-2">
              <Field label="Nome" name="name" required placeholder="Cartão, empréstimo…" />
              <Field label="Credor" name="creditor" />
              <Field label="Saldo devedor (R$)" name="original_amount" type="number" step="0.01" required />
              <Field label="Juros ao mês (%)" name="interest_rate_month" type="number" step="0.01" defaultValue={0} />
              <Field label="Parcela (R$)" name="min_payment" type="number" step="0.01" />
              <Field label="Dia do vencimento" name="due_day" type="number" min={1} max={31} />
            </ActionForm>
          </details>
        </section>
      </div>
    </>
  );
}
