"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export type DayPoint = { date: string; label: string; answered: number; correct: number };

function ChartTooltip({ active, payload }: { active?: boolean; payload?: { payload: DayPoint }[] }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-medium">{p.label}</p>
      <p className="num text-muted-foreground">
        {p.answered} questões{p.answered > 0 && ` · ${Math.round((p.correct / p.answered) * 100)}% de acerto`}
      </p>
    </div>
  );
}

/** Questões respondidas por dia. Uma série só: o título nomeia, sem legenda. */
export function QuestionsChart({ data }: { data: DayPoint[] }) {
  const total = data.reduce((s, d) => s + d.answered, 0);
  return (
    <figure>
      <div className="h-44" role="img" aria-label={`Questões respondidas nos últimos ${data.length} dias: ${total} no total.`}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }} barCategoryGap={2}>
            <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="0" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} interval="preserveStartEnd" minTickGap={16} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} width={28} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.6 }} />
            <Bar dataKey="answered" fill="var(--chart-1)" radius={[4, 4, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <details className="mt-2 text-xs text-muted-foreground">
        <summary className="cursor-pointer">Ver como tabela</summary>
        <table className="num mt-2 w-full">
          <thead>
            <tr className="text-left"><th className="font-medium">Dia</th><th className="font-medium">Questões</th><th className="font-medium">Acertos</th></tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.date}><td>{d.label}</td><td>{d.answered}</td><td>{d.correct}</td></tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
