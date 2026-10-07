import type { Metadata } from "next";
import { Suspense } from "react";
import { AscendLogo, AscendMark, ContourLines } from "@/components/brand";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar" };

const ERRORS: Record<string, string> = {
  forbidden: "Esta conta não tem acesso a este app.",
  link: "O link expirou ou já foi usado. Peça um novo.",
};

// Os três pilares do método, em ordem de subida
const STEPS = [
  { label: "Questões e flashcards", detail: "Testar a memória, não reler" },
  { label: "Revisão espaçada", detail: "Cada cartão volta antes de você esquecer" },
  { label: "Metas com gatilho", detail: "Quando acontecer X, eu faço Y" },
];

async function LoginFormWithParams({ searchParams }: { searchParams: PageProps<"/login">["searchParams"] }) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : undefined;
  const error = typeof params.error === "string" ? ERRORS[params.error] : undefined;
  return <LoginForm next={next} initialError={error} />;
}

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <main className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      <section className="relative hidden overflow-hidden bg-ink text-white lg:flex lg:flex-col lg:justify-between lg:p-12" aria-label="Sobre o Ascend">
        <ContourLines className="absolute -right-40 -bottom-48 size-[46rem] text-glacier/15" />
        <AscendLogo className="relative text-white" />

        <div className="relative max-w-md">
          <p className="font-[family-name:var(--font-sora)] text-[2.6rem] leading-[1.08] font-semibold tracking-[-0.03em]">
            Cada dia de estudo é um degrau.
          </p>
          <ol className="mt-10 space-y-5">
            {STEPS.map((s, i) => (
              <li key={s.label} className="flex gap-4">
                <span className="num mt-0.5 font-[family-name:var(--font-sora)] text-sm text-summit">{String(i + 1).padStart(2, "0")}</span>
                <span>
                  <span className="block font-medium">{s.label}</span>
                  <span className="block text-sm text-white/60">{s.detail}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>

        <p className="relative text-xs text-white/40">Uso pessoal. Acesso restrito ao dono.</p>
      </section>

      <section className="relative flex items-center justify-center overflow-hidden px-4 py-12 lg:border-l lg:border-white/5">
        <ContourLines className="absolute -top-56 -right-56 size-[30rem] text-primary/10 lg:hidden" />
        <div className="relative w-full max-w-sm">
          <AscendMark className="mb-6 size-10 text-ink lg:hidden dark:text-white" />
          <h1 className="text-3xl font-semibold tracking-[-0.02em]">Entrar no Ascend</h1>
          <p className="mt-1 mb-8 text-muted-foreground">Continue de onde parou.</p>
          <Suspense fallback={<LoginForm />}>
            <LoginFormWithParams searchParams={searchParams} />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
