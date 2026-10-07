import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";

// Página com dados do usuário: pode esperar os dados (o loading.tsx mostra o esqueleto)
export const instant = false;

export const metadata: Metadata = { title: "Como estudar" };

const METHODS = [
  {
    name: "Testar a si mesmo (prática de recuperação)",
    rating: "Alta eficácia",
    what: "Tentar lembrar a resposta antes de ver. O esforço de buscar na memória é o que fixa, mesmo quando você erra.",
    how: "O estudo principal aqui é por questões e flashcards. Leia o material só para entender o que errou.",
    href: "/estudos",
    ref: "Roediger & Karpicke (2006); Dunlosky et al. (2013)",
  },
  {
    name: "Espaçar as revisões",
    rating: "Alta eficácia",
    what: "Rever o conteúdo em intervalos crescentes rende mais que a mesma quantidade de horas concentrada num dia só.",
    how: "O FSRS agenda cada flashcard para pouco antes de você esquecer. Faça a fila do dia, todo dia.",
    href: "/flashcards",
    ref: "Cepeda et al. (2006); Dunlosky et al. (2013)",
  },
  {
    name: "Reaprender em sessões sucessivas",
    rating: "Alta eficácia",
    what: "Combinar as duas anteriores: voltar ao mesmo item em dias diferentes até acertar várias vezes.",
    how: "Uma questão só conta como dominada depois de acertos em 3 dias diferentes.",
    href: "/estudos",
    ref: "Rawson & Dunlosky (2011, 2022)",
  },
  {
    name: "Intercalar assuntos",
    rating: "Eficácia moderada",
    what: "Misturar tipos de problema na mesma sessão obriga a escolher a estratégia certa, como na prova.",
    how: "Marcar vários tópicos ao praticar alterna as questões entre eles automaticamente.",
    href: "/estudos",
    ref: "Rohrer & Taylor (2007); Dunlosky et al. (2013)",
  },
  {
    name: "Explicar com suas palavras",
    rating: "Eficácia moderada",
    what: "Autoexplicação e perguntar “por quê?” conectam a informação nova ao que você já sabe.",
    how: "Ao errar, escreva “por que errei”. O texto vai para o verso do flashcard.",
    href: "/estudos",
    ref: "Dunlosky et al. (2013)",
  },
  {
    name: "Gatilhos de implementação",
    rating: "Efeito médio a grande",
    what: "Planos no formato “quando X acontecer, farei Y” dobram a chance de transformar intenção em ação.",
    how: "Cada meta e cada hábito têm um gatilho. Escolha algo que você já faz todo dia.",
    href: "/carreira",
    ref: "Gollwitzer & Sheeran (2006), meta-análise com 94 estudos",
  },
];

const AVOID = [
  { name: "Reler", why: "Dá sensação de familiaridade, não de memória. Pouco efeito para o tempo gasto." },
  { name: "Grifar e sublinhar", why: "Quase não ajuda e pode atrapalhar se substituir o teste." },
  { name: "Resumir", why: "Funciona só para quem já resume muito bem; para a maioria, custo alto e ganho baixo." },
];

const WEEK = [
  { day: "Todo dia", plan: "Flashcards do dia (10–15 min) + 20 questões misturadas + 30 min de inglês." },
  { day: "Seg, qua, sex", plan: "45 min de automação/portfólio (Playwright, API testing, CI)." },
  { day: "Ter, qui", plan: "3 candidaturas para Irlanda/Alemanha às 20h." },
  { day: "Sábado", plan: "1 simulado completo da certificação da vez + 1h de currículo/LinkedIn." },
  { day: "Domingo", plan: "Revisão semanal de 15 min: números, o que travou, 3 prioridades." },
];

export default function HowToStudyPage() {
  return (
    <>
      <PageHeader
        title="Como estudar"
        description="O que as pesquisas mostram que funciona, e onde cada técnica está neste app. Base: a revisão de Dunlosky et al. (2013), que avaliou 10 técnicas populares."
      />

      <section aria-labelledby="works">
        <h2 id="works" className="mb-4 text-xl font-semibold">O que funciona</h2>
        <ol className="grid gap-4 md:grid-cols-2">
          {METHODS.map((m, i) => (
            <li key={m.name} className="rounded-lg border bg-card p-5">
              <p className="text-xs text-muted-foreground">
                <span className="num">{i + 1}</span> · {m.rating}
              </p>
              <h3 className="mt-1 text-lg font-semibold">{m.name}</h3>
              <p className="mt-2 text-sm leading-relaxed">{m.what}</p>
              <p className="mt-3 rounded-md bg-accent px-3 py-2 text-sm text-accent-foreground">
                <span className="font-medium">No app: </span>
                {m.how}{" "}
                <Link href={m.href} className="underline underline-offset-4">Abrir</Link>
              </p>
              <p className="mt-3 text-xs text-muted-foreground">{m.ref}</p>
            </li>
          ))}
        </ol>
      </section>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section aria-labelledby="avoid">
          <h2 id="avoid" className="mb-4 text-xl font-semibold">O que rende pouco</h2>
          <ul className="space-y-3">
            {AVOID.map((a) => (
              <li key={a.name} className="rounded-lg border bg-card p-4">
                <p className="font-medium">{a.name}</p>
                <p className="text-sm text-muted-foreground">{a.why}</p>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-muted-foreground">
            Pomodoro (blocos de foco com pausa) não está nessa revisão, mas ajuda a começar e a medir horas reais de estudo. Use em{" "}
            <Link href="/gestao/foco" className="underline underline-offset-4">Foco</Link>.
          </p>
        </section>

        <section aria-labelledby="week">
          <h2 id="week" className="mb-4 text-xl font-semibold">Uma semana que cabe na rotina</h2>
          <dl className="divide-y rounded-lg border bg-card">
            {WEEK.map((w) => (
              <div key={w.day} className="grid grid-cols-[7rem_1fr] gap-3 px-4 py-3 text-sm">
                <dt className="font-medium">{w.day}</dt>
                <dd>{w.plan}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-sm text-muted-foreground">
            Critério para marcar uma prova: 3 simulados seguidos acima da nota de prontidão (95% no PSM I). Antes disso, é dinheiro arriscado.
          </p>
        </section>
      </div>

      <section aria-labelledby="refs" className="mt-10">
        <h2 id="refs" className="mb-3 text-lg font-semibold">Referências</h2>
        <ul className="space-y-1.5 text-sm text-muted-foreground">
          <li>Dunlosky, J. et al. (2013). Improving students’ learning with effective learning techniques. <i>Psychological Science in the Public Interest</i>, 14(1), 4–58.</li>
          <li>Roediger, H. L. & Karpicke, J. D. (2006). Test-enhanced learning. <i>Psychological Science</i>, 17(3), 249–255.</li>
          <li>Cepeda, N. J. et al. (2006). Distributed practice in verbal recall tasks: a review and quantitative synthesis. <i>Psychological Bulletin</i>, 132(3), 354–380.</li>
          <li>Rohrer, D. & Taylor, K. (2007). The shuffling of mathematics problems improves learning. <i>Instructional Science</i>, 35, 481–498.</li>
          <li>Rawson, K. A. & Dunlosky, J. (2011). Optimizing schedules of retrieval practice for durable and efficient learning. <i>Journal of Experimental Psychology: General</i>, 140(3), 283–302.</li>
          <li>Gollwitzer, P. M. & Sheeran, P. (2006). Implementation intentions and goal achievement: a meta-analysis. <i>Advances in Experimental Social Psychology</i>, 38, 69–119.</li>
          <li>Ye, J. et al. FSRS — Free Spaced Repetition Scheduler (algoritmo usado no Anki desde a versão 23.10).</li>
        </ul>
      </section>
    </>
  );
}
