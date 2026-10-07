import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth";
import { TargetsBoard, type Target } from "./targets-board";

// Página com dados do usuário: pode esperar os dados (o loading.tsx mostra o esqueleto)
export const instant = false;

export const metadata: Metadata = { title: "Concursos e países" };

export default async function TargetsPage() {
  const { supabase } = await requireUser();
  const { data } = await supabase
    .from("targets")
    .select("id, track_id, kind, name, location, salary_text, compatibility, difficulty, salary_score, location_score, status, exam_date, url, notes")
    .order("created_at");
  const targets = ((data ?? []) as Target[]).map((t) => ({
    ...t,
    compatibility: t.compatibility === null ? null : Number(t.compatibility),
    difficulty: t.difficulty === null ? null : Number(t.difficulty),
    salary_score: t.salary_score === null ? null : Number(t.salary_score),
    location_score: t.location_score === null ? null : Number(t.location_score),
  }));

  return (
    <>
      <PageHeader
        title="Concursos e países"
        description="Nota de 0 a 10 combinando compatibilidade com o que você já sabe, facilidade de entrada, salário e localização. Ajuste os pesos e o ranking muda."
      />
      <div className="space-y-10">
        <div>
          <h2 className="mb-3 text-xl font-semibold">Concursos de TI</h2>
          <TargetsBoard title="Concursos" kind="concurso" targets={targets.filter((t) => t.kind === "concurso")} />
        </div>
        <div>
          <h2 className="mb-3 text-xl font-semibold">Rotas internacionais</h2>
          <TargetsBoard title="Países" kind="country" targets={targets.filter((t) => t.kind !== "concurso")} />
        </div>
      </div>
    </>
  );
}
