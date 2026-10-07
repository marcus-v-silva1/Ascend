"use client";

import { useMemo, useState, useTransition } from "react";
import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import { formatDate } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { deleteTask, moveTask } from "./actions";

export type Status = "backlog" | "todo" | "doing" | "done";
export type Task = {
  id: string;
  title: string;
  status: Status;
  position: number;
  priority: number;
  due_date: string | null;
  goal: string | null;
};

const COLUMNS: { status: Status; label: string; hint: string }[] = [
  { status: "backlog", label: "Backlog", hint: "Ideias e coisas para depois" },
  { status: "todo", label: "Esta semana", hint: "Escolha poucas" },
  { status: "doing", label: "Fazendo", hint: "Limite: 3" },
  { status: "done", label: "Feito", hint: "" },
];
const WIP_LIMIT = 3;
const PRIORITY = ["", "alta", "média", "baixa"];

function TaskCard({ task, overlay }: { task: Task; overlay?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-md border bg-card p-3 text-sm shadow-xs",
        overlay && "rotate-1 shadow-lg",
        task.status === "done" && "text-muted-foreground",
      )}
    >
      <p className={task.status === "done" ? "line-through" : undefined}>{task.title}</p>
      <div className="mt-1.5 flex flex-wrap gap-x-2 text-xs text-muted-foreground">
        {task.priority === 1 && <span className="text-destructive">prioridade alta</span>}
        {task.priority === 3 && <span>{PRIORITY[3]}</span>}
        {task.due_date && <span>até {formatDate(task.due_date, true)}</span>}
        {task.goal && <span className="truncate">↳ {task.goal}</span>}
      </div>
    </div>
  );
}

function SortableTask({ task, onDelete }: { task: Task; onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id, data: { status: task.status } });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("group relative touch-none", isDragging && "opacity-40")}
      {...attributes}
      {...listeners}
    >
      <TaskCard task={task} />
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => onDelete(task.id)}
        className="absolute top-1.5 right-1.5 hidden rounded px-1 text-xs text-muted-foreground group-hover:block hover:text-destructive"
        aria-label={`Excluir ${task.title}`}
      >
        ×
      </button>
    </li>
  );
}

function Column({ status, label, hint, tasks, onDelete }: { status: Status; label: string; hint: string; tasks: Task[]; onDelete: (id: string) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: status, data: { status } });
  const overLimit = status === "doing" && tasks.length > WIP_LIMIT;
  return (
    <section aria-labelledby={`col-${status}`} className={cn("flex min-h-64 flex-col rounded-lg bg-muted/60 p-2", isOver && "ring-2 ring-primary/40")}>
      <header className="px-1 pb-2">
        <h2 id={`col-${status}`} className="flex justify-between text-sm font-medium">
          {label}
          <span className={cn("num", overLimit ? "text-destructive" : "text-muted-foreground")}>{tasks.length}</span>
        </h2>
        {hint && <p className={cn("text-xs", overLimit ? "text-destructive" : "text-muted-foreground")}>{overLimit ? "Muita coisa ao mesmo tempo. Termine algo antes." : hint}</p>}
      </header>
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <ul ref={setNodeRef} className="flex flex-1 flex-col gap-2">
          {tasks.map((t) => <SortableTask key={t.id} task={t} onDelete={onDelete} />)}
        </ul>
      </SortableContext>
    </section>
  );
}

export function KanbanBoard({ initial }: { initial: Task[] }) {
  const [tasks, setTasks] = useState(initial);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const byStatus = useMemo(() => {
    const map: Record<Status, Task[]> = { backlog: [], todo: [], doing: [], done: [] };
    for (const t of [...tasks].sort((a, b) => a.position - b.position)) map[t.status].push(t);
    return map;
  }, [tasks]);

  const active = tasks.find((t) => t.id === activeId) ?? null;

  const statusOf = (id: string): Status | undefined =>
    (["backlog", "todo", "doing", "done"] as Status[]).includes(id as Status) ? (id as Status) : tasks.find((t) => t.id === id)?.status;

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  // Ao passar sobre outra coluna, move o cartão para ela (feedback imediato)
  function onDragOver(e: DragOverEvent) {
    const overId = e.over ? String(e.over.id) : null;
    if (!overId) return;
    const to = statusOf(overId);
    const from = statusOf(String(e.active.id));
    if (!to || !from || to === from) return;
    setTasks((ts) => ts.map((t) => (t.id === e.active.id ? { ...t, status: to } : t)));
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const id = String(e.active.id);
    const overId = e.over ? String(e.over.id) : null;
    if (!overId) return;
    const status = statusOf(overId) ?? statusOf(id);
    if (!status) return;

    const column = byStatus[status].filter((t) => t.id !== id);
    let index = column.findIndex((t) => t.id === overId);
    if (index === -1) index = column.length;
    const before = column[index - 1]?.position;
    const after = column[index]?.position;
    // Posição fracionária entre vizinhos: só a tarefa movida é atualizada
    const position = before === undefined && after === undefined ? 0 : before === undefined ? after! - 1 : after === undefined ? before + 1 : (before + after) / 2;

    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, status, position } : t)));
    startTransition(async () => {
      try {
        await moveTask({ id, status, position });
      } catch {
        toast.error("Não foi possível mover a tarefa.");
        setTasks(initial);
      }
    });
  }

  function onDelete(id: string) {
    setTasks((ts) => ts.filter((t) => t.id !== id));
    startTransition(async () => {
      await deleteTask({ id });
    });
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onDragStart} onDragOver={onDragOver} onDragEnd={onDragEnd}>
      <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        <div className="grid min-w-[48rem] grid-cols-4 gap-3">
          {COLUMNS.map((c) => (
            <Column key={c.status} {...c} tasks={byStatus[c.status]} onDelete={onDelete} />
          ))}
        </div>
      </div>
      <DragOverlay>{active ? <TaskCard task={active} overlay /> : null}</DragOverlay>
    </DndContext>
  );
}
