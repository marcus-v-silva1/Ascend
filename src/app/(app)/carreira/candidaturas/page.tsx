import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";
import { ActionForm, Field } from "@/components/action-form";
import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth";
import { formatDate, localDate, relativeDays } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { createApplication, deleteApplication, setApplicationStatus } from "../actions";

// Página com dados do usuário: pode esperar os dados (o loading.tsx mostra o esqueleto)
export const instant = false;

export const metadata: Metadata = { title: "Candidaturas" };

const COLUMNS = [
  { status: "wishlist", label: "Quero aplicar" },
  { status: "applied", label: "Enviada" },
  { status: "screening", label: "Triagem" },
  { status: "interview", label: "Entrevistas" },
  { status: "offer", label: "Oferta" },
] as const;
const CLOSED = [
  { status: "rejected", label: "Recusada" },
  { status: "withdrawn", label: "Desisti" },
] as const;
const ALL = [...COLUMNS, ...CLOSED];

type App = {
  id: string;
  company: string;
  role: string;
  country: string | null;
  city: string | null;
  url: string | null;
  status: (typeof ALL)[number]["status"];
  applied_at: string | null;
  next_step: string | null;
  next_step_at: string | null;
  salary: string | null;
  visa_route: string | null;
  notes: string | null;
};

function AppCard({ a, today }: { a: App; today: string }) {
  const late = a.next_step_at && a.next_step_at < today;
  return (
    <li className="rounded-md border bg-card p-3 text-sm">
      <p className="font-medium">{a.company}</p>
      <p className="text-muted-foreground">{a.role}</p>
      <p className="text-xs text-muted-foreground">{[a.city, a.country].filter(Boolean).join(", ")}{a.visa_route && ` · ${a.visa_route}`}</p>
      {a.next_step && (
        <p className={cn("mt-2 text-xs", late ? "text-destructive" : "text-warn-foreground dark:text-warn")}>
          Próximo: {a.next_step}{a.next_step_at && ` (${relativeDays(a.next_step_at)})`}
        </p>
      )}
      {a.applied_at && <p className="mt-1 text-xs text-muted-foreground">Enviada {formatDate(a.applied_at, true)}</p>}
      <div className="mt-2 flex items-center gap-2">
        <form action={setApplicationStatus} className="flex-1">
          <input type="hidden" name="id" value={a.id} />
          <label htmlFor={`as-${a.id}`} className="sr-only">Mover para</label>
          <select
            id={`as-${a.id}`}
            name="status"
            defaultValue={a.status}
            className="field h-7 py-0 text-xs"
          >
            {ALL.map((c) => <option key={c.status} value={c.status}>{c.label}</option>)}
          </select>
          <button type="submit" className="mt-1 text-xs text-primary underline-offset-4 hover:underline">mover</button>
        </form>
        {a.url && (
          <a href={a.url} target="_blank" rel="noreferrer" aria-label={`Abrir vaga ${a.company}`} className="text-muted-foreground hover:text-foreground">
            <ExternalLink className="size-4" />
          </a>
        )}
      </div>
    </li>
  );
}

export default async function ApplicationsPage() {
  const { supabase } = await requireUser();
  const { data } = await supabase
    .from("applications")
    .select("id, company, role, country, city, url, status, applied_at, next_step, next_step_at, salary, visa_route, notes")
    .order("created_at", { ascending: false });
  const apps = (data ?? []) as App[];
  const today = localDate();
  const sent = apps.filter((a) => a.status !== "wishlist").length;
  const interviews = apps.filter((a) => a.status === "interview" || a.status === "offer").length;
  const closed = apps.filter((a) => a.status === "rejected" || a.status === "withdrawn");

  return (
    <>
      <PageHeader
        title="Candidaturas"
        description={`${sent} enviadas · ${interviews} com entrevista. Meta: 60 candidaturas, 3 por terça e quinta. Os resultados-chave da meta Europa atualizam sozinhos.`}
      />

      <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        <div className="grid min-w-[56rem] grid-cols-5 gap-3">
          {COLUMNS.map((col) => {
            const items = apps.filter((a) => a.status === col.status);
            return (
              <section key={col.status} aria-labelledby={`col-${col.status}`} className="rounded-lg bg-muted/60 p-2">
                <h2 id={`col-${col.status}`} className="flex justify-between px-1 pb-2 text-sm font-medium">
                  {col.label}
                  <span className="num text-muted-foreground">{items.length}</span>
                </h2>
                <ul className="space-y-2">
                  {items.map((a) => <AppCard key={a.id} a={a} today={today} />)}
                </ul>
              </section>
            );
          })}
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1fr]">
        <section aria-labelledby="new-app" className="rounded-lg border bg-card p-5">
          <h2 id="new-app" className="mb-4 text-lg font-semibold">Nova candidatura</h2>
          <ActionForm action={createApplication} submitLabel="Salvar candidatura">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Empresa" name="company" required />
              <Field label="Vaga" name="role" required placeholder="QA Engineer" />
              <Field label="País" name="country" placeholder="Irlanda" />
              <Field label="Cidade" name="city" placeholder="Dublin" />
              <Field label="Rota de visto" name="visa_route" placeholder="Critical Skills / Blue Card" />
              <Field label="Salário" name="salary" placeholder="€55k" />
            </div>
            <Field label="Link da vaga" name="url" type="url" />
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="app-status" className="field-label">Situação</label>
                <select id="app-status" name="status" defaultValue="applied" className="field">
                  {ALL.map((c) => <option key={c.status} value={c.status}>{c.label}</option>)}
                </select>
              </div>
              <Field label="Data de envio" name="applied_at" type="date" />
              <Field label="Próximo passo" name="next_step" placeholder="Follow-up com recruiter" />
              <Field label="Quando" name="next_step_at" type="date" />
            </div>
          </ActionForm>
        </section>

        {closed.length > 0 && (
          <section aria-labelledby="closed">
            <h2 id="closed" className="mb-3 text-lg font-semibold">Encerradas</h2>
            <ul className="divide-y rounded-lg border bg-card text-sm">
              {closed.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <span>
                    {a.company} · <span className="text-muted-foreground">{a.role}</span>
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">{ALL.find((c) => c.status === a.status)?.label}</span>
                    <form action={deleteApplication}>
                      <input type="hidden" name="id" value={a.id} />
                      <button type="submit" className="text-xs text-muted-foreground hover:text-destructive">excluir</button>
                    </form>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
