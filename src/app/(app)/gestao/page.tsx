import type { Metadata } from "next";
import { ActionForm, Field } from "@/components/action-form";
import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth";
import { createTask } from "./actions";
import { KanbanBoard, type Task } from "./kanban-board";

// Página com dados do usuário: pode esperar os dados (o loading.tsx mostra o esqueleto)
export const instant = false;

export const metadata: Metadata = { title: "Tarefas" };

export default async function TasksPage() {
  const { supabase } = await requireUser();
  const [{ data: tasks }, { data: goals }] = await Promise.all([
    supabase.from("tasks").select("id, title, status, position, priority, due_date, goals(title)").order("position"),
    supabase.from("goals").select("id, title").eq("status", "active").order("position"),
  ]);

  type Row = Omit<Task, "goal"> & { goals: { title: string } | null };
  const initial: Task[] = ((tasks ?? []) as unknown as Row[]).map((t) => ({
    id: t.id,
    title: t.title,
    status: t.status,
    position: Number(t.position),
    priority: t.priority,
    due_date: t.due_date,
    goal: t.goals?.title ?? null,
  }));

  return (
    <>
      <PageHeader title="Tarefas" description="Arraste entre colunas. Poucas coisas em “Fazendo” = mais coisas terminadas." />
      <details className="mb-6 rounded-lg border bg-card p-4" open={initial.length === 0}>
        <summary className="cursor-pointer text-sm font-medium">Nova tarefa</summary>
        <ActionForm action={createTask} submitLabel="Adicionar" className="mt-3 grid gap-3 sm:grid-cols-[2fr_1fr_1fr_1fr] sm:items-end">
          <Field label="Tarefa" name="title" required placeholder="Ex.: Fazer o Scrum Open" />
          <div>
            <label htmlFor="t-status" className="field-label">Coluna</label>
            <select id="t-status" name="status" defaultValue="todo" className="field">
              <option value="backlog">Backlog</option>
              <option value="todo">Esta semana</option>
              <option value="doing">Fazendo</option>
            </select>
          </div>
          <div>
            <label htmlFor="t-prio" className="field-label">Prioridade</label>
            <select id="t-prio" name="priority" defaultValue="2" className="field">
              <option value="1">Alta</option>
              <option value="2">Média</option>
              <option value="3">Baixa</option>
            </select>
          </div>
          <Field label="Prazo" name="due_date" type="date" />
          <div className="sm:col-span-3">
            <label htmlFor="t-goal" className="field-label">Meta relacionada</label>
            <select id="t-goal" name="goal_id" defaultValue="" className="field">
              <option value="">Nenhuma</option>
              {(goals ?? []).map((g: { id: string; title: string }) => <option key={g.id} value={g.id}>{g.title}</option>)}
            </select>
          </div>
        </ActionForm>
      </details>
      <KanbanBoard key={initial.map((t) => `${t.id}${t.status}${t.position}`).join()} initial={initial} />
    </>
  );
}
