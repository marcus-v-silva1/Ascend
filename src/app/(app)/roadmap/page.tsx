import type { Metadata } from "next";
import Link from "next/link";
import { CircleCheck, CircleDashed, CircleDot, Lock, SkipForward } from "lucide-react";
import { ROADMAPS } from "@/content/roadmap";
import { requireUser } from "@/lib/auth";
import { getRoadmap } from "@/lib/data/roadmap";
import { nextSteps, roadmapSummary } from "@/lib/roadmap";
import { cn } from "@/lib/utils";
import { NextStepsList, RoadmapView, type ViewNode } from "./roadmap-view";

// Página com dados do usuário: pode esperar os dados (o loading.tsx mostra o esqueleto)
export const instant = false;

export const metadata: Metadata = { title: "Roadmap" };

export default async function RoadmapPage({ searchParams }: PageProps<"/roadmap">) {
  const sp = await searchParams;
  const roadmapId = ROADMAPS.some((r) => r.id === sp.r) ? String(sp.r) : "europa";
  const meta = ROADMAPS.find((r) => r.id === roadmapId)!;
  const { supabase } = await requireUser();
  const nodes = (await getRoadmap(supabase, roadmapId)) as unknown as ViewNode[];
  const summary = roadmapSummary(nodes);
  const steps = nextSteps(nodes as never, 3) as unknown as ViewNode[];

  return (
    <>
      <nav aria-label="Roadmaps" className="mb-6 flex flex-wrap gap-2">
        {ROADMAPS.map((r) => (
          <Link
            key={r.id}
            href={`/roadmap?r=${r.id}`}
            aria-current={r.id === roadmapId ? "page" : undefined}
            className={cn(
              "rounded-full border px-3 py-1 text-sm",
              r.id === roadmapId ? "border-primary bg-accent font-medium text-accent-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {r.title}
          </Link>
        ))}
      </nav>

      <header className="mb-8 grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">{meta.title}</h1>
          <p className="mt-1 max-w-2xl text-muted-foreground">{meta.description}</p>
        </div>
        <div>
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-muted-foreground">Tópicos concluídos</span>
            <span className="num">
              <span className="font-[family-name:var(--font-sora)] text-2xl font-semibold">{summary.pct}%</span>
              <span className="text-muted-foreground"> · {summary.done} de {summary.total}</span>
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted" aria-hidden>
            <div className="h-full rounded-full bg-success" style={{ width: `${summary.pct}%` }} />
          </div>
        </div>
      </header>

      {steps.length > 0 && (
        <section aria-labelledby="next" className="mb-8">
          <h2 id="next" className="mb-2 text-sm font-medium">Próximos passos liberados</h2>
          <NextStepsList steps={steps} nodes={nodes} />
        </section>
      )}

      <ul className="mb-6 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground" aria-label="Legenda">
        <li className="flex items-center gap-1.5"><CircleCheck className="size-3.5 text-success" aria-hidden /> Feito</li>
        <li className="flex items-center gap-1.5"><CircleDot className="size-3.5 text-summit" aria-hidden /> Fazendo</li>
        <li className="flex items-center gap-1.5"><CircleDashed className="size-3.5" aria-hidden /> A fazer</li>
        <li className="flex items-center gap-1.5"><Lock className="size-3.5" aria-hidden /> Depende de outro tópico</li>
        <li className="flex items-center gap-1.5"><SkipForward className="size-3.5" aria-hidden /> Pulado</li>
        <li>Clique num item para ver detalhes e marcar o progresso.</li>
      </ul>

      {nodes.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">Este roadmap ainda não foi carregado. Recarregue a página.</p>
      ) : (
        <RoadmapView nodes={nodes} roadmap={roadmapId} />
      )}
    </>
  );
}
